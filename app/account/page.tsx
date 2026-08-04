'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  // State สำหรับจัดการ Session ผู้ใช้
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // State ข้อมูลผู้ใช้
  const [userName, setUserName] = useState<string>('ผู้ใช้งาน COMFLYY');
  const [email, setEmail] = useState<string>('comflyy.user@example.com');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // State ฟอร์มแก้ไข / เข้าสู่ระบบ
  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [inputName, setInputName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  // โหลดข้อมูลผู้ใช้จาก LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('comflyy_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserName(parsed.name || 'ผู้ใช้งาน COMFLYY');
      setEmail(parsed.email || 'comflyy.user@example.com');
      setProfileImage(parsed.image || null);
      setIsLoggedIn(true);
    }
  }, []);

  // ฟังก์ชัน บันทึกข้อมูลลง LocalStorage
  const saveUserData = (name: string, mail: string, image: string | null) => {
    const userData = { name, email: mail, image };
    localStorage.setItem('comflyy_user', JSON.stringify(userData));
  };

  // ฟังก์ชัน เข้าสู่ระบบ / สมัครสมาชิก
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const finalName = isRegisterMode ? (inputName || 'ผู้ใช้งานใหม่') : 'ผู้ใช้งาน COMFLYY';
    setUserName(finalName);
    setEmail(inputEmail);
    setIsLoggedIn(true);
    saveUserData(finalName, inputEmail, profileImage);
    
    setInputEmail('');
    setInputPassword('');
    setInputName('');
  };

  // ฟังก์ชัน ออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('comflyy_user');
    setIsLoggedIn(false);
    setIsEditingName(false);
  };

  // ฟังก์ชัน บันทึกการเปลี่ยนชื่อ
  const handleSaveName = () => {
    if (!inputName.trim()) return;
    setUserName(inputName);
    saveUserData(inputName, email, profileImage);
    setIsEditingName(false);
  };

  // ฟังก์ชัน อัปโหลดไฟล์รูปภาพ (แปลงเป็น Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        saveUserData(userName, email, base64String);
      };
      reader.readAsDataURL(file);
    }
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

        .btn-primary:active {
          transform: scale(0.98);
        }

        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background-color: #0b0f19;
          border: 1px solid #1e293b;
          border-radius: 12px;
          color: #f8fafc;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
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
          transition: border-color 0.2s;
        }

        .upload-area:hover {
          border-color: #6366f1;
        }
      `}</style>

      <main className="account-container">
        {/* Header Section */}
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

        {/* กรณีที่ 1: ยังไม่ได้เข้าสู่ระบบ (แสดง ฟอร์ม Login / Register) */}
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
          /* กรณีที่ 2: เข้าสู่ระบบเรียบร้อยแล้ว (แสดง หน้าข้อมูลส่วนตัว + อัปโหลดรูป + Logout) */
          <>
            {/* Profile Info Card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* แสดงรูปโปรไฟล์ที่อัปโหลด หรือ Default Icon */}
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

            {/* Change Profile Picture (Upload from Computer / Mobile) */}
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
                  รองรับไฟล์ PNG, JPG หรือ GIF (ไม่เกิน 2MB)
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

            {/* Quick Links */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8' }}>
                ⚙️ การตั้งค่าระบบ
              </span>

              <Link href="/sensors" className="menu-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📡 เซนเซอร์ห้องนอน
                </span>
                <span style={{ color: '#64748b' }}>➔</span>
              </Link>

              <Link href="/persona" className="menu-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⌚ Smart Watch
                </span>
                <span style={{ color: '#64748b' }}>➔</span>
              </Link>

              <Link href="/sensitivity" className="menu-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 ความไวการนอน (Sensitivity)
                </span>
                <span style={{ color: '#64748b' }}>➔</span>
              </Link>
            </div>

            {/* Logout Button */}
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