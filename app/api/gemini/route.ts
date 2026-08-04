import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ไม่พบ GEMINI_API_KEY ในระบบ' }, { status: 500 });
    }

    const { sensorData } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // ปรับ Prompt เน้นคำแนะนำเชิงปฏิบัติ (Actionable Advice)
    const prompt = `
      คุณคือโค้ชผู้เชี่ยวชาญด้านสุขภาพและการนอนหลับ (Professional Sleep Coach) ประจำแอป COMFLYY
      
      ข้อมูลเซนเซอร์ห้องนอนขณะนี้:
      - อุณหภูมิ: ${sensorData.temperature?.toFixed(1)} °C (เกณฑ์เหมาะสม: 22-25 °C)
      - ความชื้น: ${sensorData.humidity?.toFixed(0)} % (เกณฑ์เหมาะสม: 40-60 %)
      - CO2: ${sensorData.co2} ppm (เกณฑ์เหมาะสม: < 800 ppm)
      - แสงสว่าง (Lux): ${sensorData.lux?.toFixed(1)} Lux (เกณฑ์เหมาะสม: < 5 Lux)
      - เสียงรบกวน (Sound): ${sensorData.sound} Raw Signal (เกณฑ์เงียบ: < 1000)

      ข้อกำหนดในการตอบคำถาม:
      1. ไม่ต้องอธิบายทวนว่าค่าไหนสูงหรือต่ำกี่หน่วย 
      2. ให้คำแนะนำทันทีว่าผู้ใช้ควร "ปรับเปลี่ยนหรือลงมือทำอย่างไร" ในห้องนอนขณะนี้ เพื่อช่วยให้หลับสนิทขึ้น
      3. สรุปกระชับไม่เกิน 2-3 ประโยค ให้ความรู้สึกเหมือนโค้ชดูแลสุขภาพพูดคุยอย่างเป็นกันเองและเป็นห่วง
      4. ให้คำแนะนำอย่างมี action เช่น "ปรับแอร์ลง 1 องศา", "แย้มประตูระบายอากาศ", "ปิดไฟดวงสลัว" เป็นต้น
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำแนะนำ' }, { status: 500 });
  }
}