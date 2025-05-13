'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

export default function TextToSpeechConverter() {
  // 기존 상태들
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayLoading, setIsPlayLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [isMeSpeakReady, setIsMeSpeakReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [serverMode, setServerMode] = useState(true); // 기본값을 서버 모드로 유지
  const [useGoogleVoice, setUseGoogleVoice] = useState(true); // 기본값을 Google 음성으로 변경
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [fileName, setFileName] = useState('text-to-speech'); // 파일 이름 상태 추가
  const [isRepeat, setIsRepeat] = useState(false); // 반복 재생 상태 추가
  const utteranceRef = useRef(null);
  const synth = useRef(null);
  const audioRef = useRef(null);
  const previewAudioRef = useRef(null);

  // 지원되는 언어 목록
  const supportedLanguages = [
    { code: 'auto', name: '자동 감지 (음성에서)' },
    { code: 'ko', name: '한국어' },
    { code: 'en', name: '영어' },
    { code: 'ja', name: '일본어' },
    { code: 'zh', name: '중국어' },
    { code: 'ru', name: '러시아어' }
    // { code: 'es', name: '스페인어' },
    // { code: 'fr', name: '프랑스어' },
    // { code: 'de', name: '독일어' },
    // { code: 'it', name: '이탈리아어' },
    // { code: 'pt', name: '포르투갈어' },
    // { code: 'ar', name: '아랍어' },
    // { code: 'hi', name: '힌디어' },
    // { code: 'th', name: '태국어' },
    // { code: 'vi', name: '베트남어' },
    // { code: 'id', name: '인도네시아어' }
  ];

  // Speech Synthesis 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;

      const populateVoices = () => {
        const availableVoices = synth.current.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          // 한국어 음성을 기본으로 설정하려고 시도
          const koreanVoice = availableVoices.find(voice => voice.lang.includes('ko'));
          setSelectedVoice(koreanVoice ? koreanVoice.name : availableVoices[0].name);
        }
      };

      // 음성 목록이 변경될 때 업데이트
      synth.current.onvoiceschanged = populateVoices;
      populateVoices();
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  // meSpeak 초기화 (클라이언트 모드용)
  useEffect(() => {
    const initMeSpeak = async () => {
      if (typeof window !== 'undefined' && window.meSpeak) {
        try {
          // meSpeak 초기화
          window.meSpeak.loadConfig("/mespeak_config.json");

          // 영어 기본 보이스 로드
          await new Promise((resolve, reject) => {
            window.meSpeak.loadVoice('en/en-us', (success) => {
              if (success) resolve();
              else reject(new Error('Failed to load English voice'));
            });
          });

          // 다른 언어 보이스 로드 시도
          const attemptLoadVoice = async (lang) => {
            try {
              await new Promise((resolve) => {
                window.meSpeak.loadVoice(lang, (success) => {
                  resolve(success);
                });
              });
            } catch (e) {
              console.log(`${lang} 보이스를 로드할 수 없습니다.`);
            }
          };

          // 한국어 및 기타 언어 시도
          await attemptLoadVoice('ko');
          await attemptLoadVoice('fr');
          await attemptLoadVoice('de');
          await attemptLoadVoice('es');
          await attemptLoadVoice('it');

          setIsMeSpeakReady(true);
        } catch (error) {
          console.error("meSpeak 초기화 오류:", error);
          setLoadError("meSpeak 초기화에 실패했습니다. 서버 모드로 전환합니다.");
          setServerMode(true);
        }
      } else {
        // meSpeak가 로드되지 않으면 서버 모드로 설정
        setServerMode(true);
      }
    };

    initMeSpeak();
  }, []);

  // 오디오 객체 정리
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [audioUrl, previewAudioUrl]);

  // 오디오 요소에 반복 속성 설정
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.loop = isRepeat;
    }
    if (audioRef.current) {
      audioRef.current.loop = isRepeat;
    }
  }, [isRepeat]);

  // 텍스트 변경 핸들러
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // 음성 변경 핸들러
  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
  };

  // 언어 변경 핸들러 (서버 모드용)
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  // 속도 변경 핸들러
  const handleRateChange = (e) => {
    setRate(parseFloat(e.target.value));
  };

  // 피치 변경 핸들러
  const handlePitchChange = (e) => {
    setPitch(parseFloat(e.target.value));
  };

  // 서버/클라이언트 모드 토글 - 모드 변경 시 Google 음성 자동 설정
  const toggleServerMode = () => {
    const newServerMode = !serverMode;
    setServerMode(newServerMode);

    // 서버 모드로 변경 시 자동으로 Google 음성으로 변경
    // 브라우저 모드로 변경 시 자동으로 브라우저 음성으로 변경
    setUseGoogleVoice(newServerMode);
  };

  // 반복 재생 토글 함수
  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  // 파일 이름 변경 핸들러
  const handleFileNameChange = (e) => {
    // 파일 이름에 사용할 수 없는 문자 제거 (Windows 및 기타 OS 호환성)
    const sanitizedName = e.target.value.replace(/[\\/:*?"<>|]/g, '');
    setFileName(sanitizedName);
  };

  // 브라우저 내장 TTS로 음성 재생
  const playTextWithBrowser = () => {
    if (synth.current) {
      // 이미 재생 중이면 중지
      if (isPlaying) {
        synth.current.cancel();
      }

      utteranceRef.current = new SpeechSynthesisUtterance(text);

      // 선택된 음성 설정
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utteranceRef.current.voice = voice;
      }

      // 속도와 피치 설정
      utteranceRef.current.rate = rate;
      utteranceRef.current.pitch = pitch;

      // 이벤트 리스너 설정
      utteranceRef.current.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      // 반복 재생 로직이 포함된 onend 핸들러
      utteranceRef.current.onend = () => {
        if (isRepeat && synth.current) {
          // 브라우저 TTS는 Loop가 없어서 재생 완료 후 다시 호출
          setTimeout(() => {
            if (isRepeat) {  // 재확인 (타이밍 이슈 방지)
              playTextWithBrowser();
            }
          }, 300);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      synth.current.speak(utteranceRef.current);
    }
  };

  // Google TTS로 음성 재생 - 수정된 버전
  const playTextWithGoogle = async () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    // 이미 재생 중이면 중지
    if (isPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    // 기존 미리보기 오디오 URL 정리
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }

    setIsPlayLoading(true);

    try {
      // API 요청 데이터 준비
      const requestData = {
        text,
        voice: selectedVoice,
        rate,
        pitch,
        fileName // 파일 이름 추가
      };

      // 자동 감지가 아닌 경우 선택된 언어 추가
      if (selectedLanguage !== 'auto') {
        requestData.language = selectedLanguage;
      }

      // 일반 TTS API 사용 (스트리밍 API 대신)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '알 수 없는 오류';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || '알 수 없는 오류';
        } catch {
          errorMessage = errorText || '알 수 없는 오류';
        }
        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();

      // 오디오 데이터가 없으면 오류
      if (audioBlob.size === 0) {
        throw new Error('생성된 오디오 파일이 비어있습니다.');
      }

      const url = URL.createObjectURL(audioBlob);
      setPreviewAudioUrl(url);

      // 생성된 오디오 자동 재생
      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        previewAudioRef.current.loop = isRepeat; // 반복 설정 적용
        previewAudioRef.current.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        previewAudioRef.current.onpause = () => {
          setIsPaused(true);
        };
        previewAudioRef.current.onended = () => {
          if (!isRepeat) {  // 반복 재생이 아닌 경우에만 재생 상태 업데이트
            setIsPlaying(false);
            setIsPaused(false);
          }
        };

        // play() 메서드가 실패할 경우를 대비한 오류 처리
        try {
          await previewAudioRef.current.play();
        } catch (playError) {
          console.error('오디오 재생 실패:', playError);
          throw new Error('브라우저에서 오디오 재생을 차단했습니다. 사용자 상호작용이 필요합니다.');
        }
      }
    } catch (error) {
      console.error('오디오 스트리밍 중 오류 발생:', error);
      alert(`오디오 재생에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      setIsPlaying(false);
    } finally {
      setIsPlayLoading(false);
    }
  };

  // 음성 재생 (선택된 방식에 따라)
  const playText = () => {
    if (useGoogleVoice) {
      playTextWithGoogle();
    } else {
      playTextWithBrowser();
    }
  };

  // 음성 일시 정지/재개
  const togglePause = () => {
    if (useGoogleVoice) {
      // Google TTS를 사용한 경우 Audio 요소 제어
      if (previewAudioRef.current) {
        if (isPaused) {
          previewAudioRef.current.play();
          setIsPaused(false);
        } else {
          previewAudioRef.current.pause();
          setIsPaused(true);
        }
      }
    } else {
      // 브라우저 TTS를 사용한 경우 speechSynthesis 제어
      if (synth.current) {
        if (isPaused) {
          synth.current.resume();
          setIsPaused(false);
        } else {
          synth.current.pause();
          setIsPaused(true);
        }
      }
    }
  };

  // 음성 중지
  const stopText = () => {
    if (useGoogleVoice) {
      // Google TTS를 사용한 경우 Audio 요소 중지
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsPaused(false);
      }
    } else {
      // 브라우저 TTS를 사용한 경우 speechSynthesis 중지
      if (synth.current) {
        synth.current.cancel();
        setIsPlaying(false);
        setIsPaused(false);
      }
    }
  };

  // 음성 생성 및 다운로드
  const generateAndDownload = async () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    // 기존 오디오 URL 정리
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setIsLoading(true);

    try {
      // 서버 모드이거나 클라이언트 측 생성에 실패한 경우 서버 API 사용
      if (serverMode) {
        await generateThroughApi();
      } else {
        // 클라이언트 측에서 meSpeak를 사용하여 오디오 생성
        if (window.meSpeak && isMeSpeakReady) {
          // meSpeak 옵션 설정
          const options = {
            amplitude: 100,
            wordgap: 0,
            pitch: pitch * 50, // 범위 조정
            speed: rate * 150,  // 범위 조정
          };

          // 선택된 음성 설정 (meSpeak는 제한된 수의 음성만 지원)
          const voice = voices.find(v => v.name === selectedVoice);
          if (voice && voice.lang) {
            if (voice.lang.startsWith('ko')) {
              options.voice = 'ko';
            } else if (voice.lang.startsWith('en')) {
              options.voice = 'en/en-us';
            } else if (voice.lang.startsWith('fr')) {
              options.voice = 'fr';
            } else if (voice.lang.startsWith('de')) {
              options.voice = 'de';
            } else if (voice.lang.startsWith('es')) {
              options.voice = 'es';
            } else if (voice.lang.startsWith('it')) {
              options.voice = 'it';
            } else {
              // 지원되지 않는 언어는 영어로 기본 설정
              options.voice = 'en/en-us';
            }
          }

          // 오디오 데이터 생성
          const audioData = window.meSpeak.speak(text, options, true);

          if (audioData && audioData.length > 0) {
            // Blob 생성 및 URL 설정
            const audioBlob = new Blob([audioData], { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            // 생성된 오디오 자동 재생
            if (audioRef.current) {
              audioRef.current.src = url;
              audioRef.current.loop = isRepeat; // 반복 설정 적용
              audioRef.current.play();
            }
          } else {
            throw new Error('오디오 데이터 생성 실패');
          }
        } else {
          // meSpeak 사용 불가능할 경우 서버 API 사용
          await generateThroughApi();
        }
      }
    } catch (error) {
      console.error('오디오 생성 중 오류 발생:', error);
      // 실패 시 서버 API 사용 시도
      try {
        await generateThroughApi();
      } catch (apiError) {
        console.error('서버 API 사용 중 오류 발생:', apiError);
        alert(`오디오 생성에 실패했습니다: ${apiError.message || '알 수 없는 오류'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 서버 API를 사용한 음성 생성
  const generateThroughApi = async () => {
    try {
      // API 요청 데이터 준비
      const requestData = {
        text,
        voice: selectedVoice,
        rate,
        pitch,
        fileName // 파일 이름 추가
      };

      // 자동 감지가 아닌 경우 선택된 언어 추가
      if (selectedLanguage !== 'auto') {
        requestData.language = selectedLanguage;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '알 수 없는 오류';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || '알 수 없는 오류';
        } catch {
          errorMessage = errorText || '알 수 없는 오류';
        }
        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();

      // 오디오 데이터가 없으면 오류
      if (audioBlob.size === 0) {
        throw new Error('생성된 오디오 파일이 비어있습니다.');
      }

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // 생성된 오디오 자동 재생
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.loop = isRepeat; // 반복 설정 적용
        audioRef.current.play();
      }
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  };

  return (
    <>
      {/* 미리보기용 숨겨진 오디오 요소 */}
      <audio
        ref={previewAudioRef}
        style={{ display: 'none' }}
        loop={isRepeat}
      >
        <source src={previewAudioUrl} type="audio/mpeg" />
      </audio>

      {/* meSpeak 라이브러리 로드 */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/mespeak/2.0.2/mespeak.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('meSpeak 로드 완료')}
        onError={(e) => {
          console.error('meSpeak 로드 오류:', e);
          setLoadError('meSpeak 라이브러리를 로드하는 데 실패했습니다. 서버 모드로 전환합니다.');
          setServerMode(true);
        }}
      />

      {loadError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{loadError}</p>
        </div>
      )}

      <div className="bg-accent-0 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">텍스트-음성 변환</h2>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-600">
              {serverMode ? '서버 모드 (다국어 지원, 고음질)' : '브라우저 모드 (제한된 언어)'}
            </span>
            <button
              onClick={toggleServerMode}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              모드 변경
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            변환할 텍스트
          </label>
          <textarea
            id="text"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={handleTextChange}
            placeholder="여기에 텍스트를 입력하세요..."
          />
        </div>

        {/* 브라우저 모드일 때만 표시되는 음성 선택 폼 */}
        {!serverMode && (
          <div className="mb-4">
            <label htmlFor="voice" className="block text-sm font-medium text-gray-700 mb-2">
              음성 선택 (브라우저 목소리)
            </label>
            <select
              id="voice"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedVoice}
              onChange={handleVoiceChange}
            >
              {/* 특정 언어(예: 한국어, 영어, 일본어)로 필터링 */}
              {voices
                .filter(voice =>
                  voice.lang.startsWith('ko') ||
                  voice.lang.startsWith('en-US') ||
                  voice.lang.startsWith('ja') ||
                  voice.lang.startsWith('ru')
                )
                .map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* 서버 모드일 때만 표시되는 언어 선택 폼 */}
        {serverMode && (
          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              언어 선택 (서버 모드)
            </label>
            <select
              id="language"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              * 서버 모드에서는 20개 이상의 언어가 지원됩니다. 자동 감지는 음성 이름에서 언어를 추출합니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
              속도: {rate.toFixed(1)}
            </label>
            <input
              id="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={handleRateChange}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-2">
              피치: {pitch.toFixed(1)}
            </label>
            <input
              id="pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={handlePitchChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
            저장할 파일 이름 (확장자 제외)
          </label>
          <input
            id="fileName"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fileName}
            onChange={handleFileNameChange}
            placeholder="파일 이름을 입력하세요 (기본값: text-to-speech)"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={playText}
            disabled={!text || (isPlaying && !isPaused) || isPlayLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
          >
            {isPlayLoading ? '로딩 중...' : isPlaying && !isPaused ? '재생 중...' : '음성 재생'}
          </button>

          <button
            onClick={toggleRepeat}
            className={`px-4 py-2 ${isRepeat ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
          >
            {isRepeat ? '반복 켜짐' : '반복 꺼짐'}
          </button>

          {isPlaying && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
            >
              {isPaused ? '계속 재생' : '일시 정지'}
            </button>
          )}

          {isPlaying && (
            <button
              onClick={stopText}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              중지
            </button>
          )}

          <button
            onClick={generateAndDownload}
            disabled={!text || isPlaying || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300"
          >
            {isLoading ? '생성 중...' : '음성 저장하기'}
          </button>
        </div>

        {audioUrl && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h3 className="text-lg font-medium mb-3">저장된 오디오</h3>
            <div className="flex items-center mb-2">
              <div className="text-sm text-gray-600 mr-2">파일 이름:</div>
              <span className="font-medium">{fileName}{serverMode ? '.mp3' : '.wav'}</span>
            </div>
            <audio
              ref={audioRef}
              controls
              className="w-full mb-3"
              loop={isRepeat}
            >
              <source src={audioUrl} type={serverMode ? "audio/mpeg" : "audio/wav"} />
              브라우저가 오디오 재생을 지원하지 않습니다.
            </audio>
            <a
            href={audioUrl}
            download={serverMode ? `${fileName}.mp3` : `${fileName}.wav`}
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
            {serverMode ? "MP3 파일 다운로드" : "WAV 파일 다운로드"}
          </a>
          </div>
        )}
    </div >
    </>
  );
}