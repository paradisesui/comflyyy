'use client';

import React from 'react';
import Link from 'next/link';

export default function SensorsPage() {
  // Mockup ข้อมูลเซนเซอร์สดทั้ง 6 ตัวตามฮาร์ดแวร์
  const sensors = [
    { name: 'อุณหภูมิ (SHT31)', value: '27.9°C', status: 'เตือนเล็กน้อย', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '🌡️' },
    { name: 'ความชื้น (SHT31)', value: '57.5%', status: 'ปกติ', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '💧' },
    { name: 'แสงสว่าง (BH1750)', value: '68.7 Lux', status: 'สว่างเกินไป', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: '💡' },
    { name: 'คาร์บอนไดออกไซด์ (MH-Z19B)', value: '992 ppm', status: 'ปานกลาง', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '🍃' },
    { name: 'เสียงรบกวน (KY-038)', value: '1650 dB', status: 'เงียบสงบ', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '🔊' },
    { name: 'ฝุ่น PM2.5 (PMS5003)', value: '1 µg/m³', status: 'ดีมาก', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '🌫️' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 max-w-md mx-auto font-sans flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            ← ย้อนกลับ
          </Link>
          <h1 className="text-lg font-bold text-slate-200">รายละเอียดเซนเซอร์</h1>
          <div className="w-10"></div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {sensors.map((s, index) => (
            <div key={index} className={`p-4 rounded-2xl border ${s.bg} flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                  {s.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block truncate">{s.name}</span>
                <span className="text-xl font-extrabold text-white mt-1 block">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Realtime Graph Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">📊 กราฟพฤติกรรมสิ่งแวดล้อมคืนนี้</h3>
          <div className="h-32 w-full bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800/50">
            <span className="text-xs text-slate-500">[ Live Sensor Chart Timeline ]</span>
          </div>
        </div>
      </div>

      <footer className="pt-6">
        <Link href="/" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl text-center block transition-all">
          กลับหน้าหลัก
        </Link>
      </footer>
    </main>
  );
}