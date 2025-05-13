"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // 테마 순환 함수
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
  };

  console.log('theme', theme)
  return (
    <div className="flex flex-col font-bold text-accent-8">
      <div className="flex justify-center py-2 place-items-center">
        <button
          className="flex justify-center hover:scale-120 hover:text-accent-7"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <SunIcon className="w-6 text-yellow-400" />
          ) : theme === "dark" ? (
            <MoonIcon className="w-5" />
          ) : (
            <ComputerDesktopIcon className="w-6 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle
