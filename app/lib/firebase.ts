import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY, // หรือ API Key ของ Firebase คุณ
  authDomain: "room-envi-test.firebaseapp.com",
  databaseURL: "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "room-envi-test",
  storageBucket: "room-envi-test.appspot.com",
  messagingSenderId: "1071191319714",
  appId: "1:1071191319714:web:80c7493fa5954a107384c2"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };