import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // รองรับทั้งแบบส่งตรง และแบบส่งผ่านตัวแปรย่อย
    const sensorAverages = body.sensorAverages || body.roomSensors || {};
    const garminData = body.garminData || {};
    const sensitivityProfile = body.sensitivityProfile || {};
    
    const restlessCount = body.restlessCount ?? garminData?.restlessMomentsCount ?? 0;
    const garminScore = garminData?.garminSleepScore ?? '--';
    const sleepStress = garminData?.avgSleepStress ?? '--';
    const topTrigger = sensitivityProfile?.topTrigger || 'สภาพแวดล้อมทั่วไป';

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านสรีรวิทยาและเวชศาสตร์การนอนหลับ (Sleep Specialist)
      จงวิเคราะห์เชิงลึก (Diagnose) โดยเชื่อมโยง 3 ด้านเข้าด้วยกัน:
      1. สภาพแวดล้อมห้องนอนจริง (Room Sensors)
      2. สถิติการนอนจริงจากนาฬิกา (Garmin Biometrics)
      3. จุดอ่อนความไวส่วนบุคคล (Personal Sensitivity Profile) เพื่อดูว่าผู้ใช้คนนี้ "อ่อนไหว/sensitive ต่อสิ่งเร้าใดเป็นพิเศษ"

      [ข้อมูลตรวจวัดสภาพแวดล้อม]
      - CO2 เฉลี่ย: ${sensorAverages?.co2 ?? 650} ppm (เกณฑ์มาตรฐาน: < 800-1000 ppm)
      - อุณหภูมิเฉลี่ย: ${sensorAverages?.temp ?? sensorAverages?.temperature ?? 25.0}°C (เกณฑ์มาตรฐาน: 23-25°C)
      - ความชื้นเฉลี่ย: ${sensorAverages?.hum ?? sensorAverages?.humidity ?? 55}% (เกณฑ์มาตรฐาน: 50-60%)
      - PM2.5 เฉลี่ย: ${sensorAverages?.pm25 ?? 0} µg/m³
      - เสียงรบกวนเฉลี่ย: ${sensorAverages?.sound ?? sensorAverages?.noise ?? 35} dB (เกณฑ์มาตรฐาน: < 40 dB)
      - แสงสว่างเฉลี่ย: ${sensorAverages?.light ?? sensorAverages?.light_lux ?? 0} Lux

      [ข้อมูลสรีรวิทยาการนอนจาก Garmin]
      - คะแนนการนอน (Garmin Sleep Score): ${garminScore} / 100
      - จำนวนครั้งการขยับตัว/ดิ้น (Restless Moments): ${restlessCount} ครั้ง
      - ความเครียดเฉลี่ยขณะหลับ (Sleep Stress): ${sleepStress} / 100

      [จุดอ่อนความไวสะสมของผู้ใช้ (Sensitivity Profile)]
      - สิ่งเร้าที่กระตุ้นให้ร่างกายดิ้นมากที่สุดตามประวัติ: ${topTrigger}
      - รายละเอียดสถิติการถูกกระตุ้น: ${JSON.stringify(sensitivityProfile?.triggerBreakdown || {})}

      คำสั่ง:
      1. คำนวณ Personalized Weight ของทั้ง 6 ปัจจัย (ผลรวมต้องเท่ากับ 1.0) โดยเพิ่มน้ำหนักให้ปัจจัยที่ผู้ใช้ Sensitive หรือเกินเกณฑ์มาตรฐาน
      2. สรุป "diagnosis" อธิบายสาเหตุของปัญหาการนอน โดยชี้ชัดว่าผู้ใช้ไวต่อปัจจัยใดเป็นพิเศษและค่าใดในห้องที่ส่งผลกระทบต่อร่างกาย
      3. ให้ "recommendation" ข้อแนะนำที่เจาะจงนำไปปฏิบัติได้จริงเพื่อลดสิ่งรบกวนก่อนนอน

      ตอบเป็น JSON เท่านั้น (ห้ามมี Markdown นอก JSON):
      {
        "weights": {
          "co2": 0.20,
          "temp": 0.25,
          "hum": 0.15,
          "pm25": 0.10,
          "sound": 0.20,
          "light": 0.10
        },
        "diagnosis": "...",
        "recommendation": "..."
      }
    `;

    let responseText = '';
    let successModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
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
        weights: { co2: 0.25, temp: 0.25, hum: 0.15, pm25: 0.10, sound: 0.15, light: 0.10 },
        diagnosis: "ระดับสภาพแวดล้อมในห้องนอนมีความสัมพันธ์กับอัตราการขยับตัวระหว่างคืน โดยร่างกายมีความไวต่อการเปลี่ยนแปลงของอากาศและอุณหภูมิ",
        recommendation: "รักษาการหมุนเวียนอากาศและตั้งอุณหภูมิเครื่องปรับอากาศที่ 24-25°C เพื่อป้องกันการสะสมความร้อน"
      }
    });
  }
}