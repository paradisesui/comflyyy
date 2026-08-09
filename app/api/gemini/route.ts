import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Error: ไม่พบ GEMINI_API_KEY ใน Environment Variables ของระบบ' }, 
        { status: 500 }
      );
    }

    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json(
        { error: 'API Error: ไม่พบข้อมูลเซนเซอร์สำหรับประมวลผล' }, 
        { status: 400 }
      );
    }

    const promptText = `
      ข้อมูลเซนเซอร์ห้องนอนขณะนี้:
      - อุณหภูมิ: ${sensorData.temperature?.toFixed(1) ?? '25'} °C (เกณฑ์เหมาะสม: 22-25 °C)
      - ความชื้น: ${sensorData.humidity?.toFixed(0) ?? '50'} % (เกณฑ์เหมาะสม: 40-60 %)
      - CO2: ${sensorData.co2 ?? '500'} ppm (เกณฑ์เหมาะสม: < 800 ppm)
      - แสงสว่าง: ${sensorData.lux?.toFixed(1) ?? '0'} Lux (เกณฑ์เหมาะสม: < 5 Lux)
      - เสียงรบกวน: ${sensorData.sound ?? '0'} Raw Signal (เกณฑ์เงียบ: < 1000)

      ข้อบังคับในการตอบอย่างเข้มงวด:
      1. ห้ามมีคำทักทาย คำเกริ่นนำ คำอวยพร หรือคำลงท้ายเด็ดขาด (เช่น "สวัสดีค่ะ", "โค้ชขอแนะนำ", "จัดการตามนี้แล้วนอนหลับสนิทฝันดี")
      2. แสดงเฉพาะรายการคำแนะนำที่เป็นข้อๆ (1., 2., 3.) ทันทีในบรรทัดแรก
      3. จำนวนข้อต้องเท่ากับจำนวนปัญหาของเซนเซอร์ที่หลุดเกณฑ์มาตรฐานพอดี
      4. แต่ละข้อให้เขียนสั้น กระชับ เป็น Action ที่ผู้ใช้ต้องทำทันที และต่อด้วยเหตุผลที่ให้คำแนะนำนี้ห้ามรายงานค่าตัวเลขเด็ดขาด
      5. กรณีไม่มีปัญหาเลย ให้ตอบเพียงข้อเดียวสั้นๆ ว่า "สภาพแวดล้อมเหมาะสมกับการนอนแล้ว เข้านอนได้เลย"
    `;

    const availableModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash'
    ];

    let lastErrorMessage = '';

    for (const modelName of availableModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
          }
        );

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({ result: data.candidates[0].content.parts[0].text.trim() });
        } else {
          lastErrorMessage = `[${modelName}] ${data.error?.message || JSON.stringify(data)}`;
        }
      } catch (err: any) {
        lastErrorMessage = `[${modelName}] ${err.message || 'Network failure'}`;
      }
    }

    return NextResponse.json({ 
      error: `Gemini API Error: ${lastErrorMessage}` 
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: `Server Internal Error: ${error.message || 'Unknown Server Error'}` 
    }, { status: 500 });
  }
}