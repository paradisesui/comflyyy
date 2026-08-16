import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sensorAverages = body.sensorAverages || body.roomSensors || {};
    const garminData = body.garminData || {};
    const sensitivityProfile = body.sensitivityProfile || {};

    const restlessCount = body.restlessCount ?? garminData?.restlessMomentsCount ?? 19;
    const garminScore = garminData?.garminSleepScore ?? 65;
    const sleepStress = garminData?.avgSleepStress ?? 15;
    const deepSleepMins = Math.floor(Number(garminData?.deepSleepDurationInSeconds || 0) / 60);
    const remSleepMins = Math.floor(Number(garminData?.remSleepDurationInSeconds || 0) / 60);

    const prompt = `
      คุณเป็นแพทย์และผู้เชี่ยวชาญด้านเวชศาสตร์การนอนหลับ (Sleep Specialist & Chronobiologist)
      จงวิเคราะห์ความสัมพันธ์เชิงลึกระหว่าง "สภาพแวดล้อมห้องนอน", "ชีวมาตรการนอน (Garmin)", และ "ความไวส่วนบุคคล (Personal Sensitivity)"

      [ข้อมูลตรวจวัดสภาพแวดล้อมห้องนอน]
      - ก๊าซ CO2: ${sensorAverages?.co2 ?? 850} ppm (เกณฑ์ปกติ: < 800 ppm, เริ่มส่งผลต่อสมอง: > 1,000 ppm)
      - อุณหภูมิ: ${sensorAverages?.temp ?? sensorAverages?.temperature ?? 25.4} °C (เกณฑ์: 23-25 °C)
      - ความชื้น: ${sensorAverages?.hum ?? sensorAverages?.humidity ?? 58} % (เกณฑ์: 50-60 %)
      - ระดับเสียงรบกวน: ${sensorAverages?.sound ?? sensorAverages?.noise ?? 38} dB (เกณฑ์: < 40 dB)
      - ฝุ่น PM2.5: ${sensorAverages?.pm25 ?? 0} µg/m³
      - แสงสว่าง: ${sensorAverages?.light ?? sensorAverages?.light_lux ?? 0} Lux

      [ข้อมูลการนอนหลับจริงจาก Garmin]
      - Sleep Score: ${garminScore} / 100
      - การดิ้น/ขยับตัว (Restless Moments): ${restlessCount} ครั้ง
      - ความเครียดขณะหลับ (Sleep Stress): ${sleepStress} / 100
      - สเตจการนอน: Deep Sleep ${deepSleepMins} นาที | REM Sleep ${remSleepMins} นาที

      [จุดอ่อนความไวของผู้ใช้ (Sensitivity Profile)]
      - รายการตัวกระตุ้นการดิ้น: ${JSON.stringify(sensitivityProfile?.triggerBreakdown || {})}
      - ดัชนีความไว: ${sensitivityProfile?.sensitivityScore ?? 38} / 100

      คำสั่งในการวิเคราะห์:
      1. "diagnosis": อธิบายสาเหตุของปัญหาอย่างละเอียด ชี้ชัดว่าค่าเซนเซอร์ตัวไหนที่พุ่งสูงหรือผิดปกติ ส่งผลกระทบต่อระบบประสาท (Sympathetic) การหายใจ หรือสเตจการนอน (Deep/REM) อย่างไร ทำให้เกิดการดิ้นถึง ${restlessCount} ครั้ง และร่างกายของผู้ใช้ไวต่อสิ่งเร้าใดเป็นพิเศษ
      2. "recommendation": ให้แนวทางแก้ไขแบบ Actionable Items เป็นข้อๆ ชัดเจน (ระบุตัวเลขอุณหภูมิ เวลา หรือวิธีการจัดการห้องนอนที่ทำได้ทันที)

      ตอบเป็น JSON เท่านั้น (ห้ามใส่ Markdown ครอบนอก):
      {
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
          generationConfig: { responseMimeType: 'application/json' }
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
  } catch (error: any) {
    return NextResponse.json({
      status: 'fallback',
      data: {
        diagnosis: `จากการจับคู่ข้อมูลพบว่า ระดับก๊าซ CO2 และความผันผวนของเสียง เป็นตัวกระตุ้นหลักที่ตรงกับช่วงที่ร่างกายเกิดการขยับตัว 19 ครั้ง ส่งผลให้ระบบประสาทซิมพาเทติกถูกกระตุ้นเป็นระยะ วงจรการนอนหลับลึก (Deep Sleep) ขาดความต่อเนื่อง และทำให้คะแนนการฟื้นตัวอยู่ที่ 65 คะแนน`,
        recommendation: `1. เปิดพัดลมดูดอากาศหรือแง้มประตูห้อง 1-2 นิ้วก่อนนอน เพื่อรักษาค่า CO2 ให้ต่ำกว่า 800 ppm\n2. ตั้งอุณหภูมิแอร์คงที่ที่ 24-25°C เพื่อป้องกันการสะสมความร้อน\n3. ปิดหรือลดอุปกรณ์ที่กำเนิดเสียงแหลมรบกวนกลางดึกเพื่อลดอัตราการตื่นตัว`
      }
    });
  }
}