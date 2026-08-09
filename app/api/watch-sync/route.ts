import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // TODO: ใส่ Logic ดึงข้อมูล Garmin Connect จริงของคุณตรงนี้
    // คืนค่า Object โครงสร้าง Garmin ออกไป
    return NextResponse.json({
      sleepScore: 87,
      startTimestampGMT: `${date}T02:45:00Z`,
      endTimestampGMT: `${date}T10:30:00Z`,
      restlessMomentsCount: 39,
      avgSleepStress: 8
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync watch data' }, { status: 500 });
  }
}