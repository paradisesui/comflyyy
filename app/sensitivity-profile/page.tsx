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

    // 1. ดึงประวัติสะสมรายวันจาก Firebase (/personal_sensitivity/history)
    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        // แปลง Object ให้เป็น Array และเรียงลำดับวันที่จากล่าสุดขึ้นก่อน
        const list = Object.keys(rawData).map(key => ({
          id: key,
          ...rawData[key]
        })).sort((a, b) => b.date.localeCompare(a.date));
        setHistoryList(list);
      } else {
        setHistoryList([]);
      }
    });

    // 2. ดึงค่าเฉลี่ยสะสมรวมจาก Summary
    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setSummaryData(snapshot.val());
      }
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
        .profile-container {
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

        .summary-card {
          background-color: #0f172a;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #38bdf840;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .table-box {
          background-color: #0f172a;
          border-radius: 16px;
          border: 1px solid #1e293b;
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        th {
          background-color: #151c2c;
          color: #94a3b8;
          padding: 12px 16px;
          font-weight: 600;
          border-bottom: 1px solid #1e293b;
        }

        td {
          padding: 14px 16px;
          border-bottom: 1px solid #1e293b;
          color: #cbd5e1;
        }

        tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      <main className="profile-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            CUMULATIVE SENSITIVITY PROFILE
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติสะสมสถิติการนอน (Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังโหลดประวัติ...' : `สะสมข้อมูลทั้งหมด ${totalDays} คืนที่มี Timestamp ตรงกัน`}
          </p>
        </div>

        {/* การ์ดสรุปค่าเฉลี่ยสะสม N วัน */}
        <section className="summary-card">
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
            📊 ค่าเฉลี่ยสถิติสะสมรวม {totalDays} วันย้อนหลัง
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Garmin Score เฉลี่ย</span>
              <strong style={{ fontSize: '20px', color: '#f8fafc' }}>{cumulative?.avgGarminScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Room Score เฉลี่ย</span>
              <strong style={{ fontSize: '20px', color: '#34d399' }}>{cumulative?.avgRoomScore || '--'}</strong>
            </div>

            <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Combined Score เฉลี่ย</span>
              <strong style={{ fontSize: '20px', color: '#38bdf8' }}>{cumulative?.avgCombinedScore || '--'}</strong>
            </div>
          </div>
        </section>

        {/* ตารางแสดงประวัติสะสมรายวัน */}
        <section className="table-box">
          <div style={{ padding: '14px 16px', backgroundColor: '#151c2c', borderBottom: '1px solid #1e293b', fontWeight: '700', fontSize: '13px' }}>
            🗓️ บันทึกประวัติสถิติรายคืน (Daily History Logs)
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>วันที่ (Date)</th>
                  <th>Garmin Score</th>
                  <th>Room Score</th>
                  <th>Combined Score</th>
                  <th>อุณหภูมิห้องเฉลี่ย</th>
                  <th>การดิ้น (ครั้ง)</th>
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
                      ยังไม่มีข้อมูลบันทึกประวัติสะสมแบบ Exact Match
                    </td>
                  </tr>
                )}
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