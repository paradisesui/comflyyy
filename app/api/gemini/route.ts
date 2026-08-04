import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเซนเซอร์' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Environment Variables' },
        { status: 500 }
      );
    }

    // เรียกใช้ SDK ด้วย API Key
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
      คุณคือผู้เชี่ยวชาญด้านสภาพแวดล้อมการนอน (Sleep Environment Expert)
      โปรดวิเคราะห์สภาพแวดล้อมในห้องนอนจากข้อมูลเซนเซอร์ดังนี้:
      - อุณหภูมิ: ${sensorData.temperature ?? 'N/A'}°C
      - ความชื้น: ${sensorData.humidity ?? 'N/A'}%
      - คาร์บอนไดออกไซด์ (CO2): ${sensorData.co2 ?? 'N/A'} ppm
      - ฝุ่น PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
      - แสง: ${sensorData.lux ?? 'N/A'} Lux
      - เสียง: ${sensorData.sound ?? 'N/A'} dB

      คำสั่ง: ให้คำแนะนำสั้นๆ ไม่เกิน 2 ประโยค ว่าสภาพห้องนี้น่าจะส่งผลต่อการนอนอย่างไร และควรปรับปรุงอะไรทันที
    `;

    // เรียกใช้โมเดลผ่าน SDK โดยตรง
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptText,
    });

    const resultText = response.text || 'ไม่สามารถดึงคำแนะนำได้ในขณะนี้';

    return NextResponse.json({ result: resultText });
  } catch (error: any) {
    console.error('Server Catch Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผลเซิร์ฟเวอร์', details: error.message },
      { status: 500 }
    );
  }
}