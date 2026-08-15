import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isLatest = searchParams.get('latest') === 'true';

    let sleepLogs: any[] = [];

    // ดึงข้อมูลจริงจาก Node garmin_sleep บน Firebase
    if (database) {
      const garminRef = ref(database, 'garmin_sleep');
      const snapshot = await get(garminRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        // ดึงครบทุกวันที่มีอยู่จริงในระบบโดยไม่จำกัดจำนวน
        sleepLogs = Object.keys(val).map((dateKey) => ({
          calendarDate: dateKey,
          ...val[dateKey]
        }));
      }
    }

    // เรียงลำดับจากวันที่ใหม่สุดไปเก่าสุด
    sleepLogs.sort((a, b) => new Date(b.calendarDate).getTime() - new Date(a.calendarDate).getTime());

    // ถ้าขอแค่วันล่าสุด
    if (isLatest) {
      return NextResponse.json({ success: true, data: sleepLogs[0] || null });
    }

    // ส่งคืนข้อมูล "ครบทุกวันที่มีในระบบ"
    return NextResponse.json({ success: true, data: sleepLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}