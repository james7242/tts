// components/utils/ThemeWrapper.jsx
'use client';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  // Only allow theme changes after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a fallback without the ThemeProvider initially
    return <>{children}</>;
  }

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}