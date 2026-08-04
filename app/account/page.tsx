'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { app } from '@/app/lib/firebase';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // ติดตามสถานะการล็อกอินของผู้ใช้จริงจาก Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p style={{ color: '#818cf8', fontWeight: '600' }}>กำลังโหลดข้อมูลบัญชีผู้ใช้...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <style jsx>{`
        .account-card {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stats-user-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .stats-user-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <main className="account-card">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AUTHENTICATED PROFILE</span>
        </div>

        {/* Real User Card */}
        {user ? (
          <div style={{
            backgroundColor: '#151c2c',
            borderRadius: '22px',
            padding: '24px',
            border: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Profile'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    border: '2px solid #6366f1',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 6px 18px rgba(99, 102, 241, 0.4)',
                  flexShrink: 0
                }}>
                  👤
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                    {user.displayName || 'สมาชิก COMFLYY'}
                  </h1>
                  <span style={{ fontSize: '10px', backgroundColor: '#10b98120', color: '#34d399', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                    Active
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                  {user.email || 'ไม่ระบุอีเมล'}
                </span>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                  UID: {user.uid.substring(0, 12)}...
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Case: Not Logged In */
          <div style={{
            backgroundColor: '#151c2c',
            borderRadius: '22px',
            padding: '32px 24px',
            border: '1px solid #1e293b',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <span style={{ fontSize: '40px' }}>🔒</span>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#f8fafc', fontWeight: '800' }}>
              ยังไม่ได้เข้าสู่ระบบ
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
              เข้าสู่ระบบด้วย Firebase Auth เพื่อซิงค์ประวัติการนอนและข้อมูลเซนเซอร์เฉพาะบุคคลของคุณ
            </p>
          </div>
        )}

        {/* Devices & System Settings */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '22px',
          padding: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            ⚙️ การเชื่อมต่อฮาร์ดแวร์และคลาวด์
          </span>

          <div style={{ backgroundColor: '#0f172a', padding: '14px 16px', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700', display: 'block' }}>Firebase Realtime Database</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>โหมดดึงค่าเซนเซอร์สด</span>
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>🟢 Connected</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '14px 16px', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700', display: 'block' }}>Gemini AI Service</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>วิเคราะห์สภาพแวดล้อมเฉพาะบุคคล</span>
            </div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>⚡ Ready</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {user && (
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: '#ef444415',
                color: '#ef4444',
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid #ef444430',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              🚪 ออกจากระบบ (Sign Out)
            </button>
          )}

          <Link href="/" style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    </div>
  );
}