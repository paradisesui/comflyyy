'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User 
} from 'firebase/auth';
import { ref, set, get, child } from 'firebase/database';
import { app, database } from '@/app/lib/firebase';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhotoBase64, setNewPhotoBase64] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const auth = getAuth(app);
  const router = useRouter();

  // โหลดข้อมูลโปรไฟล์จาก Firebase Realtime Database
  const fetchUserProfile = async (uid: string) => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/${uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // ดึงข้อมูลรูปภาพและชื่อจาก Database
        const profileData = await fetchUserProfile(currentUser.uid);
        setUser({
          ...currentUser,
          displayName: profileData?.displayName || currentUser.displayName || 'สมาชิก COMFLYY',
          photoURL: profileData?.photoURL || currentUser.photoURL || ''
        });
        setNewDisplayName(profileData?.displayName || currentUser.displayName || '');
        setNewPhotoBase64(profileData?.photoURL || currentUser.photoURL || '');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // บีบอัดรูปภาพให้มีขนาดเล็กกะทัดรัด
  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      };
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isRegister: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        if (isRegister) {
          setPhotoBase64(compressedBase64);
        } else {
          setNewPhotoBase64(compressedBase64);
        }
      });
    }
  };

  // เข้าสู่ระบบ
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthSuccess('เข้าสู่ระบบสำเร็จ!');
    } catch (err: any) {
      setAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  // สมัครสมาชิก
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const finalName = displayName || 'สมาชิก COMFLYY';
      const finalPhoto = photoBase64 || '';

      // บันทึกข้อมุลลง Firebase Database
      await set(ref(database, `users/${newUser.uid}`), {
        displayName: finalName,
        email: newUser.email,
        photoURL: finalPhoto
      });

      await updateProfile(newUser, { displayName: finalName });
      setAuthSuccess('สมัครสมาชิกสำเร็จ!');
    } catch (err: any) {
      setAuthError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  // อัปเดตข้อมูลโปรไฟล์ (เก็บบันทึกลง Firebase Database โดยตรง)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const uid = auth.currentUser.uid;

      // บันทึกข้อมูลลง Firebase Realtime Database
      await set(ref(database, `users/${uid}`), {
        displayName: newDisplayName,
        email: auth.currentUser.email,
        photoURL: newPhotoBase64
      });

      // อัปเดต DisplayName ใน Auth ด้วย
      await updateProfile(auth.currentUser, { displayName: newDisplayName });

      // อัปเดต State สดทันที
      setUser({
        ...auth.currentUser,
        displayName: newDisplayName,
        photoURL: newPhotoBase64
      });

      setIsEditing(false);
      setAuthSuccess('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      setAuthError('ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ออกจากระบบ
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthSuccess(null);
      setAuthError(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        กำลังโหลดข้อมูล...
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
      <main style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>COMFLYY PROFILE MANAGEMENT</span>
        </div>

        {/* Notifications */}
        {authError && (
          <div style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', padding: '12px', borderRadius: '12px', fontSize: '13px', textAlign: 'center' }}>
            {authError}
          </div>
        )}
        {authSuccess && (
          <div style={{ backgroundColor: '#10b98120', color: '#34d399', border: '1px solid #10b98140', padding: '12px', borderRadius: '12px', fontSize: '13px', textAlign: 'center' }}>
            {authSuccess}
          </div>
        )}

        {/* Logged In User Profile */}
        {user ? (
          <div style={{ backgroundColor: '#151c2c', borderRadius: '22px', padding: '24px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '20px', objectFit: 'cover', border: '2px solid #6366f1' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                    👤
                  </div>
                )}
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                    {user.displayName || 'สมาชิก COMFLYY'}
                  </h1>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{user.email}</span>
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '700' }}>● Active User</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                {isEditing ? 'ยกเลิก' : '✏️ แก้ไขโปรไฟล์'}
              </button>
            </div>

            {/* Form Edit */}
            {isEditing && (
              <form onSubmit={handleUpdateProfile} style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '700' }}>แก้ไขข้อมูลส่วนตัว</span>
                
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#151c2c', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>เลือกรูปภาพจากคอมพิวเตอร์</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    style={{ width: '100%', padding: '8px', borderRadius: '10px', backgroundColor: '#151c2c', border: '1px solid #334155', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                  />
                  {newPhotoBase64 && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>ตัวอย่างรูปภาพ:</span>
                      <img src={newPhotoBase64} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #6366f1' }} />
                    </div>
                  )}
                </div>

                <button type="submit" style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}>
                  บันทึกการเปลี่ยนแปลง
                </button>
              </form>
            )}

            <button
              onClick={handleSignOut}
              style={{ backgroundColor: '#ef444415', color: '#ef4444', padding: '12px', borderRadius: '14px', border: '1px solid #ef444430', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              🚪 ออกจากระบบ (Sign Out)
            </button>
          </div>
        ) : (
          /* Login / Register */
          <div style={{ backgroundColor: '#151c2c', borderRadius: '22px', padding: '24px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
                {isRegisterMode ? '📝 สมัครสมาชิกใหม่' : '🔑 เข้าสู่ระบบ COMFLYY'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                {isRegisterMode ? 'สร้างบัญชีเพื่อบันทึกประวัติเซนเซอร์เฉพาะบุคคล' : 'กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ'}
              </p>
            </div>

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isRegisterMode && (
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    placeholder="เช่น Somchai"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>อีเมล (Email)</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>

              {isRegisterMode && (
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>เลือกรูปโปรไฟล์จากเครื่อง</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    style={{ width: '100%', padding: '8px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#94a3b8', fontSize: '12px' }}
                  />
                </div>
              )}

              <button
                type="submit"
                style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}
              >
                {isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <button
                onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(null); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                {isRegisterMode ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่ที่นี่'}
              </button>
            </div>
          </div>
        )}

        <Link href="/" style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '14px', borderRadius: '16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', textDecoration: 'none', border: '1px solid #334155' }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}