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

    // เรียกใช้ gemini-2.5-flash ผ่าน v1beta Endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
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
      const rawErrorMessage = data?.error?.message || `HTTP Status: ${response.status}`;
      return NextResponse.json(
        { error: `Google API Error (${response.status}): ${rawErrorMessage}` },
        { status: response.status }
      );
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