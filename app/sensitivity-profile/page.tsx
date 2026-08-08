'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityHistoryPage() {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    let unsubHistory: (() => void) | undefined;

    try {
      // ดึงประวัติการนอนและสภาพแวดล้อมที่บันทึกสะสมมาในแต่ละวัน
      const historyRef = ref(database, 'personal_sensitivity/history');
      unsubHistory = onValue(historyRef, (snapshot) => {
        if (snapshot && snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.values(data).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistoryLogs(list);
        } else {
          // ค่า Mock สำรอง
          setHistoryLogs([
            { date: '2026-08-08', garminScore: 78, roomScore: 49, combinedScore: 64, avgTemp: 28.3, restlessCount: 58 }
          ]);
        }
        setLoading(false);
      });
    } catch (err) {
      console.error('Firebase read error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubHistory) unsubHistory();
    };
  }, []);

  // คำนวณค่าเฉลี่ยสะสมจริงจากประวัติทุกวันที่มีการบันทึก
  const totalDays = historyLogs.length || 1;
  const avgGarmin = Math.round(historyLogs.reduce((sum, item) => sum + (item.garminScore || 0), 0) / totalDays);
  const avgRoom = Math.round(historyLogs.reduce((sum, item) => sum + (item.roomScore || 0), 0) / totalDays);
  const avgCombined = Math.round(historyLogs.reduce((sum, item) => sum + (item.combinedScore || 0), 0) / totalDays);
  const avgTempAcc = (historyLogs.reduce((sum, item) => sum + (item.avgTemp || 0), 0) / totalDays).toFixed(1);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .history-container {
          width: 100%;
          max-width: 900px;
          background-color: #151c2c;
          border-radius: 24px;
          border: 1px solid #1e293b;
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 14px;
          border: 1px solid #1e293b;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        th {
          background-color: #0f172a;
          color: #94a3b8;
          padding: 14px 16px;
          border-bottom: 1px solid #1e293b;
          font-weight: 600;
        }

        td {
          padding: 14px 16px;
          border-bottom: 1px solid #1e293b;
          color: #f8fafc;
        }

        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      <main className="history-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/sensitivity" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← กลับหน้าหลัก Sensitivity
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            DAILY SENSITIVITY HISTORY LOGS
          </span>
        </div>

        {/* Header Title */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติคุณภาพการนอนและสภาพแวดล้อมสะสม
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังดึงประวัติย้อนหลัง...' : `บันทึกข้อมูลย้อนหลังรวม ${totalDays} วัน`}
          </p>
        </div>

        {/* 1. สรุปค่าเฉลี่ยสะสมจากประวัติรายวันจริง */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '700' }}>
            📈 สรุปค่าเฉลี่ยสะสมจากประวัติการใช้งานจริง ({totalDays} วัน)
          </span>

          <div className="metrics-grid">
            <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>เฉลี่ย Garmin Score</span>
              <strong style={{ fontSize: '24px', color: '#38bdf8', display: 'block', margin: '4px 0' }}>
                {avgGarmin} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
              </strong>
            </div>

            <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>เฉลี่ย Room Env Score</span>
              <strong style={{ fontSize: '24px', color: '#f43f5e', display: 'block', margin: '4px 0' }}>
                {avgRoom} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
              </strong>
            </div>

            <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>เฉลี่ย Combined Score</span>
              <strong style={{ fontSize: '24px', color: '#34d399', display: 'block', margin: '4px 0' }}>
                {avgCombined} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
              </strong>
            </div>
          </div>
        </section>

        {/* 2. ตารางแสดงประวัติค่าของแต่ละวัน */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            🗓️ รายละเอียดคะแนนและสภาพแวดล้อมรายวัน (Daily Logs)
          </span>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>Garmin Score</th>
                  <th>Room Env</th>
                  <th>Combined</th>
                  <th>อุณหภูมิเฉลี่ย</th>
                  <th>การดิ้น/ตื่น</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.map((log, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600', color: '#38bdf8' }}>{log.date}</td>
                    <td>{log.garminScore}</td>
                    <td style={{ color: log.roomScore < 60 ? '#f43f5e' : '#34d399', fontWeight: '600' }}>{log.roomScore}</td>
                    <td style={{ fontWeight: '700' }}>{log.combinedScore}</td>
                    <td>{log.avgTemp}°C</td>
                    <td>{log.restlessCount} ครั้ง</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Back Button */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}