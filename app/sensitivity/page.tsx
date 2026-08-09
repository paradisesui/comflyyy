'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (!database) return;

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });

    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data).sort();
        if (dates.length > 0) setEventData(data[dates[dates.length - 1]]);
      }
    });
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;
  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 0, humidity: 0, light_lux: 0, pm25: 0, sound_db: 23, temperature: 34 };

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return 'เสียงรบกวน (Noise)';
      case 'temperature': case 'temp': return 'อุณหภูมิห้อง (Temperature)';
      case 'light_lux': case 'light': return 'แสงสว่าง (Light)';
      case 'humidity': case 'hum': return 'ความชื้น (Humidity)';
      case 'co2': return 'ก๊าซ CO2';
      case 'pm25': return 'ฝุ่น PM2.5';
      default: return key;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 32px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{ width: '100%', maxWidth: '920px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <Link href="/sensitivity-profile" style={{ fontSize: '12px', color: '#f8fafc', backgroundColor: '#3b82f6', padding: '6px 14px', borderRadius: '9999px', textDecoration: 'none', fontWeight: '600' }}>
            📜 ดูประวัติสะสม
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            วิเคราะห์พฤติกรรมการดิ้นตื่นกลางดึกร่วมกับสิ่งรบกวนรอบตัว
          </p>
        </div>

        {/* ปัจจัยหลักที่กระตุ้นการดิ้น */}
        <section style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800' }}>⚠️ ปัจจัยหลักที่กระตุ้นให้เกิดการดิ้น/ตื่น (GEMINI AI DIAGNOSIS)</span>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fef08a', margin: 0 }}>
            {aiInsight?.diagnosis || "กำลังวิเคราะห์ปัจจัยการดิ้นตื่น..."}
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
            💡 <strong>คำแนะนำ AI:</strong> {aiInsight?.recommendation || "ปรับปรุงสภาพแวดล้อมห้องนอน"}
          </p>
        </section>

        {/* Correlation Breakdown */}
        <section style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{formatSensorName(key)}</span>
                {count > 0 ? (
                  <strong style={{ fontSize: '18px', color: '#38bdf8' }}>{count} <span style={{ fontSize: '11px', color: '#64748b' }}>ครั้ง</span></strong>
                ) : (
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>🟢 สภาพแวดล้อมปกติ</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>41.56 <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span></div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>{daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span></div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})</span>
          </div>
        </div>
      </main>
    </div>
  );
}