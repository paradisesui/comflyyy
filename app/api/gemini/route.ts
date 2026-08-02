import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { sensorData } = await request.json();

    // เลือกใช้โมเดล gemini-1.5-flash แทนรุ่นเก่า
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านคุณภาพห้องนอนและการนอนหลับ 
      โปรดวิเคราะห์ข้อมูลเซนเซอร์ห้องนอนนี้:
      - อุณหภูมิ: ${sensorData.temperature} °C
      - ความชื้น: ${sensorData.humidity} %
      - CO2: ${sensorData.co2} ppm
      - PM2.5: ${sensorData.pm2_5} µg/m³
      - เสียง: ${sensorData.sound} dB
      - แสง: ${sensorData.lux} Lux

      ให้คำแนะนำสั้นๆ สรุปได้กระชับ และเข้าใจง่าย ไม่เกิน 3 ประโยค
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถประมวลผล Gemini AI ได้' },
      { status: 500 }
    );
  }
}