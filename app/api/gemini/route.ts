import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // เรียกใช้ Official SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();

    if (responseText) {
      return NextResponse.json({ result: responseText });
    } else {
      return NextResponse.json(
        { error: 'ไม่สามารถประมวลผลคำตอบจาก Gemini ได้' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Gemini SDK Error:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผล Gemini' },
      { status: 500 }
    );
  }
}