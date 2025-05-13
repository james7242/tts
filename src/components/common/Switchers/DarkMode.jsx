"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";


const DarkMode = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="w-64 ring-2 flex flex-col font-bold text-accent-8">
      <div className="w-full  uppercase text-sm border-t-2 flex">
        <span className="w-1/2 px-4 py-2 border-accent-9 border-r-2 text-center">
          모드
        </span>
        <span className="w-1/2 px-4 py-2 text-center">
          {theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템'}
        </span>
      </div>
      <div className="grid grid-cols-3 py-2 border-t-2 place-items-center ">
        <button
          className="flex justify-center hover:scale-120 hover:text-accent-7"
          onClick={() => setTheme("dark")}
        >
          <MoonIcon className="w-5 " />
        </button>
        <button
          className="flex justify-center hover:scale-120"
          onClick={() => setTheme("light")}
        >
          <SunIcon className="w-7 text-yellow-400" />
        </button>
        <button
          className="flex justify-center hover:scale-120"
          onClick={() => setTheme("system")}
        >
          <ComputerDesktopIcon className="w-6" />
        </button>
      </div>
    </div>
  );
};

export default DarkMode;
