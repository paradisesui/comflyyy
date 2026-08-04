import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Prompt แบบกระชับและบังคับ Format ให้ตอบสั้นทันที
    const promptText = `
คุณคือ AI วิเคราะห์สภาพแวดล้อมห้องนอน หน้าที่ของคุณคือให้คำแนะนำสั้นๆ แก่ผู้ใช้เท่านั้น
ห้ามคิดวิเคราะห์หรือพิมพ์กระบวนการคิดออกมาเด็ดขาด ให้ตอบเฉพาะผลลัพธ์สุดท้ายเป็นภาษาไทยเท่านั้น

ข้อมูลเซนเซอร์:
- อุณหภูมิ: ${sensorData.temperature ?? 'N/A'} °C
- ความชื้น: ${sensorData.humidity ?? 'N/A'} %
- CO2: ${sensorData.co2 ?? 'N/A'} ppm
- ฝุ่น PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
- แสง: ${sensorData.lux ?? 'N/A'} Lux
- เสียง: ${sensorData.sound ?? 'N/A'} dB

คำสั่ง: สรุปผลกระทบต่อการนอนและคำแนะนำการปรับปรุงสั้นๆ รวมกันไม่เกิน 2 ประโยคเท่านั้น (ห้ามเกิน 2 ประโยค)
    `;

    // 1. ดึงรายชื่อโมเดลที่ใช้งานได้จริง
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: 'no-store' }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json(
        { error: `ไม่สามารถดึงรายชื่อโมเดลได้ (${listRes.status}): ${listData?.error?.message || ''}` },
        { status: listRes.status }
      );
    }

    const validModels: string[] = listData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      ?.map((m: any) => m.name) || [];

    if (validModels.length === 0) {
      return NextResponse.json({ error: 'ไม่พบโมเดลที่พร้อมใช้งานกับ API Key นี้' }, { status: 500 });
    }

    // 2. เรียกใช้โมเดลและตัดคำตอบให้เหลือเฉพาะเนื้อหาคำแนะนำ
    let lastError = '';
    for (const fullModelName of validModels) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fullModelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let cleanResult = data.candidates[0].content.parts[0].text.trim();
        return NextResponse.json({ result: cleanResult });
      }

      lastError = data?.error?.message || `Status ${response.status}`;
    }

    return NextResponse.json(
      { error: `ไม่สามารถประมวลผลคำตอบได้: ${lastError}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Server Catch Error:', error);
    return NextResponse.json(
      { error: `Server Error: ${error.message || 'เกิดข้อผิดพลาดภายในระบบ'}` },
      { status: 500 }
    );
  }
}