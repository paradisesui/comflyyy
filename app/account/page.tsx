'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Settings States
  const [notifications, setNotifications] = useState<boolean>(true);
  const [sleepGoal, setSleepGoal] = useState<string>('8.0');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      if (err.code) {
        setError(`[${err.code}]: ${err.message}`);
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Firebase');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

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
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← กลับหน้าหลัก
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700', color: '#f8fafc' }}>
            {user ? 'โปรไฟล์ของฉัน' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </h2>
        </header>

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* User Profile Card */}
            <div style={{
              backgroundColor: '#162032',
              padding: '20px',
              borderRadius: '20px',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              position: 'relative'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#10b98120',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                🌙
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', display: 'block' }}>
                  {user.email?.split('@')[0]}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0f172a',
                padding: '4px 12px',
                borderRadius: '12px',
                border: '1px solid #334155',
                fontSize: '11px',
                color: '#34d399',
                fontWeight: '600'
              }}>
                ✨ Sleep Optimizer Member
              </div>
            </div>

            {/* Overview Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{ backgroundColor: '#162032', padding: '14px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>การติดตาม</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>14 วัน</span>
              </div>
              <div style={{ backgroundColor: '#162032', padding: '14px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>คะแนนเฉลี่ย</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>88%</span>
              </div>
            </div>

            {/* Quick Settings Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>
                ⚙️ การตั้งค่าและอุปกรณ์
              </h3>

              <div style={{
                backgroundColor: '#162032',
                borderRadius: '18px',
                border: '1px solid #1e293b',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Device Connected Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📡</span>
                    <span style={{ fontSize: '13px', color: '#e2e8f0' }}>เซนเซอร์ห้องนอน (ESP32)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>เชื่อมต่อแล้ว</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: 0 }} />

                {/* Notifications Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🔔</span>
                    <span style={{ fontSize: '13px', color: '#e2e8f0' }}>เตือนเมื่อสภาพห้องแย่</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: 0 }} />

                {/* Sleep Goal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⏱️</span>
                    <span style={{ fontSize: '13px', color: '#e2e8f0' }}>เป้าหมายเวลานอน</span>
                  </div>
                  <select
                    value={sleepGoal}
                    onChange={(e) => setSleepGoal(e.target.value)}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#34d399',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    <option value="7.0">7.0 ชม./คืน</option>
                    <option value="7.5">7.5 ชม./คืน</option>
                    <option value="8.0">8.0 ชม./คืน</option>
                    <option value="8.5">8.5 ชม./คืน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div style={{ backgroundColor: '#162032', padding: '12px 16px', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>User UID</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                {user.uid.slice(0, 12)}...
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef444415',
                color: '#f87171',
                border: '1px solid #ef444440',
                padding: '12px',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ backgroundColor: '#ef444420', color: '#f87171', border: '1px solid #ef444440', padding: '10px', borderRadius: '12px', fontSize: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>อีเมล (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#162032',
                  border: '1px solid #334155',
                  color: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>รหัสผ่าน (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#162032',
                  border: '1px solid #334155',
                  color: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: '#022c22',
                padding: '13px',
                borderRadius: '14px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              {isRegister ? 'ยืนยันการสมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>

            <p
              onClick={() => setIsRegister(!isRegister)}
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#94a3b8',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '8px'
              }}
            >
              {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
            </p>
          </form>
        )}
      </main>
    </div>
  );
}