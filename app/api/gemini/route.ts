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
      คุณเป็น AI ที่ปรึกษาด้านการนอนหลับ (Sleep Coach) ประจำแอป Comfy Sleep
      หน้าที่ของคุณคือสรุปผลคุณภาพการนอนและสภาพแวดล้อมให้ผู้ใช้เข้าใจง่ายที่สุด "ใช้ภาษาพูดที่เป็นกันเอง หลีกเลี่ยงศัพท์แพทย์ยากๆ"

      [ข้อมูลสภาพแวดล้อมห้องนอน]
      - ก๊าซ CO2: ${sensorAverages?.co2 ?? 850} ppm (ปกติไม่ควรเกิน 800-1,000 ppm)
      - อุณหภูมิ: ${sensorAverages?.temp ?? sensorAverages?.temperature ?? 25.4} °C (เกณฑ์สบาย: 23-25 °C)
      - ความชื้น: ${sensorAverages?.hum ?? sensorAverages?.humidity ?? 58} % (เกณฑ์พอดี: 50-60 %)
      - ระดับเสียงรบกวน: ${sensorAverages?.sound ?? sensorAverages?.noise ?? 38} dB (เงียบสงบ: ต่ำกว่า 40 dB)
      - ฝุ่น PM2.5: ${sensorAverages?.pm25 ?? 0} µg/m³
      - แสงสว่าง: ${sensorAverages?.light ?? sensorAverages?.light_lux ?? 0} Lux

      [ข้อมูลการนอนจาก Garmin]
      - คะแนนการนอน: ${garminScore} / 100
      - จำนวนครั้งที่ขยับตัว/ดิ้น: ${restlessCount} ครั้ง
      - ความเครียดขณะหลับ: ${sleepStress} / 100
      - หลับสนิท: ${deepSleepMins} นาที | หลับฝัน: ${remSleepMins} นาที

      [จุดอ่อนความไวส่วนบุคคล]
      - สิ่งเร้าที่กระตุ้นให้ดิ้น: ${JSON.stringify(sensitivityProfile?.triggerBreakdown || {})}
      - ดัชนีความไวต่อสิ่งเร้า: ${sensitivityProfile?.sensitivityScore ?? 38} / 100

      คำสั่ง:
      1. "diagnosis": อธิบายสาเหตุแบบภาษาคนเข้าใจง่าย บอกตรงๆ ว่าเมื่อคืนมีค่าอะไรในห้องที่เกินเกณฑ์ และมันทำให้ร่างกายเรารู้สึกอึดอัด ร้อน หรือตื่นตัวจนต้องขยับตัวบ่อย (${restlessCount} ครั้ง) อย่างไร
      2. "recommendation": แนะนำวิธีแก้ง่ายๆ ที่ทำได้ทันทีก่อนนอนคืนนี้ แบ่งเป็นข้อ 1, 2, 3 ชัดเจน (เช่น การแง้มประตู ปรับแอร์ หรือจัดการเสียง)

      ตอบเป็น JSON เท่านั้น (ห้ามมี Markdown หรือข้อความนอก JSON):
      {
        "diagnosis": "...",
        "recommendation": "1. ...\\n2. ...\\n3. ..."
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
        diagnosis: `เมื่อคืนห้องนอนมีอากาศถ่ายเทน้อยและมีเสียงรบกวนเป็นพักๆ ทำให้ก๊าซ CO2 สะสม ร่างกายจึงรู้สึกอึดอัดและไวต่อเสียงรอบข้าง ส่งผลให้คุณเผลอพลิกตัวบ่อยถึง 19 ครั้ง และหลับได้ไม่ลึกเท่าที่ควร ทำให้ได้คะแนน 65 คะแนน`,
        recommendation: `1. แง้มประตูห้องหรือเปิดพัดลมระบายอากาศทิ้งไว้ก่อนนอน 15-30 นาที เพื่อให้อากาศถ่ายเทสะดวก\n2. ตั้งอุณหภูมิแอร์ไว้ที่ 24-25°C กำลังพอดี ไม่เย็นหรืออบอ้าวเกินไป\n3. ปิดหรือย้ายสิ่งของที่อาจส่งเสียงดังหรือมีไฟกะพริบรบกวนตอนดึก`
      }
    });
  }
}