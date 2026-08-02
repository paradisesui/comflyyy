import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // เรียกใช้โมเดลมาตรฐาน gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gemini Response Error' },
      { status: 500 }
    );
  }
}