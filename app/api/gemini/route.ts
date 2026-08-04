import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเซนเซอร์' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Environment Variables' },
        { status: 500 }
      );
    }

    const promptText = `
      คุณคือผู้เชี่ยวชาญด้านสภาพแวดล้อมการนอน (Sleep Environment Expert)
      โปรดวิเคราะห์สภาพแวดล้อมในห้องนอนจากข้อมูลเซนเซอร์ดังนี้:
      - อุณหภูมิ: ${sensorData.temperature ?? 'N/A'}°C
      - ความชื้น: ${sensorData.humidity ?? 'N/A'}%
      - คาร์บอนไดออกไซด์ (CO2): ${sensorData.co2 ?? 'N/A'} ppm
      - ฝุ่น PM2.5: ${sensorData.pm2_5 ?? 'N/A'} µg/m³
      - แสง: ${sensorData.lux ?? 'N/A'} Lux
      - เสียง: ${sensorData.sound ?? 'N/A'} dB

      คำสั่ง: ให้คำแนะนำสั้นๆ ไม่เกิน 2 ประโยค ว่าสภาพห้องนี้น่าจะส่งผลต่อการนอนอย่างไร และควรปรับปรุงอะไรทันที
    `;

    // 1. ค้นหา Model Name ที่ใช้งานได้จริงกับ API Key นี้แบบ Dynamic
    let targetModel = 'gemini-1.5-flash';
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const availableModels: string[] = listData.models
          ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || [];

        // เลือกโมเดลตระกูล flash ที่ใช้งานได้
        const foundFlash = availableModels.find(
          (name) => name.includes('flash') && !name.includes('latest')
        );
        if (foundFlash) {
          targetModel = foundFlash;
        } else if (availableModels.length > 0) {
          targetModel = availableModels[0];
        }
      }
    } catch (e) {
      console.warn('Could not list models, falling back to default:', e);
    }

    // 2. ยิง Request ไปยัง Gemini API ด้วย Model ที่ค้นพบ
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Gemini API Error response:', data);
      const apiErrorMessage = data?.error?.message || `API Error (${response.status})`;
      return NextResponse.json({ error: apiErrorMessage }, { status: response.status });
    }

    const resultText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'ไม่สามารถดึงคำแนะนำได้ในขณะนี้';

    return NextResponse.json({ result: resultText });
  } catch (error: any) {
    console.error('Server Catch Error:', error);
    return NextResponse.json(
      { error: `Server Error: ${error.message || 'เกิดข้อผิดพลาดภายในระบบ'}` },
      { status: 500 }
    );
  }
}