'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'คุณผู้ใช้งาน COMFLYY',
    email: 'user@comflyy.app',
    sleepGoal: '7-8 ชั่วโมง / คืน',
    targetTemp: '24.0°C',
    targetHumidity: '50%',
    sensitivity: 'อุณหภูมิ (High)'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '16px 12px'
    }}>
      <style jsx>{`
        .account-container {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .info-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <main className="account-container">
        {/* Header Section */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px'
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#818cf8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            ตั้งค่าบัญชีผู้ใช้
          </h1>
          <div style={{ width: '60px' }}></div>
        </header>

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '20px',
          padding: '24px 18px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)'
          }}>
            👤
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
              {profile.name}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {profile.email}
            </span>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              backgroundColor: isEditing ? '#334155' : '#6366f1',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'ยกเลิก' : '✏️ แก้ไขข้อมูล'}
          </button>
        </div>

        {/* Preferences & Settings */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '20px',
          padding: '20px 18px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#818cf8' }}>
            ⚙️ ค่ากำหนดสภาพแวดล้อมการนอน (Sleep Preferences)
          </span>

          <form onSubmit={handleSave} className="info-grid">
            <div style={{
              backgroundColor: '#0b0f19',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ชื่อผู้ใช้งาน</span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#151c2c',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
              ) : (
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{profile.name}</span>
              )}
            </div>

            <div style={{
              backgroundColor: '#0b0f19',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>เป้าหมายการนอน</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>{profile.sleepGoal}</span>
            </div>

            <div style={{
              backgroundColor: '#0b0f19',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>อุณหภูมิห้องเป้าหมาย</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>{profile.targetTemp}</span>
            </div>

            <div style={{
              backgroundColor: '#0b0f19',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ความชื้นเป้าหมาย</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>{profile.targetHumidity}</span>
            </div>

            <div style={{
              backgroundColor: '#0b0f19',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #1e293b',
              gridColumn: '1 / -1'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>จุดอ่อนความไวรบกวน (Sensitivity)</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>{profile.sensitivity}</span>
            </div>

            {isEditing && (
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            )}
          </form>
        </div>

        {/* System Settings & Actions */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '20px',
          padding: '14px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#0b0f19',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}>
            <span>🔔 การแจ้งเตือนสภาวะห้องนอน</span>
            <span style={{ color: '#34d399' }}>เปิดใช้งาน</span>
          </button>

          <button style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#1f1315',
            color: '#ef4444',
            border: '1px solid #450a0a',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center',
            cursor: 'pointer',
            marginTop: '6px'
          }}>
            ออกจากระบบ
          </button>
        </div>
      </main>
    </div>
  );
}