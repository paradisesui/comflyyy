import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { result: '💡 คำแนะนำชั่วคราว: ปรับอุณหภูมิห้องให้อยู่ในช่วง 23-25°C ปิดไฟให้มืดสนิท และแย้มประตูเล็กน้อยเพื่อให้อากาศถ่ายเท' }
      );
    }

    const { sensorData } = await req.json();

    if (!sensorData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลเซนเซอร์สำหรับประมวลผล' }, 
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
      2. เน้นให้คำแนะนำ Action Plan ว่าต้องปรับเปลี่ยนอะไรในห้องนอนบ้าง โดยแบ่งเป็นข้อๆ สั้นๆ (จำนวนข้อตามจำนวนปัญหาที่ต้องเปลี่ยน)
      3. ให้คำแนะนำครอบคลุมการปรับสภาพแวดล้อมและการเตรียมตัวเข้านอน
      4. ใช้น้ำเสียงเป็นกันเอง ใส่ใจ ห่วงใย และอ่านง่าย
    `;

    // เลือกใช้เฉพาะโมเดลที่มีโควตาใน Dashboard ของคุณ
    const availableModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash'
    ];

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
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }

    // Fallback เมื่อโควตารายวัน 20 ครั้งหมดลง
    return NextResponse.json({ 
      result: '🌙 คำแนะนำสภาวะการนอนปัจจุบัน:\n1. ปรับเครื่องปรับอากาศให้อยู่ในช่วง 24-25°C เพื่อป้องกันอุณหภูมิสะสม\n2. เปิดพัดลมหมุนเวียนอากาศเบาๆ และปิดไฟให้มืดสนิทเพื่อกระตุ้นการหลั่งเมลาโทนิน' 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      result: '🌙 คำแนะนำสภาวะการนอนปัจจุบัน:\n1. ปรับเครื่องปรับอากาศให้อยู่ในช่วง 24-25°C เพื่อป้องกันอุณหภูมิสะสม\n2. เปิดพัดลมหมุนเวียนอากาศเบาๆ และปิดไฟให้มืดสนิทเพื่อกระตุ้นการหลั่งเมลาโทนิน' 
    });
  }
}