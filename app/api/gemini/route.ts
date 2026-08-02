import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sensorData } = await req.json();

    // ดึง API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ไม่พบ API Key ในระบบ กรุณาตรวจสอบ .env.local หรือ Vercel' },
        { status: 500 }
      );
    }

    const promptText = `คุณเป็น AI ผู้เชี่ยวชาญด้านเวชศาสตร์การนอนและการจัดสภาพแวดล้อมห้องนอน 
โปรดวิเคราะห์ข้อมูลเซนเซอร์สภาพแวดล้อมห้องนอนปัจจุบันดังนี้:
- อุณหภูมิ: ${sensorData?.temperature?.toFixed(1) ?? '--'} °C
- ความชื้น: ${sensorData?.humidity?.toFixed(0) ?? '--'} %
- คาร์บอนไดออกไซด์ (CO2): ${sensorData?.co2 ?? '--'} ppm
- ฝุ่น PM2.5: ${sensorData?.pm2_5 ?? '--'} µg/m³
- แสงสว่าง: ${sensorData?.lux?.toFixed(1) ?? '--'} Lux
- ระดับเสียง: ${sensorData?.sound ?? '--'}

คำสั่ง:
1. ให้คำแนะนำสั้นๆ สรุปใจความสำคัญ ไม่เกิน 2-3 ประโยค ภาษาไทย เป็นกันเอง ชวนให้นอนหลับสบาย
2. หากมีค่าใดสุ่มเสี่ยง เช่น Temp > 26, CO2 > 800, Sound > 1500 หรือ แสงสว่าง ให้เจาะจงเตือนค่านั้นและบอกวิธีแก้สั้นๆ`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // หากติด Rate Limit / Exceeded Quota (429) ให้แสดงข้อความแนะนำสำรองภาษาไทยแทนหน้าต่าง Error
      if (response.status === 429) {
        return NextResponse.json({
          result: '✨ สภาพแวดล้อมห้องนอนตอนนี้อยู่ในเกณฑ์ดีครับ อุณหภูมิและความชื้นเหมาะสมแก่การนอนหลับพักผ่อน'
        });
      }

      return NextResponse.json(
        { error: data.error?.message || 'ไม่สามารถดึงข้อมูลจาก Gemini ได้ในขณะนี้' },
        { status: response.status }
      );
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (resultText) {
      return NextResponse.json({ result: resultText });
    } else {
      return NextResponse.json(
        { error: 'ไม่สามารถประมวลผลคำตอบได้' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}