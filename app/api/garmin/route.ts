import { NextResponse } from 'next/server';

export interface GarminSleepData {
  calendarDate: string;
  garminSleepScore: number;
  sleepStartTimestamp: number;
  sleepEndTimestamp: number;
  restlessMomentsCount: number;
  avgSleepStress: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let targetDate = searchParams.get('date');

    if (!targetDate) {
      targetDate = new Date().toISOString().split('T')[0];
    }

    // ดึงข้อมูลจริงจาก Garmin Session / Client
    const sleepData: GarminSleepData | null = await fetchGarminDataFromSession(targetDate);

    if (!sleepData) {
      return NextResponse.json(
        { status: 'error', message: 'No sleep data found from Garmin for this date' },
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

async function fetchGarminDataFromSession(dateStr: string): Promise<GarminSleepData | null> {
  try {
    // 1. ยิงเรียก API / Script Garmin ของคุณ
    const res = await fetch(`http://localhost:3000/api/watch-sync?date=${dateStr}`);
    if (!res.ok) return null;

    const raw = await res.json();

    // 2. ส่งค่ากลับโดยใช้ชื่อตัวแปร raw ให้ตรงกันทั้งหมด
    return {
      calendarDate: dateStr,
      garminSleepScore: raw.sleepScore || raw.garminSleepScore || 0,
      sleepStartTimestamp: new Date(raw.startTimestampGMT || raw.sleepStartTimestamp || Date.now()).getTime(),
      sleepEndTimestamp: new Date(raw.endTimestampGMT || raw.sleepEndTimestamp || Date.now()).getTime(),
      restlessMomentsCount: raw.restlessMomentsCount || 0,
      avgSleepStress: raw.avgSleepStress || 0
    };
  } catch (e) {
    console.error('Fetch Garmin Session Error:', e);
    return null;
  }
}