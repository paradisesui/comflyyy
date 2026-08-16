'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityProfilePage() {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [eventsMap, setEventsMap] = useState<{ [key: string]: any }>({});
  const [averages, setAverages] = useState({ garmin: 0, room: 0, combined: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    // 1. ดึง Events Breakdown ของทุกวัน
    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    onValue(eventsRef, (eventSnap) => {
      if (eventSnap.exists()) {
        setEventsMap(eventSnap.val());
      }
    });

    // 2. ดึง History Data
    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const data = snapshot.val();

        const rawList = Object.keys(data).map((key) => ({
          date: data[key]?.date || key,
          ...data[key]
        }));

        const uniqueMap = new Map<string, any>();
        rawList.forEach((item) => {
          if (!item.date) return;
          if (!uniqueMap.has(item.date) || (item.roomScore && !uniqueMap.get(item.date)?.roomScore)) {
            uniqueMap.set(item.date, item);
          }
        });

        const list = Array.from(uniqueMap.values())
          .filter((item) => item.garminScore != null || item.roomScore != null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setHistoryLogs(list);

        if (list.length > 0) {
          const garminItems = list.filter((i) => i.garminScore != null);
          const roomItems = list.filter((i) => i.roomScore != null);

          const avgG = garminItems.length > 0
            ? Math.round(garminItems.reduce((sum, item) => sum + Number(item.garminScore), 0) / garminItems.length)
            : 0;

          const avgR = roomItems.length > 0
            ? Math.round(roomItems.reduce((sum, item) => sum + Number(item.roomScore), 0) / roomItems.length)
            : avgG;

          const avgC = Math.round(
            list.reduce((sum, item) => {
              const g = item.garminScore || avgG;
              const r = item.roomScore || avgR;
              return sum + (item.combinedScore || Math.round(g * 0.5 + r * 0.5));
            }, 0) / list.length
          );

          setAverages({ garmin: avgG, room: avgR, combined: avgC });
        }
      } else {
        setHistoryLogs([]);
      }
      setLoading(false);
    });

    return () => unsubHistory();
  }, []);

  // ฟังก์ชันวิเคราะห์จุดอ่อนความไวของผู้ใช้ในวันนั้นๆ
  const getUserSensitivity = (date: string, fallbackTrigger?: string) => {
    const dayEvent = eventsMap[date];
    const breakdown = dayEvent?.sensorTriggerBreakdown;

    if (breakdown && Object.keys(breakdown).length > 0) {
      const sorted = Object.entries(breakdown).sort(([, a]: any, [, b]: any) => Number(b) - Number(a));
      const top = sorted[0];

      if (top && Number(top[1]) > 0) {
        switch (top[0]) {
          case 'sound_db': case 'sound': case 'noise': return '🔊 ไวต่อเสียงรบกวน';
          case 'co2': return '🫁 ไวต่อก๊าซ CO2';
          case 'humidity': case 'hum': return '💧 ไวต่อความชื้น';
          case 'temperature': case 'temp': return '🌡️ ไวต่ออุณหภูมิห้อง';
          case 'pm25': return '🌫️ ไวต่อฝุ่น PM2.5';
          case 'light_lux': case 'light': return '💡 ไวต่อแสงสว่าง';
          default: return `⚠️ ไวต่อ${top[0]}`;
        }
      }
    }

    if (fallbackTrigger) {
      switch (fallbackTrigger.toLowerCase()) {
        case 'sound_db': case 'sound': case 'noise': return '🔊 ไวต่อเสียงรบกวน';
        case 'co2': return '🫁 ไวต่อก๊าซ CO2';
        case 'humidity': case 'hum': return '💧 ไวต่อความชื้น';
        case 'temperature': case 'temp': return '🌡️ ไวต่ออุณหภูมิห้อง';
        default: return `⚠️ ไวต่อ${fallbackTrigger}`;
      }
    }

    return '🟢 ปกติ (ไม่พบสิ่งเร้า)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .profile-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .btn-back-glow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          padding: 8px 20px 8px 12px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.5) 0%, rgba(37, 99, 235, 0.7) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          width: fit-content;
          white-space: nowrap;
        }

        .btn-back-glow:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: #38bdf8;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.55), 0 8px 20px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.7) 0%, rgba(37, 99, 235, 0.9) 100%);
        }

        .arrow-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
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
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
        }

        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
          min-width: 600px;
        }

        th {
          color: #94a3b8;
          padding: 16px 14px;
          background-color: rgba(15, 23, 42, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 700;
        }

        td {
          padding: 16px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
      `}</style>

      <main className="profile-container">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back-glow">
            <div className="arrow-badge">←</div>
            <span>กลับหน้าหลัก</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.8px' }}>
            SENSITIVITY PROFILE HISTORY
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติคุณภาพการนอนและสภาพแวดล้อมสะสม
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังดึงประวัติย้อนหลัง...' : `บันทึกข้อมูลย้อนหลังรวม ${historyLogs.length} วัน`}
          </p>
        </div>

        {/* สรุปค่าเฉลี่ยสะสม */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px' }}>
            📈 สรุปค่าเฉลี่ยสะสมจากประวัติจริง ({historyLogs.length} วัน)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#38bdf8', fontWeight: '900' }}>{averages.garmin || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Room Env เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#f43f5e', fontWeight: '900' }}>{averages.room || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Combined เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#34d399', fontWeight: '900' }}>{averages.combined || '--'}</strong>
            </div>
          </div>
        </section>

        {/* ตารางประวัติรายวัน */}
        <section className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>Garmin</th>
                  <th>Room Env</th>
                  <th>Combined</th>
                  <th>จุดอ่อนความไวของผู้ใช้ (Daily Sensitivity)</th>
                  <th>อัตราการดิ้น</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.length > 0 ? (
                  historyLogs.map((log, index) => {
                    const restlessDisplay = log.restlessCount ?? log.restlessMomentsCount ?? '--';
                    const combinedDisplay = log.combinedScore ?? (
                      log.garminScore != null && log.roomScore != null
                        ? Math.round(log.garminScore * 0.5 + log.roomScore * 0.5)
                        : (log.garminScore ?? '--')
                    );

                    const sensitivityLabel = getUserSensitivity(log.date, log.primaryTrigger || log.primarySensorTrigger);

                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: '700', color: '#38bdf8' }}>{log.date}</td>
                        <td style={{ fontWeight: '600' }}>{log.garminScore ?? '--'}</td>
                        <td style={{ color: log.roomScore && log.roomScore < 60 ? '#f43f5e' : '#34d399', fontWeight: '600' }}>
                          {log.roomScore ?? '--'}
                        </td>
                        <td style={{ fontWeight: '800', color: '#ffffff' }}>{combinedDisplay}</td>
                        <td style={{ fontWeight: '700', color: '#fef08a' }}>
                          {sensitivityLabel}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {restlessDisplay !== '--' ? `${restlessDisplay} ครั้ง` : '--'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '28px' }}>
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