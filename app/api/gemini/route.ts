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

    // กรองค่าเสียงที่เพี้ยนจากเซนเซอร์
    const rawSound = sensorData.sound ?? 0;
    const soundText = rawSound > 120 ? 'ปกติ' : `${rawSound} dB`;

    const promptText = `
คุณเป็นผู้เชี่ยวชาญด้านสภาพแวดล้อมห้องนอน
จงวิเคราะห์ข้อมูลเซนเซอร์ด้านล่าง และสรุปผลกระทบพร้อมคำแนะนำสั้นๆ ภาษาไทยไม่เกิน 2 ประโยคเท่านั้น

ข้อมูลเซนเซอร์:
- อุณหภูมิ: ${sensorData.temperature ?? 'N/A'} °C
- ความชื้น: ${sensorData.humidity ?? 'N/A'} %
- CO2: ${sensorData.co2 ?? 'N/A'} ppm
- PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
- แสง: ${sensorData.lux ?? 'N/A'} Lux
- เสียง: ${soundText}

ข้อบังคับ: ตอบเป็นข้อความภาษาไทย 1-2 ประโยคเท่านั้น ห้ามพ่นกระบวนการคิด ห้ามมีภาษาอังกฤษเด็ดขาด
    `;

    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: 'no-store' }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json(
        { error: `ไม่สามารถดึงรายชื่อโมเดลได้ (${listRes.status})` },
        { status: listRes.status }
      );
    }

    const validModels: string[] = listData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      ?.map((m: any) => m.name) || [];

    if (validModels.length === 0) {
      return NextResponse.json({ error: 'ไม่พบโมเดลที่พร้อมใช้งาน' }, { status: 500 });
    }

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
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200,
              // ปิด Thinking Mode ของ Gemini 2.0 / Flash
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts) {
        // ดึงเฉพาะ Text ส่วนสุดท้ายที่ไม่ใช่ Thought Process
        const parts = data.candidates[0].content.parts;
        let finalAnswer = parts[parts.length - 1]?.text || '';

        // ถ้ายังมีหลุด สามารถทำความสะอาดเพิ่มเติมได้
        finalAnswer = finalAnswer.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

        if (finalAnswer) {
          return NextResponse.json({ result: finalAnswer });
        }
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