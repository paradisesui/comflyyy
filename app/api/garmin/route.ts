import { NextResponse } from 'next/server';
import { GarminConnect } from 'garmin-connect';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isLatest = searchParams.get('latest') === 'true';

    const email = process.env.GARMIN_EMAIL;
    const password = process.env.GARMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'กรุณาระบุ GARMIN_EMAIL และ GARMIN_PASSWORD ในไฟล์ .env.local' 
      }, { status: 400 });
    }

    // 1. เข้าสู่ระบบ Garmin Connect
    const GCClient = new GarminConnect({
      username: email,
      password: password
    });

    await GCClient.login();

    // 2. ดึงข้อมูลการนอนย้อนหลัง 7 วันจริงจากวันนี้
    const sleepLogs: any[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

      try {
        const sleepData = await GCClient.getSleepData(targetDate);
        const dto = sleepData?.dailySleepDTO;

        // บันทึกเฉพาะวันที่มีการใส่นาฬิกานอนจริงและมีคะแนน
        if (dto && dto.sleepScores?.overall?.value) {
          sleepLogs.push({
            calendarDate: dateStr,
            garminSleepScore: dto.sleepScores.overall.value,
            durationInSeconds: dto.sleepTimeSeconds || 0,
            deepSleepDurationInSeconds: dto.deepSleepSeconds || 0,
            remSleepDurationInSeconds: dto.remSleepSeconds || 0,
            lightSleepDurationInSeconds: dto.lightSleepSeconds || 0,
            sleepStartTimestamp: dto.sleepStartTimestampGMT || 0,
            sleepEndTimestamp: dto.sleepEndTimestampGMT || 0,
            restlessMomentsCount: dto.restlessMomentsCount || (sleepData?.restlessMoments?.length || 0),
            avgSleepStress: dto.avgSleepStress || 0
          });
        }
      } catch (err) {
        // ข้ามวันที่ไม่มีข้อมูลการนอน
      }
    }

    if (sleepLogs.length === 0) {
      return NextResponse.json({ success: false, message: 'ไม่พบข้อมูลการนอนหลับในบัญชี Garmin' }, { status: 404 });
    }

    // เรียงจากวันที่ใหม่สุดไปเก่าสุด
    sleepLogs.sort((a, b) => new Date(b.calendarDate).getTime() - new Date(a.calendarDate).getTime());

    if (isLatest) {
      return NextResponse.json({ success: true, data: sleepLogs[0] });
    }

    return NextResponse.json({ success: true, data: sleepLogs });
  } catch (error: any) {
    console.error('Garmin Auth/Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Garmin Connect' 
    }, { status: 500 });
  }
}