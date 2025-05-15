// app/api/ffmpeg-status/route.js

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  let isInstalled = false;

  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    isInstalled = true;
  } catch (error) {
    isInstalled = false;
  }

  return NextResponse.json({
    isInstalled,
    environment: process.env.VERCEL ? 'Vercel' : 'Other'
  });
}