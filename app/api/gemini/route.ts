import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensorAverages, restlessCount } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านสรีรวิทยาการนอนหลับและสภาพแวดล้อมห้องนอน
      จงวิเคราะห์ข้อมูลสภาพแวดล้อมห้องนอนกับการดิ้นตื่น (${restlessCount} ครั้ง) ต่อไปนี้:
      - อุณหภูมิเฉลี่ย: ${sensorAverages?.temp || 25}°C
      - ความชื้นเฉลี่ย: ${sensorAverages?.hum || 50}%
      - เสียงเฉลี่ย: ${sensorAverages?.sound || 400}
      - แสงเฉลี่ย: ${sensorAverages?.light || 0} Lux
      - CO2 เฉลี่ย: ${sensorAverages?.co2 || 600} ppm
      - PM2.5 เฉลี่ย: ${sensorAverages?.pm25 || 10} µg/m³

      จงคำนวณค่าน้ำหนักความสำคัญเฉพาะบุคคล (Personalized Weight) ของทั้ง 6 ตัวแปร โดยผลรวมของทั้ง 6 Weights ต้องเท่ากับ 1.0 (100%) พอดี 
      พร้อมทั้งสรุปสาเหตุเชิงลึกและคำแนะนำปรับปรุงห้องนอน

      ตอบกลับเป็น JSON เท่านั้น (ห้ามมีอักษร Markdown หรือคำอธิบายอื่น) โครงสร้างดังนี้:
      {
        "weights": {
          "temp": 0.30,
          "hum": 0.15,
          "sound": 0.25,
          "light": 0.10,
          "co2": 0.10,
          "pm25": 0.10
        },
        "diagnosis": "สรุปสาเหตุเชิงลึกสั้นๆ 1-2 ประโยค",
        "recommendation": "คำแนะนำการปรับห้องนอน"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJsonStr = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    return NextResponse.json({ status: 'success', data: parsedData });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({
      status: 'fallback',
      data: {
        weights: { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 },
        diagnosis: "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ",
        recommendation: "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"
      }
    });
  }
}