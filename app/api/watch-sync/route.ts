import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebase';
import { ref, push, set } from 'firebase/database';

export async function POST(req: Request) {
  try {
    const watchBody = await req.json();

    // ตัวอย่างการสกัดข้อมูลจาก Garmin/Terra Webhook
    const timestamp = watchBody.timestamp || Date.now();
    const heartRate = watchBody.heart_rate || 70;
    const sleepStage = watchBody.sleep_stage || 'Deep'; // Deep, Light, REM, Awake
    const isArousal = heartRate > 85 || sleepStage === 'Awake'; // ตรวจจับภาวะตื่นตัว

    // บันทึกลง Firebase node: 'watch_logs'
    const watchLogsRef = ref(database, 'watch_logs');
    const newLogRef = push(watchLogsRef);
    
    await set(newLogRef, {
      timestamp,
      heartRate,
      sleepStage,
      isArousal,
      device: watchBody.device_name || 'Garmin Watch'
    });

    return NextResponse.json({ success: true, message: 'บันทึกข้อมูล Smart Watch เรียบร้อย' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}