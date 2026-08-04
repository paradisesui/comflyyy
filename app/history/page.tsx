'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SleepLogItem {
  co2: number;
  humidity: number;
  lux: number;
  pm2_5: number;
  sound: number;
  temperature: number;
  timestamp: number;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<{ id: string; data: SleepLogItem }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogsQuery = query(logsRef, limitToLast(20));

      const unsubscribe = onValue(latestLogsQuery, (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const parsed = Object.keys(rawData).map((key) => ({
            id: key,
            data: rawData[key],
          })).reverse();
          setLogs(parsed);
        }
        setLoading(false);
      }, () => setLoading(false));

      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 12px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Firebase Logs History</span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติสภาพแวดล้อมย้อนหลัง
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            บันทึกสถิติอุณหภูมิ แสง เสียง และค่า CO2 ล่าสุดในห้องนอน
          </p>
        </div>

        {/* Logs Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ backgroundColor: '#151c2c', padding: '24px', borderRadius: '18px', textAlign: 'center', color: '#64748b', border: '1px solid #1e293b' }}>
              กำลังโหลดประวัติข้อมูล...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ backgroundColor: '#151c2c', padding: '24px', borderRadius: '18px', textAlign: 'center', color: '#64748b', border: '1px solid #1e293b' }}>
              ไม่พบประวัติข้อมูลย้อนหลัง
            </div>
          ) : (
            logs.map((item) => {
              const dateStr = item.data.timestamp
                ? new Date(item.data.timestamp).toLocaleString('th-TH')
                : 'ไม่ระบุเวลา';

              return (
                <div key={item.id} style={{
                  backgroundColor: '#151c2c',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#818cf8', fontWeight: '700' }}>
                    <span>⏱️ {dateStr}</span>
                    <span style={{ color: '#34d399' }}>Logged</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>อุณหภูมิ</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{item.data.temperature?.toFixed(1) ?? '--'} °C</strong>
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>ความชื้น</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{item.data.humidity?.toFixed(0) ?? '--'} %</strong>
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>CO2</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{item.data.co2 ?? '--'} ppm</strong>
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>แสงสว่าง</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{item.data.lux?.toFixed(1) ?? '--'} Lux</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Link href="/" style={{
          backgroundColor: '#151c2c',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '16px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #1e293b'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}