'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, set, get, child } from 'firebase/database';

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

  // Helper แปลงอีเมลเป็นคีย์สำหรับ Database (ตัดอักขระพิเศษออก)
  const makeUserKey = (mail: string) => {
    return mail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  };

  // ดึงข้อมูล Profile จาก Firebase Database
  const fetchUserProfile = async (key: string, userMail: string) => {
    try {
      setLoading(true);
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/${key}`));

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserName(data.name || userMail.split('@')[0]);
        setProfileImage(data.image || null);
      } else {
        const defaultName = userMail.split('@')[0];
        setUserName(defaultName);
        await saveUserProfileToFirebase(key, defaultName, userMail, null);
      }
      setEmail(userMail);
      setUserKey(key);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // บันทึกข้อมูล Profile ลง Firebase Database
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
    }
  };

  // ตรวจสอบ Session เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const savedMail = localStorage.getItem('comflyy_session_email');
    if (savedMail) {
      const key = makeUserKey(savedMail);
      fetchUserProfile(key, savedMail);
    } else {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันกด เข้าสู่ระบบ / สมัครสมาชิก
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const cleanedEmail = inputEmail.trim();
    const key = makeUserKey(cleanedEmail);

    // บันทึก Session ลง LocalStorage เครื่อง
    localStorage.setItem('comflyy_session_email', cleanedEmail);

    if (isRegisterMode) {
      const finalName = inputName.trim() || cleanedEmail.split('@')[0];
      setUserName(finalName);
      setEmail(cleanedEmail);
      setUserKey(key);
      setIsLoggedIn(true);
      await saveUserProfileToFirebase(key, finalName, cleanedEmail, profileImage);
    } else {
      await fetchUserProfile(key, cleanedEmail);
    }

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
      if (file.size > 1 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 1MB');
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
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

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
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card {
          background-color: #151c2c;
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 20px 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }

        .input-field {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          background-color: #0b0f19;
          border: 1px solid #1e293b;
          color: #f8fafc;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }

        .input-field:focus {
          border-color: #6366f1;
        }

        .btn-primary {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background-color: #6366f1;
          color: #fff;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 2px dashed #334155;
          border-radius: 16px;
          background-color: #0b0f19;
          cursor: pointer;
          margin-top: 10px;
        }
      `}</style>

      <main className="account-container">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <Link href="/" style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#151c2c',
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid #1e293b'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            {isLoggedIn ? 'จัดการบัญชี' : isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </h1>
          <div style={{ width: '80px' }} />
        </header>

        {!isLoggedIn ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '40px' }}>🌙</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 2px 0' }}>
                {isRegisterMode ? 'สร้างบัญชี COMFLYY' : 'ยินดีต้อนรับกลับมา'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
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

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
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
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: profileImage ? `url(${profileImage}) center/cover no-repeat` : 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                border: '2px solid #818cf8',
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
                      style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '13px', cursor: 'pointer', padding: 0 }}
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
                  backgroundColor: '#10b98115',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #10b98130'
                }}>
                  • Active Member
                </span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8' }}>
                🖼️ เปลี่ยนรูปโปรไฟล์ (Upload Photo)
              </span>

              <label htmlFor="profile-upload" className="upload-area">
                <span style={{ fontSize: '28px', marginBottom: '6px' }}>📁</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc' }}>
                  กดเพื่อเลือกรูปภาพจากมือถือหรือคอมพิวเตอร์
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  รองรับไฟล์ PNG หรือ JPG (ไม่เกิน 1MB)
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

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#ef444415',
                color: '#f87171',
                border: '1px solid #ef444430',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px'
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