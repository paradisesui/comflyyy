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
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 16px 48px 16px', /* เพิ่มระยะขอบบนเป็น 48px เพื่อแก้เรื่องติดขอบจอเกินไป */
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

        .btn-back-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #f8fafc;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .btn-back-pill:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
          min-width: 500px;
        }

        th {
          color: #94a3b8;
          padding: 14px 12px;
          background-color: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }

        td {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
      `}</style>

      <main className="profile-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back-pill">
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
            SENSITIVITY PROFILE HISTORY
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติคุณภาพการนอนและสภาพแวดล้อมสะสม
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังดึงประวัติย้อนหลัง...' : `บันทึกข้อมูลย้อนหลังรวม ${totalDays} วัน`}
          </p>
        </div>

        {/* สรุปค่าเฉลี่ย */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800' }}>
            📈 สรุปค่าเฉลี่ยสะสมจากประวัติจริง ({totalDays} วัน)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#38bdf8' }}>{avgGarmin}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Room เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#f43f5e' }}>{avgRoom}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Combined เฉลี่ย</span>
              <strong style={{ fontSize: '24px', color: '#34d399' }}>{avgCombined}</strong>
            </div>
          </div>
        </section>

        {/* ตารางประวัติ */}
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
                      <td style={{ color: log.roomScore < 60 ? '#f43f5e' : '#34d399', fontWeight: '600' }}>{log.roomScore}</td>
                      <td style={{ fontWeight: '700' }}>{log.combinedScore}</td>
                      <td>{log.avgTemp}°C</td>
                      <td>{log.restlessCount} ครั้ง</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
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