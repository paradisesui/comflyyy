'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityProfilePage() {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const list = Object.keys(rawData).map(key => ({
          id: key,
          ...rawData[key]
        })).sort((a, b) => b.date.localeCompare(a.date));
        setHistoryList(list);
      } else {
        setHistoryList([]);
      }
    });

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
      setLoading(false);
    });

    return () => {
      unsubHistory();
      unsubSummary();
    };
  }, []);

  const cumulative = summaryData?.cumulativeSummary;
  const totalDays = historyList.length || summaryData?.totalAccumulatedDays || 1;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 32px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 920px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #38bdf8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: rgba(56, 189, 248, 0.2);
          transform: translateX(-2px);
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
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
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
          font-size: 12px;
          min-width: 520px;
        }

        th {
          color: #94a3b8;
          padding: 12px 10px;
          background-color: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }

        td {
          padding: 14px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
      `}</style>

      <main className="app-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
            📜 SENSITIVITY HISTORY
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติสถิติสะสมรายคืน
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังโหลดข้อมูล...' : `สะสมข้อมูลแล้วทั้งหมด ${totalDays} คืน`}
          </p>
        </div>

        {/* Summary Averages */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(14, 116, 144, 0.15) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px' }}>
            📊 ค่าเฉลี่ยสะสมรวม {totalDays} คืน
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '18px', color: '#f8fafc' }}>{cumulative?.avgGarminScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Room เฉลี่ย</span>
              <strong style={{ fontSize: '18px', color: '#34d399' }}>{cumulative?.avgRoomScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Combined เฉลี่ย</span>
              <strong style={{ fontSize: '18px', color: '#38bdf8' }}>{cumulative?.avgCombinedScore || '--'}</strong>
            </div>
          </div>
        </section>

        {/* History Table */}
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
                {historyList.length > 0 ? (
                  historyList.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '700', color: '#f8fafc' }}>{item.date}</td>
                      <td>{item.garminScore || '--'}</td>
                      <td style={{ color: '#34d399', fontWeight: '600' }}>{item.roomScore || '--'}</td>
                      <td style={{ color: '#38bdf8', fontWeight: '700' }}>{item.combinedScore || '--'}</td>
                      <td>{item.avgTemp ? `${item.avgTemp}°C` : '--'}</td>
                      <td>{item.restlessCount ?? '--'} ครั้ง</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
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