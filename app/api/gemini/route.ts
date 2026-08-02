import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    // 1. ตรวจสอบการรับค่า Body จาก Client
    const body = await req.json();
    const { sensorData } = body;

    if (!sensorData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลเซนเซอร์ที่ส่งมา' },
        { status: 400 }
      );
    }

    // 2. ดึง API Key จาก Environment Variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ Environment Variables' },
        { status: 500 }
      );
    }

    // 3. เริ่มต้นใช้งาน Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ใช้ model gemini-1.5-flash ซึ่งตอบสนองได้เร็วและเหมาะกับการประมวลผลข้อมูล Realtime
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 4. สร้าง Prompt เพื่อสั่งงาน Gemini ให้วิเคราะห์สภาพแวดล้อมห้องนอน
    const prompt = `
คุณคือผู้เชี่ยวชาญด้านสุขภาพและสภาพแวดล้อมภายในห้องนอน
กรุณาวิเคราะห์ค่าจากเซนเซอร์สภาพแวดล้อมในห้องนอนดังต่อไปนี้:

- อุณหภูมิ: ${sensorData.temperature ?? 'ไม่ทราบ'} °C
- ความชื้น: ${sensorData.humidity ?? 'ไม่ทราบ'} %
- ปริมาณ CO2: ${sensorData.co2 ?? 'ไม่ทราบ'} ppm
- ปริมาณ PM2.5: ${sensorData.pm2_5 ?? 'ไม่ทราบ'} µg/m³
- ระดับความสว่าง (Lux): ${sensorData.lux ?? 'ไม่ทราบ'} lux
- ระดับเสียง: ${sensorData.sound ?? 'ไม่ทราบ'}

ช่วยประเมินภาพรวมสภาพแวดล้อมสั้นๆ ใน 2-3 ประโยค (ตอบเป็นภาษาไทยที่เป็นกันเอง เข้าใจง่าย และให้คำแนะนำที่สามารถปฏิบัติตามได้จริงทันที เช่น การเปิดพัดลม เปิดหน้าต่าง หรือปิดไฟ):
    `.trim();

    // 5. ส่ง Request ไปยัง Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 6. ส่งผลลัพธ์กลับไปยัง Client
    return NextResponse.json({ result: responseText }, { status: 200 });

  } catch (error: any) {
    console.error('Gemini API Route Error:', error);

    // ส่งข้อความ Error ละเอียดกลับไปเพื่อช่วยในการ debugging บน DevTools / Console
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการประมวลผล Gemini AI', 
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}