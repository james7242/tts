"use client";

import { useState } from "react";
import { Tab } from "@headlessui/react";
import { motion } from "framer-motion";
import TextToSpeechConverter from "@/components/tts/TextToSpeechConverter";
import AudioExtractor from "@/components/audioExtractor/video-audio-extractor";
import { ChevronDoubleDownIcon } from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 페이지 로드 애니메이션
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 h-screen overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div variants={itemVariants} className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            미디어 변환 도구
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            텍스트를 고품질 음성으로 변환하거나 동영상에서 오디오를 추출하세요.
            모든 처리는 브라우저에서 이루어져 파일이 서버로 전송되지 않습니다.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex rounded-xl bg-blue-900/10 p-1 space-x-1 mb-8">
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-3 text-sm font-medium leading-5",
                    "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                    selected
                      ? "bg-accent-0 text-blue-700 shadow"
                      : "text-gray-600 hover:bg-accent-0/30 hover:text-blue-700"
                  )
                }
              >
                텍스트-음성 변환
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-3 text-sm font-medium leading-5",
                    "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                    selected
                      ? "bg-accent-0 text-blue-700 shadow"
                      : "text-gray-600 hover:bg-accent-0/30 hover:text-blue-700"
                  )
                }
              >
                비디오에서 오디오 추출
              </Tab>
            </Tab.List>

            <Tab.Panels>
              <Tab.Panel
                className={classNames(
                  "rounded-xl bg-accent-0 p-3",
                  "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  "shadow-lg"
                )}
              >
                <div className="overflow-hidden rounded-xl">
                  <TextToSpeechConverter />
                </div>
              </Tab.Panel>

              <Tab.Panel
                className={classNames(
                  "rounded-xl bg-accent-0 p-3",
                  "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  "shadow-lg"
                )}
              >
                <div className="overflow-hidden rounded-xl">
                  <AudioExtractor />
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-center text-gray-500 pt-4 pb-8"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDoubleDownIcon className="h-6 w-6 mx-auto text-gray-400" />
          <p className="text-sm mt-2">
            스크롤하여 더 많은 기능을 확인하세요
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
}