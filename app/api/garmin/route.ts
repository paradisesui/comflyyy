import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ดึงข้อมูลการนอนล่าสุดจาก Garmin Connect API
    // (สามารถเชื่อมต่อผ่าน Garmin Connect Wrapper/OAuth2)
    const garminData = {
      calendarDate: new Date().toISOString().split('T')[0],
      garminSleepScore: 78,
      sleepStartTimestamp: Date.now() - 28800000, // ย้อนหลัง 8 ชม.
      sleepEndTimestamp: Date.now(),
      restlessMoments: [
        { timestamp: Date.now() - 14400000 },
        { timestamp: Date.now() - 7200000 }
      ]
    };

    return NextResponse.json({ success: true, data: garminData });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch Garmin data' }, { status: 500 });
  }
}