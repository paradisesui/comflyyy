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
      backgroundColor: '#05070f',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glass-card {
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 12px;
          min-width: 500px;
        }

        th {
          color: #94a3b8;
          padding: 10px;
          border-bottom: 1px solid #1e293b;
        }

        td {
          padding: 12px 10px;
          border-bottom: 1px solid #1e293b;
          color: #cbd5e1;
        }
      `}</style>

      <main className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            CUMULATIVE SENSITIVITY HISTORY
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติสถิติสะสมรายคืน
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังโหลดข้อมูล...' : `สะสมข้อมูลแล้วทั้งหมด ${totalDays} คืน`}
          </p>
        </div>

        {/* Summary Averages */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800' }}>
            📊 ค่าเฉลี่ยสะสมรวม {totalDays} คืน
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '18px', color: '#f8fafc' }}>{cumulative?.avgGarminScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Room เฉลี่ย</span>
              <strong style={{ fontSize: '18px', color: '#34d399' }}>{cumulative?.avgRoomScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Combined เฉลี่ย</span>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
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