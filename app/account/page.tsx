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
        กำลังโหลด...
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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← กลับหน้าหลัก
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>
            {user ? 'ข้อมูลผู้ใช้งาน' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </h2>
        </header>

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', margin: '10px 0' }}>👤</div>
            <div style={{ backgroundColor: '#162032', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>เข้าสู่ระบบในชื่อ</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#34d399' }}>{user.email}</span>
              <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '4px' }}>UID: {user.uid}</span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ backgroundColor: '#ef444420', color: '#f87171', border: '1px solid #ef444440', padding: '10px', borderRadius: '10px', fontSize: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
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
                  borderRadius: '10px',
                  backgroundColor: '#162032',
                  border: '1px solid #334155',
                  color: '#fff',
                  boxSizing: 'border-box'
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
                  borderRadius: '10px',
                  backgroundColor: '#162032',
                  border: '1px solid #334155',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: '#022c22',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '10px'
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
                marginTop: '10px'
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