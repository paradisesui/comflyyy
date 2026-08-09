'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, set, onValue } from 'firebase/database';

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [userKey, setUserKey] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [inputName, setInputName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  // Helper สำหรับแปลงอีเมลให้เป็น Database Key ปลอดภัย
  const makeUserKey = (mail: string) => {
    return mail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  };

  // ตรวจสอบ Session และเปิดการเชื่อมต่อ Real-time Sync
  useEffect(() => {
    const savedMail = localStorage.getItem('comflyy_session_email');
    if (savedMail) {
      const key = makeUserKey(savedMail);
      setEmail(savedMail);
      setUserKey(key);
      setIsLoggedIn(true);

      const userRef = ref(database, `users/${key}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserName(data.name || savedMail.split('@')[0]);
          setProfileImage(data.image || null);
        } else {
          setUserName(savedMail.split('@')[0]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Firebase Realtime Listener Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // บันทึกข้อมูล Profile ลง Firebase Realtime Database
  const saveUserProfileToFirebase = async (key: string, name: string, mail: string, image: string | null) => {
    try {
      await set(ref(database, `users/${key}`), {
        name,
        email: mail,
        image,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error saving user profile:", error);
      alert("ไม่สามารถบันทึกข้อมูลลง Database ได้ กรุณาเช็คอินเทอร์เน็ต");
    }
  };

  // ฟังก์ชันกด เข้าสู่ระบบ / สมัครสมาชิก
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail) {
      alert('กรุณากรอกอีเมล');
      return;
    }

    const cleanedEmail = inputEmail.trim();
    const key = makeUserKey(cleanedEmail);
    const finalName = inputName.trim() || cleanedEmail.split('@')[0];

    localStorage.setItem('comflyy_session_email', cleanedEmail);

    setEmail(cleanedEmail);
    setUserKey(key);
    setUserName(finalName);
    setIsLoggedIn(true);

    const userRef = ref(database, `users/${key}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserName(data.name || finalName);
        setProfileImage(data.image || null);
      }
    });

    await saveUserProfileToFirebase(key, finalName, cleanedEmail, profileImage);

    setInputEmail('');
    setInputPassword('');
    setInputName('');
  };

  // ออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('comflyy_session_email');
    setIsLoggedIn(false);
    setUserKey('');
    setUserName('');
    setEmail('');
    setProfileImage(null);
  };

  // บันทึกการเปลี่ยนชื่อ
  const handleSaveName = async () => {
    if (!inputName.trim() || !userKey) return;
    const newName = inputName.trim();
    setUserName(newName);
    setIsEditingName(false);
    await saveUserProfileToFirebase(userKey, newName, email, profileImage);
  };

  // อัปโหลดรูปภาพ
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userKey) {
      if (file.size > 800 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 800KB ครับ');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        await saveUserProfileToFirebase(userKey, userName, email, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        color: '#38bdf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🔄 กำลังซิงค์ข้อมูลบัญชีผู้ใช้กับ Firebase...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '16px 12px 32px 12px'
    }}>
      <style jsx>{`
        .account-container {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #38bdf8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: rgba(56, 189, 248, 0.2);
          transform: translateX(-2px);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
        }

        .input-field {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          background-color: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }

        .btn-primary {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #fff;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 2px dashed rgba(56, 189, 248, 0.3);
          border-radius: 16px;
          background-color: rgba(15, 23, 42, 0.4);
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-area:hover {
          background-color: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.5);
        }
      `}</style>

      <main className="account-container">
        {/* Navigation Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" className="btn-pill-back">
            <span className="arrow-circle">←</span>
            <span>กลับหน้าหลัก</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
            USER ACCOUNT MANAGEMENT
          </span>
        </header>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            👤 {isLoggedIn ? 'จัดการบัญชีผู้ใช้' : isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {isLoggedIn ? 'ปรับแต่งข้อมูลส่วนตัวและรูปโปรไฟล์' : 'ระบบบันทึกสถิติและประวัติการนอนเฉพาะบุคคล'}
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="glass-card">
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '38px', display: 'inline-block', filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))' }}>🌙</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 2px 0', color: '#f8fafc' }}>
                {isRegisterMode ? 'สร้างบัญชี COMFY SLEEP' : 'ยินดีต้อนรับกลับมา'}
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                {isRegisterMode ? 'กรอกข้อมูลเพื่อเริ่มต้นติดตามสภาวะการนอน' : 'ลงชื่อเข้าใช้เพื่อดูประวัติและตั้งค่าสภาวะการนอน'}
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isRegisterMode && (
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อแสดงผล</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="เช่น สมชาย สายหลับ"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>อีเมล</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสผ่าน</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                {isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                {isRegisterMode ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* User Profile Card */}
            <div className="glass-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
              borderColor: 'rgba(56, 189, 248, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: profileImage ? `url(${profileImage}) center/cover no-repeat` : 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  border: '2px solid #38bdf8',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
                  flexShrink: 0
                }}>
                  {!profileImage && '👤'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditingName ? (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ใส่ชื่อใหม่"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      />
                      <button
                        onClick={handleSaveName}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        บันทึก
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {userName}
                      </h2>
                      <button
                        onClick={() => { setIsEditingName(true); setInputName(userName); }}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                        title="แก้ไขชื่อ"
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    {email}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    • Active Member
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Upload Card */}
            <div className="glass-card">
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                🖼️ เปลี่ยนรูปโปรไฟล์ (Upload Photo)
              </span>

              <label htmlFor="profile-upload" className="upload-area">
                <span style={{ fontSize: '28px', marginBottom: '6px' }}>📁</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc' }}>
                  กดเพื่อเลือกรูปภาพจากมือถือหรือคอมพิวเตอร์
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  รองรับไฟล์ PNG หรือ JPG (ไม่เกิน 800KB)
                </span>
              </label>

              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'all 0.2s'
              }}
            >
              🚪 ออกจากระบบ (Log Out)
            </button>
          </>
        )}
      </main>
    </div>
  );
}