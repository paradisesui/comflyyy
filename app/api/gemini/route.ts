import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ไม่พบ GEMINI_API_KEY ในระบบ' }, 
        { status: 500 }
      );
    }

    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลเซนเซอร์สำหรับประมวลผล' }, 
        { status: 400 }
      );
    }

    // Prompt บังคับให้ให้คำแนะนำกระชับ + เน้น Action (ไม่ทวนค่าตัวเลข)
    const promptText = `
      คุณคือโค้ชผู้เชี่ยวชาญด้านสุขภาพและการนอนหลับ (Professional Sleep Coach) ประจำแอป COMFLYY
      
      ข้อมูลเซนเซอร์ห้องนอนขณะนี้:
      - อุณหภูมิ: ${sensorData.temperature?.toFixed(1) ?? '25'} °C (เกณฑ์เหมาะสม: 22-25 °C)
      - ความชื้น: ${sensorData.humidity?.toFixed(0) ?? '50'} % (เกณฑ์เหมาะสม: 40-60 %)
      - CO2: ${sensorData.co2 ?? '500'} ppm (เกณฑ์เหมาะสม: < 800 ppm)
      - แสงสว่าง: ${sensorData.lux?.toFixed(1) ?? '0'} Lux (เกณฑ์เหมาะสม: < 5 Lux)
      - เสียงรบกวน: ${sensorData.sound ?? '0'} Raw Signal (เกณฑ์เงียบ: < 1000)

      ข้อบังคับในการตอบ:
      1. ห้ามพูดทวนค่าตัวเลข ห้ามบอกว่าค่าไหนสูงหรือต่ำกี่หน่วยเด็ดขาด
      2. ให้คำแนะนำผู้ใช้ทันทีว่า "ต้องลงมือปรับเปลี่ยนห้องนอนอย่างไร" เพื่อให้หลับสนิทขึ้น
      3. เขียนกระชับสั้นๆ เพียง 5 ประโยค น้ำเสียงเป็นกันเองและใส่ใจ
      4. ให้คำแนะนำเชิงปฏิบัติชัดเจน เช่น "ปรับแอร์ลง 1 องศา", "แย้มประตูระบายอากาศ", "ปิดไฟดวงสลัว"
    `;

    // ใช้ Endpoint gemini-2.0-flash บน v1beta (แก้ไขปัญหา Model Not Found)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      console.error('Gemini API Error Detail:', data);
      return NextResponse.json(
        { error: data.error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API' },
        { status: response.status }
      );
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่สามารถสร้างคำแนะนำได้ในขณะนี้';

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('Gemini Internal Server Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ในการประมวลผล' }, 
      { status: 500 }
    );
  }
}