import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isLatest = searchParams.get('latest') === 'true';

    let sleepLogs: any[] = [];

    if (database) {
      const garminRef = ref(database, 'garmin_sleep');
      const snapshot = await get(garminRef);

      if (snapshot.exists()) {
        const val = snapshot.val();
        // ดึงข้อมูลจริงทุกวันที่มีใน Firebase garmin_sleep
        sleepLogs = Object.keys(val).map((dateKey) => ({
          calendarDate: dateKey,
          ...val[dateKey]
        }));
      }
    }

    if (sleepLogs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลการนอนหลับใน Node garmin_sleep ของ Firebase'
      }, { status: 404 });
    }

    // เรียงจากวันที่ใหม่สุดไปเก่าสุด
    sleepLogs.sort((a, b) => new Date(b.calendarDate).getTime() - new Date(a.calendarDate).getTime());

    if (isLatest) {
      return NextResponse.json({ success: true, data: sleepLogs[0] });
    }

    return NextResponse.json({ success: true, data: sleepLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}