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
    const soundText = rawSound > 1000 ? 'มีเสียงรบกวน (> 45 dB)' : 'ปกติ (< 35 dB)';

    const promptText = `
คุณคือ AI ผู้เชี่ยวชาญด้านวิทยาศาสตร์การนอนหลับ (Sleep Science Expert)
จงวิเคราะห์ข้อมูลเซนเซอร์ห้องนอนโดยเทียบกับ "เกณฑ์มาตรฐานทางการแพทย์และงานวิจัย" ดังนี้:

เกณฑ์มาตรฐานงานวิจัย (Ideal Sleep Environment):
1. อุณหภูมิ: เหมาะสมที่สุดคือ 18-22°C (ไม่ควรเกิน 25°C)
2. ความชื้น: เหมาะสมที่สุดคือ 40% - 60% (หากเกิน 65% ถือว่าชื้นเกินไปสำหรับห้องนอน)
3. แสงสว่าง: เหมาะสมที่สุดคือ < 5 Lux (ควรมืดสนิท)
4. CO2: เหมาะสมคือ < 800 ppm
5. PM2.5: เหมาะสมคือ < 15 µg/m³
6. เสียง: เหมาะสมคือ < 35 dB (เงียบสนิท)

ข้อมูลเซนเซอร์ปัจจุบัน:
- อุณหภูมิ: ${sensorData.temperature ?? 'N/A'} °C
- ความชื้น: ${sensorData.humidity ?? 'N/A'} %
- CO2: ${sensorData.co2 ?? 'N/A'} ppm
- PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
- แสง: ${sensorData.lux ?? 'N/A'} Lux
- เสียง: ${soundText}

คำสั่ง:
ให้คำแนะนำภาษาไทยสั้นๆ 1-2 ประโยค ระบุเฉพาะตัวแปรที่ไม่ผ่านเกณฑ์มาตรฐานข้างต้น พร้อมบอกวิธีแก้ไขสั้นๆ (ห้ามมีภาษาอังกฤษ, ห้ามมีขั้นตอนการคิด)
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
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        let finalAnswer = parts[parts.length - 1]?.text || '';
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