import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { sensorData } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ไม่พบ API Key ใน Environment Variables' },
        { status: 500 }
      );
    }

    // เริ่มต้น Official SDK ล่าสุด
    const ai = new GoogleGenAI({ apiKey });

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

    // เรียกใช้โมเดล gemini-2.0-flash หรือ gemini-1.5-flash ผ่าน SDK ตัวใหม่
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
    });

    const resultText = response.text;

    if (resultText) {
      return NextResponse.json({ result: resultText });
    } else {
      return NextResponse.json(
        { error: 'Gemini ตอบกลับมาเป็นค่าว่าง' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Gemini API Error Detail:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผลคำตอบจาก Gemini' },
      { status: 500 }
    );
  }
}