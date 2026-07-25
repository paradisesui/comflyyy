'use client';

import React, { useState, useEffect } from 'react';
// 1. เรียกใช้งาน database จากไฟล์ firebase.ts ที่เราสร้างไว้ใน app/lib
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

// 2. กำหนดโครงสร้างข้อมูลที่ดึงมาจาก Firebase
interface SensorData {
  co2: number;
  humidity: number;
  lux: number;
  pm10: number;
  pm1_0: number;
  pm2_5: number;
  sound: number;
  temperature: number;
  timestamp: number;
}

export default function Home() {
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 3. ดึงข้อมูล Real-time เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const logsRef = ref(database, 'logs');
    const latestLogQuery = query(logsRef, limitToLast(1));

    const unsubscribe = onValue(latestLogQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const latestKey = Object.keys(data)[0];
        const latestData: SensorData = data[latestKey];
        setSensor(latestData);
      } else {
        console.log("ไม่พบข้อมูลใน Firebase");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 4. คำนวณคะแนนเบื้องต้นจากค่าที่อ่านได้จริง
  const calculateScore = (data: SensorData | null) => {
    if (!data) return 97; // ค่า Default ระหว่างรอข้อมูล
    let score = 100;
    if (data.temperature > 25) score -= (data.temperature - 25) * 2;
    if (data.co2 > 800) score -= 10;
    if (data.pm2_5 > 15) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const score = calculateScore(sensor);
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto relative font-sans">
      
      {/* Header ส่วนบน */}
      <header className="w-full flex justify-between items-center pt-2 pb-4">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></span>
          <span className="text-xs text-slate-400">
            {loading ? 'กำลังเชื่อมต่อ...' : 'Live Realtime'}
          </span>
        </div>
        <button className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center">
          👤
        </button>
      </header>

      {/* Circle Gauges & แสดงค่าเซนเซอร์ */}
      <section className="flex flex-col items-center text-center my-auto space-y-6">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" className="text-slate-800" fill="transparent" />
            <circle
              cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12"
              className="text-emerald-500 transition-all duration-1000 ease-out"
              fill="transparent"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-6xl font-extrabold text-white">
              {score}%
            </span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
              Room Score
            </span>
          </div>
        </div>

        {/* การ์ดแสดงค่าสดจาก Firebase */}
        {sensor && (
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block">อุณหภูมิ</span>
              <span className="font-bold text-slate-200">{sensor.temperature?.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-slate-500 block">ความชื้น</span>
              <span className="font-bold text-slate-200">{sensor.humidity?.toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">CO2</span>
              <span className="font-bold text-slate-200">{sensor.co2} ppm</span>
            </div>
          </div>
        )}

        {/* กล่องคำแนะนำ */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm max-w-xs backdrop-blur-sm">
          <p className="font-semibold text-slate-200 mb-1">💡 คำแนะนำเฉพาะบุคคล</p>
          <p className="text-slate-400 text-xs">
            {sensor && sensor.temperature > 27 
              ? 'อุณหภูมิห้องค่อนข้างสูง อาจทำให้คุณตื่นกลางดึกหรือหลับตื้นขึ้น แนะนำให้ปรับแอร์ให้อยู่ในช่วง 24-25°C' 
              : 'สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ'}
          </p>
        </div>
      </section>

      {/* ปุ่มล่างสุด */}
      <footer className="w-full space-y-3 pb-6">
        <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all">
          ดูคะแนนเพิ่มเติม
        </button>
        <button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all">
          ประวัติการใช้งาน
        </button>
      </footer>

    </main>
  );
}