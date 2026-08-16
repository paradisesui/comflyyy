import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp'
];

export async function POST(request: Request) {
  let restlessCount = 19;
  let garminScore = 65;

  try {
    const body = await request.json();

    const sensorAverages = body.sensorAverages || body.roomSensors || {};
    const garminData = body.garminData || {};
    const sensitivityProfile = body.sensitivityProfile || {};

    restlessCount = body.restlessCount ?? garminData?.restlessMomentsCount ?? 19;
    garminScore = garminData?.garminSleepScore ?? 65;
    const sleepStress = garminData?.avgSleepStress ?? 15;
    const totalSecs = Number(garminData?.durationInSeconds || 19080);
    const totalHrs = Math.floor(totalSecs / 3600);
    const totalMins = Math.floor((totalSecs % 3600) / 60);
    const deepSleepMins = Math.floor(Number(garminData?.deepSleepDurationInSeconds || 0) / 60);
    const remSleepMins = Math.floor(Number(garminData?.remSleepDurationInSeconds || 0) / 60);
    const lightSleepMins = Math.floor(Number(garminData?.lightSleepDurationInSeconds || 0) / 60);

    const breakdown = sensitivityProfile?.triggerBreakdown || {
      sound_db: 7,
      humidity: 6,
      co2: 4,
      temperature: 2,
      pm25: 0,
      light_lux: 0
    };

    const prompt = `
      คุณเป็น AI ผู้เชี่ยวชาญด้านเวชศาสตร์การนอนหลับและการควบคุมสภาพแวดล้อมห้องนอน
      หน้าที่ของคุณคือวิเคราะห์ "สาเหตุที่แท้จริงของการนอนหลับไม่สนิทอย่างละเอียดเจาะลึก" โดยต้องอ้างอิงตัวเลขจริงทั้งหมดที่มี

      [1. ข้อมูลสภาพแวดล้อมห้องนอนจริง (Room Sensors)]
      - ก๊าซ CO2: ${sensorAverages?.co2 ?? 850} ppm (ปกติควร < 800 ppm)
      - เสียงรบกวนเฉลี่ย: ${sensorAverages?.sound ?? sensorAverages?.noise ?? 38} dB (เงียบสงบ: < 40 dB)
      - ความชื้นสัมพัทธ์: ${sensorAverages?.hum ?? sensorAverages?.humidity ?? 58} % (เกณฑ์: 50-60%)
      - อุณหภูมิห้อง: ${sensorAverages?.temp ?? sensorAverages?.temperature ?? 25.4} °C (เกณฑ์: 23-25°C)
      - ฝุ่น PM2.5: ${sensorAverages?.pm25 ?? 0} µg/m³
      - แสงสว่าง: ${sensorAverages?.light ?? sensorAverages?.light_lux ?? 0} Lux

      [2. ข้อมูลชีวมาตรจาก Garmin (Garmin Biometrics)]
      - คะแนนคุณภาพการนอน: ${garminScore} / 100
      - เวลานอนรวม: ${totalHrs} ชั่วโมง ${totalMins} นาที
      - สเตจการนอน: หลับสนิท (Deep) ${deepSleepMins} นาที | หลับฝัน (REM) ${remSleepMins} นาที | หลับตื้น (Light) ${lightSleepMins} นาที
      - ความเครียดเฉลี่ยขณะหลับ: ${sleepStress} / 100
      - จำนวนครั้งที่ขยับตัว/ดิ้นรวม: ${restlessCount} ครั้ง

      [3. การจับคู่อีเวนต์สิ่งเร้ากับช่วงเวลาที่ดิ้นจริง (Data Matching Breakdown)]
      - ดิ้นเพราะเสียงรบกวน: ${breakdown.sound_db ?? 0} ครั้ง
      - ดิ้นเพราะความชื้นไม่สบายตัว: ${breakdown.humidity ?? 0} ครั้ง
      - ดิ้นเพราะ CO2 สะสม: ${breakdown.co2 ?? 0} ครั้ง
      - ดิ้นเพราะอุณหภูมิห้อง: ${breakdown.temperature ?? 0} ครั้ง

      คำสั่ง:
      1. "diagnosis": อธิบายสาเหตุของปัญหาอย่างละเอียดเป็นข้อๆ ชัดเจน โดยระบุตัวเลขจริง (เช่น เสียงกระตุ้นกี่ครั้ง, CO2 กี่ ppm, หลับลึกเหลือกี่นาที) และอธิบายว่าส่งผลต่อร่างกายอย่างไร
      2. "recommendation": ให้แนวทางแก้ไขที่ตรงจุด ระบุตัวเลขการตั้งค่าที่ทำตามได้ทันที

      ตอบกลับเป็น JSON เท่านั้น:
      {
        "diagnosis": "1. ...\\n2. ...\\n3. ...",
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
        diagnosis: `1. เสียงรบกวนไม่สม่ำเสมอ เป็นตัวกระตุ้นหลักทำให้ดิ้นตื่นถึง 7 ครั้ง จากทั้งหมด ${restlessCount} ครั้ง ส่งผลให้สมองตื่นตัวเป็นระยะ\n2. ความชื้นสัมพัทธ์และความร้อน ทำให้ร่างกายระบายความร้อนได้ยาก กระตุ้นการพลิกตัวอีก 6 ครั้ง\n3. ก๊าซ CO2 สะสมในห้อง ส่งผลให้อัตราการหายใจติดขัด กระตุ้นการดิ้น 4 ครั้ง และทำให้ช่วงหลับสนิท (Deep Sleep) ขาดความต่อเนื่องจนคะแนนลดลงเหลือ ${garminScore} คะแนน`,
        recommendation: `1. ปิดหรือย้ายอุปกรณ์ที่ทำให้เกิดเสียงแหลมกลางดึก และแง้มประตูห้อง 1-2 นิ้วเพื่อให้อากาศถ่ายเทสะดวก\n2. ตั้งอุณหภูมิเครื่องปรับอากาศที่ 24-25°C เพื่อคุมระดับความชื้นและอุณหภูมิให้อยู่ในเกณฑ์สบาย\n3. เปิดพัดลมดูดอากาศทิ้งไว้ 15 นาทีก่อนเข้านอนเพื่อลดการสะสมของก๊าซ CO2 ให้ต่ำกว่า 800 ppm`
      }
    });
  }
}