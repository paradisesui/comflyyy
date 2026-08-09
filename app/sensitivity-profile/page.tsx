'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityProfilePage() {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data)
          .filter((item: any) => item && item.date)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistoryLogs(list);
      } else {
        setHistoryLogs([]);
      }
      setLoading(false);
    });

    return () => unsubHistory();
  }, []);

  const totalDays = historyLogs.length;
  const avgGarmin = totalDays > 0 ? Math.round(historyLogs.reduce((sum, item) => sum + (Number(item.garminScore) || 0), 0) / totalDays) : 0;
  const avgRoom = totalDays > 0 ? Math.round(historyLogs.reduce((sum, item) => sum + (Number(item.roomScore) || 0), 0) / totalDays) : 0;
  const avgCombined = totalDays > 0 ? Math.round(historyLogs.reduce((sum, item) => sum + (Number(item.combinedScore) || 0), 0) / totalDays) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 16px 48px 16px', /* เพิ่มระยะขอบบนเป็น 48px ให้สบายตา */
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .profile-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .btn-pill-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #38bdf8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.35);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
          transition: all 0.2s ease;
        }

        .btn-pill-back:hover {
          background: rgba(56, 189, 248, 0.25);
          transform: translateX(-2px);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        th {
          color: #94a3b8;
          padding: 14px 12px;
          background-color: rgba(15, 23, 42, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 700;
        }

        td {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
      `}</style>

      <main className="profile-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-pill-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
            SENSITIVITY PROFILE HISTORY
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติคุณภาพการนอนและสภาพแวดล้อมสะสม
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังดึงประวัติย้อนหลัง...' : `บันทึกข้อมูลย้อนหลังรวม ${totalDays} วัน`}
          </p>
        </div>

        {/* Summary Card */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800' }}>
            📈 สรุปค่าเฉลี่ยสะสมจากประวัติจริง ({totalDays} วัน)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#38bdf8' }}>{avgGarmin}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Room เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#f43f5e' }}>{avgRoom}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Combined เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#34d399' }}>{avgCombined}</strong>
            </div>
          </div>
        </section>

        {/* Logs Table Card */}
        <section className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>Garmin</th>
                  <th>Room Env</th>
                  <th>Combined</th>
                  <th>อุณหภูมิ</th>
                  <th>การดิ้น</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.length > 0 ? (
                  historyLogs.map((log, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '700', color: '#38bdf8' }}>{log.date}</td>
                      <td>{log.garminScore}</td>
                      <td style={{ color: log.roomScore < 60 ? '#f43f5e' : '#34d399', fontWeight: '700' }}>{log.roomScore}</td>
                      <td style={{ fontWeight: '800' }}>{log.combinedScore}</td>
                      <td>{log.avgTemp}°C</td>
                      <td>{log.restlessCount} ครั้ง</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '32px' }}>
                      ยังไม่มีประวัติบันทึกสะสม
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}