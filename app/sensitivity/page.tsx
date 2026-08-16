'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityPage() {
  const [viewMode, setViewMode] = useState<'latest' | 'lifetime'>('latest');
  const [latestDate, setLatestDate] = useState<string>('');
  const [allEvents, setAllEvents] = useState<{ [key: string]: any }>({});
  const [totalCumulativeStats, setTotalCumulativeStats] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [totalDays, setTotalDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    // 1. ดึง Events ทั้งหมดเพื่อคำนวณทั้งวันล่าสุดและยอดสะสม
    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAllEvents(data);
        const days = Object.keys(data).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        setTotalDays(days.length);

        if (days.length > 0) {
          setLatestDate(days[0]);
        }

        // คำนวณยอดสะสมทุกวัน (Cumulative Trigger Totals)
        const cumulativeBreakdown: { [key: string]: number } = {
          sound_db: 0,
          temperature: 0,
          co2: 0,
          humidity: 0,
          pm25: 0,
          light_lux: 0
        };

        let totalRestlessAllDays = 0;

        days.forEach((dayKey) => {
          const breakdown = data[dayKey]?.sensorTriggerBreakdown || {};
          totalRestlessAllDays += Number(data[dayKey]?.totalRestlessMoments || 0);

          Object.keys(breakdown).forEach((sensorKey) => {
            if (cumulativeBreakdown[sensorKey] !== undefined) {
              cumulativeBreakdown[sensorKey] += Number(breakdown[sensorKey] || 0);
            } else {
              cumulativeBreakdown[sensorKey] = Number(breakdown[sensorKey] || 0);
            }
          });
        });

        const sortedTriggers = Object.entries(cumulativeBreakdown).sort(([, a], [, b]) => b - a);
        const sumTriggers = Object.values(cumulativeBreakdown).reduce((a, b) => a + b, 0);

        setTotalCumulativeStats({
          cumulativeBreakdown,
          sortedTriggers,
          totalRestlessAllDays,
          sumTriggers,
          topTrigger: sortedTriggers[0] ? sortedTriggers[0][0] : 'sound_db'
        });
      }
      setLoading(false);
    });

    // 2. ดึงข้อมูล Summary สำหรับคะแนนภาพรวม
    const summaryRef = ref(database, 'personal_sensitivity/summary');
    onValue(summaryRef, (snap) => {
      if (snap.exists()) setSummaryData(snap.val());
    });

    return () => unsubEvents();
  }, []);

  // ดึงข้อมูลวันล่าสุด
  const latestEventData = allEvents[latestDate] || {};
  const latestTriggerBreakdown = latestEventData?.sensorTriggerBreakdown || {};
  const latestRestlessCount = latestEventData?.totalRestlessMoments ?? summaryData?.restlessCount ?? 19;
  const latestSensitivityScore = latestEventData?.overallSensitivityScore ?? (latestRestlessCount > 0 ? Number(((latestRestlessCount / 40) * 100).toFixed(1)) : 38);

  const sortedLatestTriggers = Object.entries(latestTriggerBreakdown).sort(([, a]: any, [, b]: any) => Number(b) - Number(a));
  const latestTop1 = sortedLatestTriggers[0];
  const latestTop2 = sortedLatestTriggers[1];

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': case 'noise': return 'เสียงรบกวน (Noise)';
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
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '32px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
          backdrop-filter: blur(16px);
          width: fit-content;
        }

        .tab-btn {
          padding: 10px 24px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 14px;
        }

        @media (min-width: 640px) {
          .breakdown-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="container">
        {/* Navigation & Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back-glow">
            <span>← กลับหน้าหลัก</span>
          </Link>
          
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setViewMode('latest')}
              className="tab-btn"
              style={{
                backgroundColor: viewMode === 'latest' ? '#f43f5e' : 'transparent',
                color: viewMode === 'latest' ? '#ffffff' : '#94a3b8'
              }}
            >
              📅 วันล่าสุด ({latestDate || '--'})
            </button>
            <button
              onClick={() => setViewMode('lifetime')}
              className="tab-btn"
              style={{
                backgroundColor: viewMode === 'lifetime' ? '#f43f5e' : 'transparent',
                color: viewMode === 'lifetime' ? '#ffffff' : '#94a3b8'
              }}
            >
              🏆 ภาพรวมสะสม ({totalDays} วัน)
            </button>
          </div>
        </div>

        {/* ----------------- โหมดที่ 1: วันล่าสุด ----------------- */}
        {viewMode === 'latest' && (
          <>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
                🎯 จุดอ่อนความไวการนอนประจำวัน ({latestDate})
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                วิเคราะห์การจับคู่นาทีที่ดิ้นตื่นจริงกับเซ็นเซอร์ห้องนอนเมื่อคืนนี้
              </p>
            </div>

            <section className="glass-card" style={{
              borderColor: 'rgba(244, 63, 94, 0.45)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(159, 18, 57, 0.25) 100%)'
            }}>
              <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: '900', letterSpacing: '0.8px' }}>
                ⚡ สิ่งรบกวนหลักที่กระตุ้นร่างกายเมื่อคืนนี้ (PRIMARY TRIGGER)
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fef08a', margin: 0, lineHeight: 1.6 }}>
                {latestTop1 && Number(latestTop1[1]) > 0 ? (
                  <>
                    พบว่า <span style={{ color: '#f43f5e' }}>{formatSensorName(latestTop1[0])}</span>
                    {latestTop2 && Number(latestTop2[1]) > 0 && (
                      <> และ <span style={{ color: '#38bdf8' }}>{formatSensorName(latestTop2[0])}</span></>
                    )} เป็นสิ่งรบกวนหลักที่สัมพันธ์กับช่วงเวลาที่ดิ้นตื่น ({latestRestlessCount} ครั้ง)
                  </>
                ) : (
                  `สภาพแวดล้อมห้องนอนอยู่ในเกณฑ์ปกติ มีการขยับตัวระหว่างนอนรวม ${latestRestlessCount} ครั้ง`
                )}
              </h2>
            </section>

            <section className="glass-card">
              <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
                📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นเมื่อคืนนี้ (Sensor Breakdown)
              </span>
              <div className="breakdown-grid">
                {Object.entries(latestTriggerBreakdown).map(([key, count]: any) => (
                  <div key={key} style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    padding: '16px',
                    borderRadius: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      {formatSensorName(key)}
                    </span>
                    {Number(count) > 0 ? (
                      <strong style={{ fontSize: '22px', color: '#38bdf8' }}>
                        {count} <span style={{ fontSize: '12px', color: '#64748b' }}>ครั้ง</span>
                      </strong>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700' }}>🟢 สภาพแวดล้อมปกติ</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="glass-card">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Daily Sensitivity Score</span>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#34d399', margin: '4px 0' }}>
                  {latestSensitivityScore} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>ดัชนีความไวต่อสิ่งเร้าประจำวัน</span>
              </div>

              <div className="glass-card">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Combined Sleep Score</span>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#38bdf8', margin: '4px 0' }}>
                  {summaryData?.combinedScore ?? 73} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (Garmin: {summaryData?.garminScore ?? 65} | Room Env: {summaryData?.roomScore ?? 80})
                </span>
              </div>
            </div>
          </>
        )}

        {/* ----------------- โหมดที่ 2: ภาพรวมสะสมทั้งหมด ----------------- */}
        {viewMode === 'lifetime' && (
          <>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
                🏆 จุดอ่อนความไวสะสมระยะยาว ({totalDays} วัน)
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                สรุปพฤติกรรมความไวของร่างกายจากสถิติดิ้นสะสมรวม {totalCumulativeStats?.totalRestlessAllDays || 0} ครั้ง
              </p>
            </div>

            <section className="glass-card" style={{
              borderColor: 'rgba(244, 63, 94, 0.45)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(159, 18, 57, 0.25) 100%)'
            }}>
              <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: '900', letterSpacing: '0.8px' }}>
                🏆 ปัจจัยที่ร่างกายของคุณไวต่อสิ่งเร้ามากที่สุดตลอดกาล (ALL-TIME PRIMARY TRIGGER)
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: '6px 0' }}>
                {totalCumulativeStats?.topTrigger ? formatSensorName(totalCumulativeStats.topTrigger) : 'กำลังคำนวณ...'}
              </h2>
              <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
                จากสถิติสะสมพบว่า เมื่อเกิดสิ่งเร้าจาก <strong>{formatSensorName(totalCumulativeStats?.topTrigger || '')}</strong> ร่างกายจะมีอัตราการตื่นตัวและขยับตัวบ่อยที่สุดเมื่อเทียบกับสิ่งแวดล้อมด้านอื่น
              </p>
            </section>

            <section className="glass-card">
              <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
                📊 จำนวนครั้งและสัดส่วนที่เซนเซอร์แต่ละตัวกระตุ้นการดิ้นสะสม ({totalDays} วัน)
              </span>
              <div className="breakdown-grid">
                {totalCumulativeStats?.sortedTriggers?.map(([key, count]: any) => {
                  const sum = totalCumulativeStats.sumTriggers || 1;
                  const pct = Math.round((count / sum) * 100);

                  return (
                    <div key={key} style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      padding: '18px',
                      borderRadius: '18px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        {formatSensorName(key)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                        <strong style={{ fontSize: '26px', color: '#38bdf8' }}>{count}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ครั้ง ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 30 ? '#f43f5e' : '#38bdf8' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}