import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
const gTTS = require('gtts');

// 브라우저 음성 이름에서 gtts 언어 코드로 매핑하는 함수
function getLanguageCodeFromVoice(voice) {
  // 기본값은 영어
  let langCode = 'en';

  if (!voice) return langCode;

  // 음성 이름에서 언어 코드 추출 시도
  // 예: "Microsoft Heami - Korean (Korea)" => "ko"
  // 예: "Google русский" => "ru"

  const voiceLower = voice.toLowerCase();

  // 언어 매핑 테이블
  const languageMap = {
    'ko': ['korean', 'korea', '한국어', 'ko-kr', 'ko-'],
    'en': ['english', 'united states', 'united kingdom', 'en-us', 'en-gb', 'en-'],
    'ja': ['japanese', 'japan', '日本語', 'ja-jp', 'ja-'],
    'zh': ['chinese', 'china', '中文', 'zh-cn', 'zh-tw', 'zh-'],
    'ru': ['russian', 'russia', 'русский', 'ru-ru', 'ru-']
  };

  // 음성 이름에서 언어 코드 찾기
  for (const [code, keywords] of Object.entries(languageMap)) {
    if (keywords.some(keyword => voiceLower.includes(keyword))) {
      return code;
    }
  }

  // 직접 언어 코드가 포함된 경우 (예: en-US)
  if (voice.includes('(')) {
    const match = voice.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const langPart = match[1].toLowerCase().trim();
      // 처음 2자가 지원되는 언어 코드인지 확인
      const twoLetterCode = langPart.slice(0, 2);
      if (Object.keys(languageMap).includes(twoLetterCode)) {
        return twoLetterCode;
      }
    }
  }

  // IETF 언어 태그 형식 (ko-KR, en-US 등) 확인
  const langMatch = voice.match(/([a-z]{2})-[A-Z]{2}/);
  if (langMatch && langMatch[1]) {
    return langMatch[1];
  }

  return langCode; // 기본값 반환
}

// FFmpeg가 설치되어 있는지 확인하는 함수
function isFFmpegInstalled() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('FFmpeg가 설치되어 있지 않습니다. 속도와 피치 조절이 제한됩니다.');
    return false;
  }
}

export async function POST(request) {
  try {
    const {
      text,
      voice = '',
      language = 'auto',
      rate = 1,
      pitch = 1,
      fileName = 'text-to-speech'
    } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // 언어 코드 결정: 명시적 language 매개변수 우선, 없으면 음성에서 추출
    const langCode = language !== 'auto' && language ? language : getLanguageCodeFromVoice(voice);
    console.log(`Voice: ${voice}, Language: ${language}, Detected language: ${langCode}, Rate: ${rate}, Pitch: ${pitch}`);

    // 임시 파일 경로 생성
    const tempDir = os.tmpdir();
    const originalFileName = `original-tts-${uuidv4()}.mp3`;
    const processedFileName = `processed-tts-${uuidv4()}.mp3`;
    const originalFilePath = path.join(tempDir, originalFileName);
    const processedFilePath = path.join(tempDir, processedFileName);

    // gTTS 인스턴스 생성 (언어 설정 적용)
    const slow = rate <= 0.8; // 느린 속도 옵션 (gTTS의 제한적 지원)
    const gtts = new gTTS(text, langCode, slow);

    // 파일로 저장
    await new Promise((resolve, reject) => {
      gtts.save(originalFilePath, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    let audioBuffer;
    const ffmpegInstalled = isFFmpegInstalled();

    // FFmpeg가 설치되어 있고 rate나 pitch가 기본값(1.0)과 다른 경우에만 처리
    if (ffmpegInstalled && (rate != 1 || pitch != 1)) {
      try {
        // 속도와 피치 조절을 위한 FFmpeg 명령어
        // rate는 속도(0.5~2.0), pitch는 피치 변경(0.5~2.0)
        // atempo는 0.5~2.0 범위만 지원하므로, 범위를 초과하면 여러 번 적용
        let atempoFilter = '';
        let pitchFilter = '';

        // 속도 필터 구성
        if (rate != 1) {
          if (rate < 0.5) {
            atempoFilter = 'atempo=0.5';
          } else if (rate > 2.0) {
            atempoFilter = 'atempo=2.0';
          } else {
            atempoFilter = `atempo=${rate}`;
          }
        }

        // 피치 필터 구성 (asetrate와 aresample 조합)
        if (pitch != 1) {
          const pitchValue = Math.max(0.5, Math.min(2.0, pitch));
          pitchFilter = `asetrate=44100*${pitchValue},aresample=44100`;
        }

        // 필터 문자열 생성
        let filterString = '';
        if (atempoFilter && pitchFilter) {
          filterString = `${atempoFilter},${pitchFilter}`;
        } else if (atempoFilter) {
          filterString = atempoFilter;
        } else if (pitchFilter) {
          filterString = pitchFilter;
        }

        // FFmpeg 명령어 실행
        if (filterString) {
          execSync(`ffmpeg -i "${originalFilePath}" -filter:a "${filterString}" -y "${processedFilePath}"`, {
            stdio: 'inherit'
          });

          // 처리된 파일 읽기
          audioBuffer = fs.readFileSync(processedFilePath);

          // 처리된 파일 삭제
          fs.unlinkSync(processedFilePath);
        } else {
          // 필터가 없으면 원본 파일 사용
          audioBuffer = fs.readFileSync(originalFilePath);
        }
      } catch (ffmpegError) {
        console.error('FFmpeg 처리 오류:', ffmpegError);
        // FFmpeg 처리 오류 시 원본 파일 사용
        audioBuffer = fs.readFileSync(originalFilePath);
      }
    } else {
      // FFmpeg가 없거나 속도/피치 조절이 필요 없으면 원본 파일 사용
      audioBuffer = fs.readFileSync(originalFilePath);
    }

    // 원본 파일 삭제
    fs.unlinkSync(originalFilePath);

    // 오디오 데이터 반환
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${fileName}.mp3"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('TTS API 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}