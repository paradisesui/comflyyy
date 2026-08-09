import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensorAverages, restlessCount } = body;

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านสรีรวิทยาการนอนหลับ
      จงวิเคราะห์เชิงลึก (Diagnose) จากข้อมูลสภาพแวดล้อมห้องนอนกับการดิ้นตื่น (${restlessCount || 0} ครั้ง) ที่ผ่านการ Data Matching แล้ว ดังนี้:
      - CO2 เฉลี่ย: ${sensorAverages?.co2?.toFixed(1) || 650} ppm
      - อุณหภูมิเฉลี่ย: ${sensorAverages?.temp?.toFixed(1) || 26.5}°C
      - ความชื้นเฉลี่ย: ${sensorAverages?.hum?.toFixed(1) || 52}%
      - PM2.5 เฉลี่ย: ${sensorAverages?.pm25?.toFixed(1) || 8} µg/m³
      - เสียงเฉลี่ย: ${sensorAverages?.sound?.toFixed(1) || 28} dB
      - แสงเฉลี่ย: ${sensorAverages?.light?.toFixed(1) || 0} Lux

      จงคำนวณ Personalized Weight ของทั้ง 6 ตัวแปร โดยผลรวมต้องเท่ากับ 1.0 (100%)
      พร้อมสรุปสาเหตุของปัญหาเชิงลึก และคำแนะนำปรับปรุงห้องนอน

      ตอบเป็น JSON เท่านั้น (ห้ามมี Markdown):
      {
        "weights": {
          "co2": 0.20,
          "temp": 0.25,
          "hum": 0.15,
          "pm25": 0.10,
          "sound": 0.20,
          "light": 0.10
        },
        "diagnosis": "ระดับ CO2 ที่สูงถึง... ส่งผลให้สมองขาดออกซิเจน...",
        "recommendation": "ควรเปิดระบบระบายอากาศหรือแง้มหน้าต่างเล็กน้อย..."
      }
    `;

    let responseText = '';
    let successModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) {
          successModel = modelName;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }

    if (!responseText) throw new Error('All models failed');

    const cleanJsonStr = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    return NextResponse.json({ status: 'success', modelUsed: successModel, data: parsedData });
  } catch (error) {
    return NextResponse.json({
      status: 'fallback',
      data: {
        weights: { co2: 0.20, temp: 0.25, hum: 0.15, pm25: 0.10, sound: 0.20, light: 0.10 },
        diagnosis: "ระดับ CO2 และอุณหภูมิที่สูงเกินเกณฑ์ส่งผลต่อกระบวนการระบายความร้อนของร่างกายขณะหลับ",
        recommendation: "ควรเปิดระบบระบายอากาศและปรับอุณหภูมิให้อยู่ช่วง 23-25°C"
      }
    });
  }
}