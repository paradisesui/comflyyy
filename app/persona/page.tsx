'use client';

import React from 'react';
import Link from 'next/link';

export default function PersonaPage() {
  const weights = [
    { name: 'เสียงรบกวน (Sound)', weight: 35, color: 'bg-rose-500' },
    { name: 'อุณหภูมิ (Temp)', weight: 25, color: 'bg-amber-500' },
    { name: 'คาร์บอนไดออกไซด์ (CO2)', weight: 20, color: 'bg-emerald-500' },
    { name: 'ฝุ่น PM2.5', weight: 10, color: 'bg-sky-500' },
    { name: 'ความชื้น (Humidity)', weight: 5, color: 'bg-indigo-500' },
    { name: 'แสง (Lux)', weight: 5, color: 'bg-purple-500' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 max-w-md mx-auto font-sans flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            ← ย้อนกลับ
          </Link>
          <h1 className="text-lg font-bold text-slate-200">ประวัติ & AI Persona</h1>
          <div className="w-10"></div>
        </div>

        {/* Persona Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 mb-6 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-sm font-bold text-emerald-400">Personalized Sleep Persona</h2>
              <p className="text-xs text-slate-400">สะสมข้อมูลแล้ว 12 คืน</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            ระบบ Gemini AI วิเคราะห์ว่าคุณเป็นคนที่ <strong className="text-emerald-400">"มีความไวต่อเสียงรบกวนสูงมาก"</strong> ในช่วงหลับลึก (Deep Sleep) เสียงที่เกิน 45 dB จะทำให้คุณพลิกตัวทันที
          </p>
        </div>

        {/* Personalized Weight Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">⚖️ ค่าน้ำหนักตัวแปรเฉพาะบุคคล (6 ตัวแปร)</h3>
          <div className="space-y-3">
            {weights.map((w, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{w.name}</span>
                  <span className="font-bold text-slate-200">{w.weight}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full ${w.color}`} style={{ width: `${w.weight}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">📜 ประวัติคะแนนห้องนอนย้อนหลัง</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-400">เมื่อคืนนี้ (25 ก.ค.)</span>
              <span className="font-bold text-emerald-400">97% (ดีเยี่ยม)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-400">24 ก.ค.</span>
              <span className="font-bold text-yellow-400">78% (เสียงรบกวน)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-400">23 ก.ค.</span>
              <span className="font-bold text-emerald-400">92% (ดีมาก)</span>
            </div>
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