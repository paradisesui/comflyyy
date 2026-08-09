import { NextResponse } from 'next/server';

// 1. กำหนด Interface เพื่อแก้ปัญหา TypeScript Error (Property 'garminSleepScore' does not exist)
export interface GarminSleepData {
  calendarDate: string;
  garminSleepScore: number;
  sleepStartTimestamp: number;
  sleepEndTimestamp: number;
  restlessMomentsCount?: number;
  avgSleepStress?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let targetDate = searchParams.get('date');

    // ถ้าไม่ได้ระบุวันที่ ให้ใช้วันที่ปัจจุบันเป็นค่าตั้งต้น
    if (!targetDate) {
      const now = new Date();
      targetDate = now.toISOString().split('T')[0];
    }

    // ดึงข้อมูลการนอนของวันที่ระบุ
    let sleepData: GarminSleepData | null = await fetchGarminDataFromSession(targetDate);

    // Fallback: หากยังไม่มีข้อมูลของวันนี้ (ยังไม่ Sync/ยังไม่ถึงเวลา) ให้ย้อนไปดึงข้อมูลวันเมื่อวาน
    if (!sleepData || !sleepData.garminSleepScore) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      sleepData = await fetchGarminDataFromSession(yesterday);
    }

    if (!sleepData) {
      return NextResponse.json(
        { status: 'error', message: 'No sleep data available from Garmin' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: sleepData
    });
  } catch (error) {
    console.error('Garmin API Route Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch Garmin data' },
      { status: 500 }
    );
  }
}

// 2. ฟังก์ชันดึงข้อมูลจาก Garmin Connect Session
// ในไฟล์ app/api/garmin/route.ts
async function fetchGarminDataFromSession(dateStr: string): Promise<GarminSleepData | null> {
  try {
    // 1. เรียกใช้งาน Logic หรือ Python Script ที่คุณใช้อยู่เดิมเพื่อดึง Garmin ของวันที่ dateStr
    // ตัวอย่างการยิง internal API หรือเรียกใช้ฟังก์ชันดึงข้อมูลของคุณ:
    const res = await fetch(`http://localhost:3000/api/your-garmin-script?date=${dateStr}`);
    const rawData = await res.json();

    if (!rawData || !rawData.sleepScore) return null;

    // 2. Return ข้อมูลจริงออกมา (ไม่ใช่ return null)
    return {
      calendarDate: dateStr,
      garminSleepScore: rawData.sleepScore,                  // เช่น 87
      sleepStartTimestamp: new Date(rawData.startTime).getTime(), // เช่น Timestamp ของ 02:45 AM
      sleepEndTimestamp: new Date(rawData.endTime).getTime(),     // เช่น Timestamp ของ 10:30 AM
      restlessMomentsCount: rawData.restlessCount || 0,        // เช่น 39
      avgSleepStress: rawData.avgSleepStress || 0
    };
  } catch (e) {
    console.error('Fetch Garmin Session Error:', e);
    return null;
  }
}