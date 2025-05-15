// lib/languages.js

// 지원되는 언어 정의
export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: '자동 감지 (음성에서)' },
  { code: 'ko', name: '한국어', keywords: ['korean', 'korea', '한국어', 'ko-kr', 'ko-'] },
  { code: 'en', name: '영어', keywords: ['english', 'united states', 'united kingdom', 'en-us', 'en-gb', 'en-'] },
  { code: 'ja', name: '일본어', keywords: ['japanese', 'japan', '日本語', 'ja-jp', 'ja-'] },
  { code: 'zh', name: '중국어', keywords: ['chinese', 'china', '中文', 'zh-cn', 'zh-tw', 'zh-'] },
  { code: 'ru', name: '러시아어', keywords: ['russian', 'russia', 'русский', 'ru-ru', 'ru-'] },
  { code: 'es', name: '스페인어', keywords: ['spanish', 'spain', 'español', 'es-es', 'es-'] },
  { code: 'fr', name: '프랑스어', keywords: ['french', 'france', 'français', 'fr-fr', 'fr-'] },
  { code: 'de', name: '독일어', keywords: ['german', 'germany', 'deutsch', 'de-de', 'de-'] },
  { code: 'it', name: '이탈리아어', keywords: ['italian', 'italy', 'italiano', 'it-it', 'it-'] }
  // 여기에 새 언어를 추가하면 모든 곳에 자동으로 적용됩니다
];

// 음성 이름에서 언어 코드를 추출하는 함수
export function getLanguageCodeFromVoice(voice) {
  // 기본값은 영어
  let langCode = 'en';

  if (!voice) return langCode;

  // 음성 이름에서 언어 코드 추출 시도
  const voiceLower = voice.toLowerCase();

  // 모든 지원 언어의 키워드 확인
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.code === 'auto') continue; // auto는 실제 언어가 아님

    if (lang.keywords && lang.keywords.some(keyword => voiceLower.includes(keyword))) {
      return lang.code;
    }
  }

  // 직접 언어 코드가 포함된 경우 (예: en-US)
  if (voice.includes('(')) {
    const match = voice.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const langPart = match[1].toLowerCase().trim();
      // 처음 2자가 지원되는 언어 코드인지 확인
      const twoLetterCode = langPart.slice(0, 2);
      if (SUPPORTED_LANGUAGES.some(lang => lang.code === twoLetterCode)) {
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

// UI 표시용 언어 목록 (auto 포함)
export function getUILanguagesList() {
  return SUPPORTED_LANGUAGES;
}

// Language Map (기존 TTS API와 호환성 유지)
export function getLanguageMap() {
  const map = {};
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (lang.code !== 'auto' && lang.keywords) {
      map[lang.code] = lang.keywords;
    }
  });
  return map;
}


// FFmpeg 설치 여부 확인 (서버 측에서만 사용)
export function isFFmpegInstalled() {
  if (typeof window !== 'undefined') {
    return false; // 클라이언트 측에서는 항상 false 반환
  }

  try {
    const { execSync } = require('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('FFmpeg가 설치되어 있지 않습니다. 속도와 피치 조절이 제한됩니다.');
    return false;
  }
}