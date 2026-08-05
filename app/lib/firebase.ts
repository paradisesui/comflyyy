import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCmmMKOVHK5K9T6TwpajxwzPSHeyb866T1A",
  authDomain: "room-envi-test.firebaseapp.com",
  databaseURL: "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "room-envi-test",
  storageBucket: "room-envi-test.appspot.com",
  messagingSenderId: "968477700610",
  appId: "1:968477700610:web:53862979e2ced138802d1b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);
export const auth = getAuth(app);