'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensorsPage() {
  const [dailyAvgs, setDailyAvgs] = useState<any>(null);
  const [activeDate, setActiveDate] = useState<string>('');

  useEffect(() => {
    if (!database) return;

    const logsRef = ref(database, 'logs');
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDailyAvgs(null);
        return;
      }

      const rawLogs = snapshot.val();
      const allLogs = Object.values(rawLogs);

      const groupedByDate: { [key: string]: any[] } = {};
      allLogs.forEach((log: any) => {
        let t = Number(log.timestamp) || 0;
        if (t < 1000000000000) t = t * 1000;
        const d = new Date(t).toISOString().split('T')[0];
        if (!groupedByDate[d]) groupedByDate[d] = [];
        groupedByDate[d].push(log);
      });

      const availableDates = Object.keys(groupedByDate).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      if (availableDates.length === 0) {
        setDailyAvgs(null);
        return;
      }

      const newestDate = availableDates[0];
      const targetLogs = groupedByDate[newestDate];
      const total = targetLogs.length;

      setActiveDate(newestDate);

      setDailyAvgs({
        temp: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.temperature || 0), 0) / total).toFixed(1)),
        hum: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.humidity || 0), 0) / total).toFixed(1)),
        co2: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.co2 || 0), 0) / total).toFixed(0)),
        pm25: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.pm25 || 0), 0) / total).toFixed(1)),
        sound: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.sound || 0), 0) / total).toFixed(0)),
        light: Number((targetLogs.reduce((s: number, i: any) => s + Number(i.light_lux || 0), 0) / total).toFixed(0))
      });
    });

    return () => unsubscribe();
  }, []);

  const getSensorStatus = (type: string, val: number | null) => {
    if (val === null || val === undefined) {
      return { label: 'กำลังรอข้อมูล...', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
    }

    switch (type) {
      case 'co2':
        if (val <= 800) return { label: 'ดีเยี่ยม (อากาศบริสุทธิ์)', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        if (val <= 1000) return { label: 'ปกติ (อยู่ในเกณฑ์)', color: '#b45309', bg: '#fffbeb', border: '#fef3c7', dot: '#f59e0b' };
        return { label: 'ควรระบายอากาศด่วน', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      case 'temp':
        if (val >= 23 && val <= 25) return { label: 'เย็นสบายพอดี (เหมาะสม)', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        if (val < 23) return { label: 'ค่อนข้างเย็นเกินไป', color: '#1d4ed8', bg: '#eff6ff', border: '#dbeafe', dot: '#2563eb' };
        return { label: 'ร้อนเกินไป (เหงื่อออกง่าย)', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      case 'hum':
        if (val >= 50 && val <= 60) return { label: 'เหมาะสมสำหรับการนอน', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        if (val < 50) return { label: 'ค่อนข้างแห้งเกินไป', color: '#b45309', bg: '#fffbeb', border: '#fef3c7', dot: '#f59e0b' };
        return { label: 'ชื้นสูงเกินเกณฑ์ (อึดอัด)', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      case 'pm25':
        if (val <= 15) return { label: 'ดีเยี่ยม (ไม่มีฝุ่น)', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        if (val <= 37.5) return { label: 'ปานกลาง (ยอมรับได้)', color: '#b45309', bg: '#fffbeb', border: '#fef3c7', dot: '#f59e0b' };
        return { label: 'มีฝุ่นรบกวนสูง', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      case 'sound':
        if (val <= 40) return { label: 'เงียบสงบ ไร้เสียงรบกวน', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        if (val <= 60) return { label: 'มีเสียงรบกวนปานกลาง', color: '#b45309', bg: '#fffbeb', border: '#fef3c7', dot: '#f59e0b' };
        return { label: 'เสียงรบกวนดังเกินไป', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      case 'light':
        if (val === 0) return { label: 'มืดสนิท เหมาะแก่การนอน', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
        return { label: 'มีแสงสว่างแยงตา', color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2', dot: '#ef4444' };

      default:
        return { label: 'ปกติ', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', dot: '#10b981' };
    }
  };

  const sensorCards = [
    { type: 'co2', title: 'ก๊าซ CO2', value: dailyAvgs?.co2, unit: 'ppm', icon: '🫁', color: '#1d4ed8', standard: 'ต่ำกว่า 1,000 ppm' },
    { type: 'temp', title: 'อุณหภูมิห้อง', value: dailyAvgs?.temp, unit: '°C', icon: '🌡️', color: '#0f172a', standard: '23.0 - 25.0 °C' },
    { type: 'hum', title: 'ความชื้นสัมพัทธ์', value: dailyAvgs?.hum, unit: '%', icon: '💧', color: '#0f172a', standard: '50 - 60 %' },
    { type: 'pm25', title: 'ฝุ่น PM2.5', value: dailyAvgs?.pm25, unit: 'µg/m³', icon: '🌫️', color: '#0f172a', standard: 'ต่ำกว่า 37.5 µg/m³' },
    { type: 'sound', title: 'เสียงรบกวน', value: dailyAvgs?.sound, unit: 'dB', icon: '🔊', color: '#059669', standard: 'ต่ำกว่า 40 dB' },
    { type: 'light', title: 'แสงสว่าง', value: dailyAvgs?.light, unit: 'Lux', icon: '💡', color: '#0f172a', standard: '0 Lux (มืดสนิท)' },
  ];

  const navTabs = [
    { href: '/', icon: '📊', title: 'ภาพรวม' },
    { href: '/sensors', icon: '🛏️', title: 'ห้องนอน', active: true },
    { href: '/persona', icon: '⌚', title: 'Garmin' },
    { href: '/sensitivity', icon: '🎯', title: 'จุดอ่อน' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติ' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px 14px 110px 14px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>

        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2px 4px'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              <span style={{ color: '#1d4ed8' }}>COMFLYYY</span>
              <span style={{ color: '#0f172a', marginLeft: '6px' }}>ROOM</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              สภาพแวดล้อมตรวจวัดจริงจาก ESP32
            </span>
          </div>

          <span style={{
            fontSize: '11px',
            color: '#1d4ed8',
            fontWeight: '700',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
            padding: '4px 12px',
            borderRadius: '9999px'
          }}>
            {activeDate || '2026-09-05'}
          </span>
        </header>

        {/* Info Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '18px 16px'
        }}>
          <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800', display: 'block', marginBottom: '2px' }}>
            คุณภาพห้องนอนโดยรวม
          </strong>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            ค่าเฉลี่ยตรวจวัดจากอุปกรณ์ IoT ตลอดทั้งคืน เพื่อนำไปประเมินร่วมกับสุขอนามัยการนอนหลับ
          </p>
        </div>

        {/* Sensor Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {sensorCards.map((s, idx) => {
            const status = getSensorStatus(s.type, s.value);

            return (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                    {s.title}
                  </span>
                  <span style={{ fontSize: '18px' }}>{s.icon}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', margin: '2px 0' }}>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color: s.color,
                    lineHeight: 1,
                    letterSpacing: '-1px'
                  }}>
                    {s.value !== null && s.value !== undefined ? s.value : '--'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                    {s.unit}
                  </span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  backgroundColor: status.bg,
                  border: `1px solid ${status.border}`,
                  color: status.color,
                  fontSize: '10.5px',
                  fontWeight: '700'
                }}>
                  {status.dot && (
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: status.dot,
                      flexShrink: 0
                    }}></span>
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {status.label}
                  </span>
                </div>

                <span style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '2px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '6px'
                }}>
                  เกณฑ์: {s.standard}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px 16px 18px 16px',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        zIndex: 50
      }}>
        <div style={{
          width: '100%',
          maxWidth: '640px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {navTabs.map((tab, idx) => (
            <Link key={idx} href={tab.href} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              gap: '4px',
              padding: '6px 14px',
              borderRadius: '14px',
              backgroundColor: tab.active ? '#eff6ff' : 'transparent',
              transition: 'background-color 0.15s ease'
            }}>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{
                fontSize: '12px',
                fontWeight: tab.active ? '800' : '600',
                color: tab.active ? '#1d4ed8' : '#64748b',
                lineHeight: 1
              }}>
                {tab.title}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}