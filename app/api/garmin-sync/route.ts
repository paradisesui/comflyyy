import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  return new Promise((resolve) => {
    const projectRoot = process.cwd();
    
    // คำสั่งรัน Garmin sync ตามด้วย Dynamic sensor processor ใน .venv
    const pythonPath = process.platform === 'win32'
      ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
      : path.join(projectRoot, '.venv', 'bin', 'python');

    const garminScript = path.join(projectRoot, 'garmin_to_firebase.py');
    const processorScript = path.join(projectRoot, 'process_all_sensors_dynamic.py');

    const command = `"${pythonPath}" "${garminScript}" && "${pythonPath}" "${processorScript}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Sync Error:', stderr || error.message);
        resolve(
          NextResponse.json(
            { success: false, message: 'Sync ล้มเหลว กรุณาตรวจสอบ Garmin Connect Session' },
            { status: 500 }
          )
        );
        return;
      }

      console.log('Sync Output:', stdout);
      resolve(
        NextResponse.json({
          success: true,
          message: 'ดึงข้อมูล Garmin และประมวลผลค่าเซนเซอร์ล่าสุดสำเร็จ'
        })
      );
    });
  });
}