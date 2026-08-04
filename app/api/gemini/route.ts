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
      คุณคือโค้ชผู้เชี่ยวชาญด้านสุขภาพและการนอนหลับ (Professional Sleep Coach) ประจำแอป COMFLYY
      
      ข้อมูลเซนเซอร์ห้องนอนขณะนี้:
      - อุณหภูมิ: ${sensorData.temperature?.toFixed(1) ?? '25'} °C (เกณฑ์เหมาะสม: 22-25 °C)
      - ความชื้น: ${sensorData.humidity?.toFixed(0) ?? '50'} % (เกณฑ์เหมาะสม: 40-60 %)
      - CO2: ${sensorData.co2 ?? '500'} ppm (เกณฑ์เหมาะสม: < 800 ppm)
      - แสงสว่าง: ${sensorData.lux?.toFixed(1) ?? '0'} Lux (เกณฑ์เหมาะสม: < 5 Lux)
      - เสียงรบกวน: ${sensorData.sound ?? '0'} Raw Signal (เกณฑ์เงียบ: < 1000)

      ข้อบังคับในการตอบ:
      1. ห้ามรายงานค่าตัวเลข ห้ามบอกว่าค่าไหนสูงหรือต่ำกี่หน่วยเด็ดขาด
      2. ตรวจสอบค่าเซนเซอร์ว่ามีกี่ปัจจัยที่หลุดเกณฑ์มาตรฐาน แล้วให้ "จำนวนคำแนะนำเท่ากับจำนวนปัญหาที่ต้องแก้ไขพอดี"
      3. กรณีสภาพแวดล้อมดีทุกอย่าง (ไม่พบปัญหา) ให้คำแนะนำชื่นชมและวิธีรักษาบรรยากาศการนอนสั้นๆ 1 ข้อ
      4. ให้คำแนะนำเชิง Action Plan ชัดเจนว่าผู้ใช้ต้องลงมือปรับเปลี่ยนอะไรในห้องนอนทันที
      5. ใช้น้ำเสียงเป็นกันเอง ใส่ใจ และอ่านง่าย
    `;

    const availableModels = [
      'gemini-2.5-flash-lite',
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
          return NextResponse.json({ result: data.candidates[0].content.parts[0].text });
        } else {
          // ดึงข้อความ Error จริงจากระบบของ Google
          lastErrorMessage = data.error?.message || `HTTP ${response.status}: ${JSON.stringify(data)}`;
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'Network failure when reaching Gemini API';
      }
    }

    // หากยิงไม่ผ่าน จะส่งรายละเอียด Error จริงกลับไปแสดงผลทันที
    return NextResponse.json({ 
      error: `Gemini API Error: ${lastErrorMessage}` 
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: `Server Internal Error: ${error.message || 'Unknown Server Error'}` 
    }, { status: 500 });
  }
}