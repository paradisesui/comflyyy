import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ไม่พบ API Key' }, { status: 400 });
    }

    const promptText = `คุณเป็น AI ผู้เชี่ยวชาญด้านเวชศาสตร์การนอนและการจัดสภาพแวดล้อมห้องนอน 
โปรดวิเคราะห์ข้อมูลเซนเซอร์สภาพแวดล้อมห้องนอนปัจจุบันดังนี้:
- อุณหภูมิ: ${data.temperature?.toFixed(1)} °C
- ความชื้น: ${data.humidity?.toFixed(0)} %
- คาร์บอนไดออกไซด์ (CO2): ${data.co2} ppm
- ฝุ่น PM2.5: ${data.pm2_5} µg/m³
- แสงสว่าง: ${data.lux?.toFixed(1)} Lux
- ระดับเสียง: ${data.sound}

คำสั่ง:
1. ให้คำแนะนำสั้นๆ สรุปใจความสำคัญ ไม่เกิน 2 ประโยค ภาษาไทย เป็นกันเอง ชวนให้นอนหลับสบาย
2. หากมีค่าใดสุ่มเสี่ยง เช่น Temp > 26, CO2 > 800, Sound > 1500 หรือ แสงสว่าง ให้เจาะจงเตือนค่านั้นและบอกวิธีแก้สั้นๆ`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      }
    );

    const json = await res.json();

    if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
      return NextResponse.json({ text: json.candidates[0].content.parts[0].text });
    } else {
      return NextResponse.json({ error: 'Gemini Response Error', details: json }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server Internal Error' }, { status: 500 });
  }
}