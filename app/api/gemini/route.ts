import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensorAverages, restlessCount } = body;

    if (!sensorAverages) {
      return NextResponse.json({ status: 'error', message: 'Sensor data is missing' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านสรีรวิทยาการนอนหลับ
      จงวิเคราะห์ข้อมูลสภาพแวดล้อมจริงจากการนอนคืนนี้ (ดิ้น ${restlessCount} ครั้ง):
      - อุณหภูมิเฉลี่ย: ${sensorAverages.temp.toFixed(1)}°C
      - ความชื้นเฉลี่ย: ${sensorAverages.hum.toFixed(1)}%
      - เสียงเฉลี่ย: ${sensorAverages.sound.toFixed(1)}
      - แสงเฉลี่ย: ${sensorAverages.light.toFixed(1)} Lux
      - CO2 เฉลี่ย: ${sensorAverages.co2.toFixed(1)} ppm
      - PM2.5 เฉลี่ย: ${sensorAverages.pm25.toFixed(1)} µg/m³

      จงคำนวณค่าน้ำหนักเฉพาะบุคคล (Personalized Weight) ของทั้ง 6 ตัวแปร (ผลรวมเท่ากับ 1.0 หรือ 100%)
      พร้อมสรุปสาเหตุเชิงลึกและคำแนะนำปรับปรุงห้องนอน

      ตอบเป็น JSON โครงสร้างนี้เท่านั้น:
      {
        "weights": {
          "temp": 0.30,
          "hum": 0.15,
          "sound": 0.25,
          "light": 0.10,
          "co2": 0.10,
          "pm25": 0.10
        },
        "diagnosis": "ข้อสรุปสาเหตุการดิ้นตื่น",
        "recommendation": "คำแนะนำสั้นๆ 1 ประโยค"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJsonStr = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    return NextResponse.json({ status: 'success', data: parsedData });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ status: 'error', message: 'Gemini AI calculation failed' }, { status: 500 });
  }
}