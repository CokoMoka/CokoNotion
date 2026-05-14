// services/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyARoU7ArwCC7dEHLFdn51IgsaBW6_tVT7Y",
  authDomain: "cokonotion.firebaseapp.com",
  projectId: "cokonotion",
  storageBucket: "cokonotion.firebasestorage.app",
  messagingSenderId: "749290575178",
  appId: "1:749290575178:web:efef1695c0c7a6b6bb1db3",
  measurementId: "G-30BXJG55MG",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;