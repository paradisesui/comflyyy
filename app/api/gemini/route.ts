import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sensorData } = body;

    if (!sensorData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเซนเซอร์ที่ส่งมา' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ Environment Variables' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // ใช้รุ่น gemini-1.5-flash ซึ่งเป็นรุ่นเสถียรสำหรับข้อมูล Realtime
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
คุณคือผู้เชี่ยวชาญด้านสุขภาพและสภาพแวดล้อมภายในห้องนอน
กรุณาวิเคราะห์ค่าจากเซนเซอร์สภาพแวดล้อมในห้องนอนดังต่อไปนี้:

- อุณหภูมิ: ${sensorData.temperature ?? 'ไม่ทราบ'} °C
- ความชื้น: ${sensorData.humidity ?? 'ไม่ทราบ'} %
- ปริมาณ CO2: ${sensorData.co2 ?? 'ไม่ทราบ'} ppm
- ปริมาณ PM2.5: ${sensorData.pm2_5 ?? 'ไม่ทราบ'} µg/m³
- ระดับความสว่าง: ${sensorData.lux ?? 'ไม่ทราบ'} lux
- ระดับเสียง: ${sensorData.sound ?? 'ไม่ทราบ'}

ช่วยประเมินภาพรวมสภาพแวดล้อมสั้นๆ ใน 2-3 ประโยค (ตอบเป็นภาษาไทยที่เป็นกันเอง เข้าใจง่าย และให้คำแนะนำที่สามารถปฏิบัติตามได้จริงทันที เช่น เปิดหน้าต่าง เปิดพัดลม หรือปรับแสงไฟ):
    `.trim();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText }, { status: 200 });

  } catch (error: any) {
    console.error('Gemini API Route Error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผล Gemini AI',
        details: String(error)
      },
      { status: 500 }
    );
  }
}