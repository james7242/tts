import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import { getLanguageCodeFromVoice, isFFmpegInstalled } from '@/lib/tts/languages'; // 공통 모듈 임포트
const gTTS = require('gtts');



export async function POST(request) {
  try {
    const {
      text,
      voice = '',
      language = 'auto',
      rate = 1,
      pitch = 1
    } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // 언어 코드 결정: 명시적 language 매개변수 우선, 없으면 음성에서 추출
    const langCode = language !== 'auto' && language ? language : getLanguageCodeFromVoice(voice);
    console.log(`Stream - Voice: ${voice}, Language: ${language}, Detected language: ${langCode}, Rate: ${rate}, Pitch: ${pitch}`);

    // 임시 파일 경로 생성
    const tempDir = os.tmpdir();
    const originalFileName = `original-stream-${uuidv4()}.mp3`;
    const processedFileName = `processed-stream-${uuidv4()}.mp3`;
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

    // 오디오 데이터 반환 (스트리밍용)
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'X-FFmpeg-Installed': ffmpegInstalled ? 'true' : 'false'
      }
    });
  } catch (error) {
    console.error('TTS 스트리밍 API 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}