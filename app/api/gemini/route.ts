import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 400 });
    }

    // เรียกใช้ gemini-2.0-flash ผ่าน v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Google API Error Response:', data);
      return NextResponse.json({ error: data.error?.message || 'Google API Error' }, { status: res.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่สามารถวิเคราะห์ได้';

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error('Gemini REST API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gemini Response Error' },
      { status: 500 }
    );
  }
}