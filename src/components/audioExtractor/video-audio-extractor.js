"use client";

import { useState, useRef, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { Dialog, Transition, Disclosure } from "@headlessui/react";
import { motion } from "framer-motion";
import { Fragment } from "react";
import {
  ArrowUpTrayIcon,
  ChevronUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  PauseIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

export default function AudioExtractor() {
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sharedBufferSupported, setSharedBufferSupported] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const dropZoneRef = useRef(null);
  const ffmpegRef = useRef(null);

  // SharedArrayBuffer 지원 여부 확인
  useEffect(() => {
    // SharedArrayBuffer 가능 여부 확인
    try {
      // eslint-disable-next-line no-new
      new SharedArrayBuffer(1);
      setSharedBufferSupported(true);
      setMessage("브라우저가 SharedArrayBuffer를 지원합니다. FFmpeg를 로드하는 중...");
    } catch (e) {
      setSharedBufferSupported(false);
      setMessage(
        "브라우저에서 SharedArrayBuffer가 지원되지 않습니다. 이 기능을 사용하려면 적절한 COOP/COEP 헤더가 필요합니다."
      );
    }
  }, []);

  // FFmpeg 인스턴스 초기화
  useEffect(() => {
    if (sharedBufferSupported === true) {
      ffmpegRef.current = createFFmpeg({
        log: true,
        progress: ({ ratio }) => {
          setProgress(Math.round(ratio * 100));
        },
        corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
      });

      loadFFmpeg();
    }
  }, [sharedBufferSupported]);

  // FFmpeg 로드 함수
  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) return;

    const ffmpeg = ffmpegRef.current;

    try {
      await ffmpeg.load();
      setFfmpegLoaded(true);
      setMessage("FFmpeg가 로드되었습니다. 이제 동영상 파일을 업로드하세요.");
    } catch (error) {
      console.error("FFmpeg 로드 오류:", error);
      setMessage(
        "FFmpeg 로드 중 오류가 발생했습니다. 브라우저 설정을 확인하거나 다른 브라우저를 사용해 보세요."
      );
    }
  };

  // 컴포넌트 마운트 시 드래그 이벤트 리스너 설정
  useEffect(() => {
    // 드래그 이벤트 리스너 설정
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 전체 윈도우에 이벤트 리스너 추가 (기본 동작 방지)
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    // 정리 함수
    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  // 드래그 이벤트 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 드롭존 영역을 벗어났는지 확인
    // currentTarget은 이벤트가 바인딩된 요소, relatedTarget은 이벤트가 이동한 요소
    if (e.currentTarget.contains(e.relatedTarget)) return;

    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (loading || !ffmpegLoaded) return;

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // 공통 파일 처리 로직
  const handleFile = (file) => {
    if (!file) return;

    // 비디오 파일 유형 확인 (확장자로도 체크)
    const validVideoTypes = ['video/', 'application/x-matroska'];
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = validVideoTypes.some(type => file.type.startsWith(type)) ||
      validExtensions.includes(fileExtension);

    if (!isValidType) {
      setMessage("지원되지 않는 파일 형식입니다. 동영상 파일만 업로드할 수 있습니다. (지원 형식: MP4, AVI, MKV, WEBM 등)");
      return;
    }

    // 파일 크기 확인 
    const fileSizeMB = file.size / (1024 * 1024);
    const maxFileSize = 500; // 최대 500MB

    if (fileSizeMB > maxFileSize) {
      setMessage(
        `파일 크기가 너무 큽니다 (${fileSizeMB.toFixed(2)} MB). ` +
        `안정적인 처리를 위해 ${maxFileSize}MB 이하의 파일을 업로드해 주세요. ` +
        `큰 파일은 오프라인 도구를 사용하는 것이 좋습니다.`
      );
      return;
    }

    setVideo(file);
    setMessage(
      `파일 '${file.name}'가 업로드되었습니다 (${fileSizeMB.toFixed(2)} MB). 이제 오디오를 추출할 수 있습니다.`
    );
    setAudio(null); // 이전 오디오 초기화
  };

  // 파일 업로드 핸들러
  const handleFileChange = (e) => {
    if (!ffmpegLoaded) return;
    const file = e.target.files[0];
    handleFile(file);
  };

  // 오디오 추출 함수
  const extractAudio = async () => {
    if (!video || !ffmpegLoaded || !ffmpegRef.current) return;

    const ffmpeg = ffmpegRef.current;
    setLoading(true);
    setProgress(0);
    setMessage("오디오 추출 중...");

    try {
      // 파일 확장자 가져오기
      const fileExtension = video.name.substring(video.name.lastIndexOf('.')).toLowerCase();
      // 원본 파일 확장자를 유지하면서 FFmpeg에 입력 파일 쓰기
      const inputFileName = `input${fileExtension}`;
      const outputFileName = "output.mp3";

      try {
        // 동영상 파일을 ffmpeg에 쓰기
        ffmpeg.FS("writeFile", inputFileName, await fetchFile(video));
      } catch (error) {
        console.error("파일 읽기 오류:", error);
        throw new Error("파일이 너무 크거나 메모리 부족으로 처리할 수 없습니다. 500MB 이하의 파일을 사용해주세요.");
      }

      // 오디오 추출 명령어 실행
      await ffmpeg.run(
        "-i", inputFileName,
        "-vn", // 비디오 스트림 제거
        "-acodec", "libmp3lame", // MP3 코덱 사용
        "-q:a", "2", // 오디오 품질 설정 (낮을수록 고품질)
        outputFileName
      );

      // 결과 파일 읽기
      const data = ffmpeg.FS("readFile", outputFileName);

      // Blob 형식으로 변환
      const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });

      // 오디오 URL 생성 및 상태 업데이트
      const audioURL = URL.createObjectURL(audioBlob);
      setAudio({
        url: audioURL,
        blob: audioBlob,
        fileName: video.name.replace(/\.[^/.]+$/, "") + ".mp3",
      });

      setMessage("오디오 추출이 완료되었습니다.");
    } catch (error) {
      console.error("오디오 추출 오류:", error);
      setMessage(error.message || "오디오 추출 중 오류가 발생했습니다. 파일 형식을 확인하거나 더 작은 파일을 사용해보세요.");
    } finally {
      setLoading(false);
    }
  };

  // 오디오 다운로드 함수
  const downloadAudio = () => {
    if (!audio) return;

    const a = document.createElement("a");
    a.href = audio.url;
    a.download = audio.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="px-2 py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          동영상에서 오디오 추출
        </h2>
        <button
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          className="flex items-center text-gray-500 hover:text-blue-600"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 mr-1" />
          <span className="text-sm">도움말</span>
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-blue-50 text-blue-700 border-l-4 border-blue-500"
        >
          <p>{message}</p>
        </motion.div>
      )}

      {sharedBufferSupported === false && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-700 border-l-4 border-amber-500"
        >
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">브라우저 호환성 문제</h3>
              <p className="mt-1">이 앱은 다음 중 하나의 방법으로 사용할 수 있습니다:</p>
              <ol className="list-decimal ml-5 mt-2">
                <li className="mb-1">Chrome이나 Edge 브라우저에서 이 페이지를 열기</li>
                <li className="mb-1">서버가 적절한 COOP/COEP 헤더를 설정하도록 하기</li>
                <li>Firefox는 about:config에서 "cross-origin-isolated" 활성화 필요</li>
              </ol>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className={`mb-6 rounded-lg border-2 border-dashed ${isDragging
            ? "border-blue-500 bg-blue-50"
            : loading || !ffmpegLoaded || sharedBufferSupported === false
              ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-60"
              : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
          } transition-all duration-200`}
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ArrowUpTrayIcon
            className={`h-12 w-12 mb-4 ${isDragging ? "text-blue-500" : "text-gray-400"
              }`}
          />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            클릭하거나 파일을 여기에 드래그하세요
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            지원 파일 형식: MP4, AVI, MKV, WEBM 등 일반적인 동영상 파일
          </p>

          <label className={`
            inline-flex items-center px-4 py-2 rounded-md
            ${!ffmpegLoaded || sharedBufferSupported === false
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'}
            transition-colors duration-200 shadow-sm
          `}>
            <span>파일 선택</span>
            <input
              type="file"
              accept="video/*,.mkv,.avi,.flv,.wmv"
              onChange={handleFileChange}
              className="sr-only"
              disabled={loading || !ffmpegLoaded || sharedBufferSupported === false}
            />
          </label>
        </div>
      </motion.div>

      {video && (
        <motion.div
          className="mb-6 rounded-lg bg-accent-0 shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-700">선택된 파일</h3>
          </div>

          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600 font-medium">{video.name.split('.').pop().toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{video.name}</p>
                <p className="text-xs text-gray-500">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                extractAudio();
              }}
              disabled={loading || !ffmpegLoaded || sharedBufferSupported === false}
              className={`
                w-full flex items-center justify-center px-4 py-3 rounded-md
                ${loading || !ffmpegLoaded || sharedBufferSupported === false
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }
                transition-colors duration-200 shadow-sm
              `}
            >
              <MusicalNoteIcon className="h-5 w-5 mr-2" />
              {loading ? "처리 중..." : "오디오 추출하기"}
            </button>
          </div>
        </motion.div>
      )}

      {loading && (
        <motion.div
          className="mb-6 rounded-lg bg-accent-0 shadow-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-lg font-medium text-gray-700 mb-3">처리 진행 상황</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <motion.div
              className="bg-blue-600 h-4"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", damping: 15 }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">진행 중...</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
        </motion.div>
      )}

      {audio && (
        <motion.div
          className="mb-6 rounded-lg bg-accent-0 shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-700">오디오 미리듣기</h3>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <audio
                controls
                className="w-full"
                controlsList="nodownload"
              >
                <source src={audio.url} type="audio/mp3" />
                브라우저가 오디오 태그를 지원하지 않습니다.
              </audio>
            </div>

            <button
              onClick={downloadAudio}
              className="w-full flex items-center justify-center px-4 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              오디오 다운로드 (.mp3)
            </button>
          </div>
        </motion.div>
      )}

      <Disclosure as="div" className="mt-8">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full justify-between items-center rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500">
              <span>자주 묻는 질문</span>
              <ChevronUpIcon
                className={`${open ? "transform rotate-180" : ""
                  } h-5 w-5 text-gray-500 transition-transform duration-200`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700">파일 크기 제한이 있나요?</h4>
                  <p>브라우저 메모리 제한으로 인해 500MB 이하의 파일만 처리할 수 있습니다.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">파일은 어디로 업로드되나요?</h4>
                  <p>모든 처리는 브라우저에서 직접 이루어집니다. 파일은 서버로 업로드되지 않습니다.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">지원되는 파일 형식은 무엇인가요?</h4>
                  <p>MP4, AVI, MKV, WEBM, FLV, WMV 등 대부분의 일반적인 동영상 파일 형식을 지원합니다.</p>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* 도움말 모달 */}
      <Transition appear show={isInfoModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsInfoModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-accent-0 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    동영상에서 오디오 추출하기
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      이 도구는 동영상 파일에서 오디오를 추출하여 MP3 형식으로 저장합니다.
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      사용 방법:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-500 space-y-1 mb-2">
                      <li>동영상 파일을 업로드하거나 드래그앤드롭합니다.</li>
                      <li>"오디오 추출하기" 버튼을 클릭합니다.</li>
                      <li>변환이 완료되면 미리듣기 후 다운로드할 수 있습니다.</li>
                    </ol>
                    <p className="text-sm text-gray-500">
                      모든 처리는 브라우저에서 직접 이루어지며 파일은 서버로 전송되지 않습니다.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsInfoModalOpen(false)}
                    >
                      확인
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}