import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเซนเซอร์' }, { status: 400 });
    }

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านสภาพแวดล้อมการนอน (Sleep Environment Expert)
      โปรดวิเคราะห์สภาพแวดล้อมในห้องนอนจากข้อมูลเซนเซอร์ดังนี้:
      - อุณหภูมิ: ${sensorData.temperature}°C
      - ความชื้น: ${sensorData.humidity}%
      - คาร์บอนไดออกไซด์ (CO2): ${sensorData.co2} ppm
      - ฝุ่น PM2.5: ${sensorData.pm2_5 || 'N/A'} µg/m³
      - แสง: ${sensorData.lux || 'N/A'} Lux
      - เสียง: ${sensorData.sound || 'N/A'} dB

      คำสั่ง: ให้คำแนะนำสั้นๆ 1-2 ประโยค ว่าสภาพห้องนี้ส่งผลต่อการนอนอย่างไร และควรปรับปรุงอะไรทันที (เช่น ปรับแอร์, เปิดระบายอากาศ)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผล', details: error.message },
      { status: 500 }
    );
  }
}