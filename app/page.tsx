'use client';

import React, { useState } from 'react';

export default function Home() {
  // สมมติ Mockup ข้อมูล (อนาคตค่อยดึงค่าจริงจาก Firebase / Gemini มาใส่)
  const [score, setScore] = useState(97);
  const [level, setLevel] = useState('ดีเยี่ยม');
  const [recommendation, setRecommendation] = useState(
    'สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ'
  );

  // คำนวณ Stroke สำหรับวงกลม Gauges
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto relative font-sans">
      
      {/* 1. ส่วนบนสุด: โปรไฟล์ผู้ใช้ (มุมขวาบนตามสเก็ตช์) */}
      <header className="w-full flex justify-end items-center pt-2 pb-4">
        <button className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center hover:border-emerald-500 transition-all">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </header>

      {/* 2. ส่วนกลาง: Circle Gauges + ระดับ + คำแนะนำ */}
      <section className="flex flex-col items-center text-center my-auto space-y-6">
        
        {/* Circle Gauges Display (ตามรูปวาดวงกลม 97%) */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* วงกลมพื้นหลัง */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-800"
              fill="transparent"
            />
            {/* วงกลมแถบสีเขียวแสดงเปอร์เซ็นต์ */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              className="text-emerald-500 transition-all duration-1000 ease-out"
              fill="transparent"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          
          {/* ตัวเลขคะแนนตรงกลาง */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-6xl font-extrabold tracking-tight text-white">
              {score}%
            </span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
              Room Score
            </span>
          </div>
        </div>

        {/* ข้อความระดับคะแนน */}
        <div className="space-y-1">
          <span className="text-sm text-slate-400">ระดับคุณภาพห้องนอน</span>
          <h2 className="text-2xl font-bold text-emerald-400">{level}</h2>
        </div>

        {/* กล่องคำแนะนำ AI */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm leading-relaxed shadow-lg max-w-xs backdrop-blur-sm">
          <p className="font-semibold text-slate-200 mb-1 flex items-center justify-center gap-1">
            <span>💡</span> คำแนะนำเฉพาะบุคคล
          </p>
          <p className="text-slate-400">{recommendation}</p>
        </div>
      </section>

      {/* 3. ส่วนล่าง: ปุ่มกด 2 ปุ่มตามสเก็ตช์ */}
      <footer className="w-full space-y-3 pb-6">
        
        {/* ปุ่มที่ 1: ดูคะแนนเพิ่มเติม -> พาไปดูเซนเซอร์ & กราฟ */}
        <button
          onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์แต่ละตัวและกราฟ')}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>ดูคะแนนเพิ่มเติม</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* ปุ่มที่ 2: ประวัติการใช้งาน -> พาไปดูข้อมูล Persona 7-14 คืน */}
        <button
          onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>ประวัติการใช้งาน</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>

    </main>
  );
}