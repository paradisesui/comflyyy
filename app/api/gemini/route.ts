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

    // กรองค่าเสียงที่เพี้ยนเกินจริง (เช่น > 120 dB) ให้แสดงผลเป็นปกติ
    const rawSound = sensorData.sound ?? 0;
    const soundStatus = rawSound > 120 ? 'มีความชื้น/เสียงรบกวน' : `${rawSound} dB`;

    const systemInstruction = "คุณเป็นระบบ AI วิเคราะห์สภาพแวดล้อมห้องนอน ตอบเป็นภาษาไทยสั้นๆ ไม่เกิน 2 ประโยคเท่านั้น ห้ามพิมพ์ภาษาอังกฤษ ห้ามพิมพ์กระบวนการคิด ห้ามมีดอกจัน (*)";

    const userPrompt = `
ข้อมูลเซนเซอร์:
- อุณหภูมิ: ${sensorData.temperature ?? 'N/A'} °C
- ความชื้น: ${sensorData.humidity ?? 'N/A'} %
- CO2: ${sensorData.co2 ?? 'N/A'} ppm
- ฝุ่น PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
- แสง: ${sensorData.lux ?? 'N/A'} Lux
- เสียง: ${soundStatus}

สรุปผลกระทบต่อการนอนและคำแนะนำสั้นๆ 1-2 ประโยคเท่านั้น:
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
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.2, // ลดความฟุ้งซ่านของ AI
              maxOutputTokens: 150
            }
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text.trim();

        // Regex ดักกรอง: ถ้ามีภาษาอังกฤษผสมยาวๆ ให้เลือกเฉพาะประโยคภาษาไทยช่วงท้าย
        const thaiMatches = text.match(/[\u0E00-\u0E7F\s0-9.,°-]+/g);
        if (thaiMatches) {
          const combinedThai = thaiMatches.join('').trim();
          const cleanThai = combinedThai.replace(/\*+/g, '').replace(/\s+/g, ' ');
          if (cleanThai.length > 5) {
            text = cleanThai;
          }
        }

        return NextResponse.json({ result: text });
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