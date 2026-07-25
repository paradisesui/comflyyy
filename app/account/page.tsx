'use client';

import React from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const user = {
    name: 'Comflyyy User',
    email: 'user@comflyyy.app',
    sleepGoal: '8 ชั่วโมง/คืน',
    avgSleep: '7 ชม. 30 นาที',
    personaType: 'Noise Sensitive (ไวต่อเสียง)',
    deviceStatus: 'เชื่อมต่อ ESP32 แล้ว'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#0f172a',
        borderRadius: '28px',
        border: '1px solid #1e293b',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            ข้อมูลผู้ใช้งาน (User Profile)
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#162032',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#10b98120',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>{user.name}</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</span>
          </div>
        </div>

        {/* User Stats & Goals */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '13px', color: '#f1f5f9', margin: 0 }}>🎯 เป้าหมายและสถิติการนอน</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>เป้าหมายการนอน:</span>
            <span style={{ fontWeight: '600', color: '#f8fafc' }}>{user.sleepGoal}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>เฉลี่ยย้อนหลัง:</span>
            <span style={{ fontWeight: '600', color: '#34d399' }}>{user.avgSleep}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8' }}> Sleep Persona:</span>
            <span style={{ fontWeight: '600', color: '#f59e0b' }}>{user.personaType}</span>
          </div>
        </div>

        {/* Device Status */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>อุปกรณ์เซนเซอร์</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>{user.deviceStatus}</span>
          </div>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
        </div>

        {/* Footer Link Back */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '12px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}