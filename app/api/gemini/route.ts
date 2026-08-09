import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// รายชื่อ AI Models ที่จะลองเรียกตามลำดับ
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash' // กันเหนียวสำหรับเวอร์ชันดั้งเดิม
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensorAverages, restlessCount } = body;

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านสรีรวิทยาการนอนหลับ
      จงวิเคราะห์ข้อมูลสภาพแวดล้อมห้องนอนกับการดิ้นตื่น (${restlessCount || 0} ครั้ง) ต่อไปนี้:
      - อุณหภูมิเฉลี่ย: ${sensorAverages?.temp?.toFixed(1) || 25}°C
      - ความชื้นเฉลี่ย: ${sensorAverages?.hum?.toFixed(1) || 50}%
      - เสียงเฉลี่ย: ${sensorAverages?.sound?.toFixed(1) || 400}
      - แสงเฉลี่ย: ${sensorAverages?.light?.toFixed(1) || 0} Lux
      - CO2 เฉลี่ย: ${sensorAverages?.co2?.toFixed(1) || 600} ppm
      - PM2.5 เฉลี่ย: ${sensorAverages?.pm25?.toFixed(1) || 10} µg/m³

      จงคำนวณค่าน้ำหนักเฉพาะบุคคล (Personalized Weight) ของทั้ง 6 ตัวแปร โดยผลรวมทั้ง 6 Weights ต้องเท่ากับ 1.0 (100%) พอดี
      พร้อมสรุปสาเหตุเชิงลึกและคำแนะนำปรับปรุงห้องนอน

      ตอบกลับเป็น JSON โครงสร้างนี้เท่านั้น (ห้ามมี Markdown):
      {
        "weights": {
          "temp": 0.30,
          "hum": 0.15,
          "sound": 0.25,
          "light": 0.10,
          "co2": 0.10,
          "pm25": 0.10
        },
        "diagnosis": "ข้อสรุปสาเหตุเชิงลึกสั้นๆ 1-2 ประโยค",
        "recommendation": "คำแนะนำการปรับห้องนอน"
      }
    `;

    let responseText = '';
    let successModel = '';

    // ลูปทดสอบยิงทีละ Model หากตัวไหนสำเร็จจะหลุดวนลูปทันที
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
        console.warn(`Model ${modelName} failed, trying next candidate...`);
      }
    }

    if (!responseText) {
      throw new Error('All Gemini candidate models failed to respond.');
    }

    const cleanJsonStr = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    return NextResponse.json({ 
      status: 'success', 
      modelUsed: successModel,
      data: parsedData 
    });

  } catch (error) {
    console.error('Gemini Route Error:', error);
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