import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isLatest = searchParams.get('latest') === 'true';

    // Mock หรือดึงจาก Garmin OAuth Token จริง
    // จำลองรายการข้อมูลการนอนหลายวัน (เรียงจากใหม่สุดไปเก่าสุด)
    const garminSleepLogs = [
      {
        calendarDate: '2026-08-12',
        garminSleepScore: 92,
        durationInSeconds: 30960, // 8h 36m
        deepSleepDurationInSeconds: 6120,
        remSleepDurationInSeconds: 8280,
        lightSleepDurationInSeconds: 16560,
        sleepStartTimestamp: 1786565340000,
        sleepEndTimestamp: 1786596300000,
        restlessMomentsCount: 18,
        avgSleepStress: 6
      },
      {
        calendarDate: '2026-08-11',
        garminSleepScore: 53,
        durationInSeconds: 15660, // 4h 21m
        deepSleepDurationInSeconds: 1800,
        remSleepDurationInSeconds: 2700,
        lightSleepDurationInSeconds: 11160,
        sleepStartTimestamp: 1786484340000,
        sleepEndTimestamp: 1786500000000,
        restlessMomentsCount: 52,
        avgSleepStress: 19
      },
      {
        calendarDate: '2026-08-09',
        garminSleepScore: 87,
        durationInSeconds: 27900, // 7h 45m
        deepSleepDurationInSeconds: 4920,
        remSleepDurationInSeconds: 7500,
        lightSleepDurationInSeconds: 15480,
        sleepStartTimestamp: 1786310700000,
        sleepEndTimestamp: 1786338600000,
        restlessMomentsCount: 39,
        avgSleepStress: 8
      }
    ];

    if (isLatest) {
      // ดึงตัวแรกสุดที่เป็นวันล่าสุดอัตโนมัติ
      return NextResponse.json({ success: true, data: garminSleepLogs[0] });
    }

    return NextResponse.json({ success: true, data: garminSleepLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}