import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ค่า Config จาก Firebase ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyCmmMKOVHSK9T6TwpajxwzPSHeyb866T1A",
  authDomain: "room-envi-test.firebaseapp.com",
  databaseURL: "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "room-envi-test",
  storageBucket: "room-envi-test.firebasestorage.app",
  messagingSenderId: "968477700610",
  appId: "1:968477700610:web:53862979e2ced138802d1b",
  measurementId: "G-TGQ0TQ3KDP"
};

// ป้องกันการ Initialize ซ้ำใน Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ส่งออกตัวแปร database ออกไปให้หน้าอื่นดึงไปใช้
export const database = getDatabase(app);