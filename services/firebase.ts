import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARoU7ArwCC7dEHLFdn51IgsaBW6_tVT7Y",
  authDomain: "cokonotion.firebaseapp.com",
  projectId: "cokonotion",
  storageBucket: "cokonotion.firebasestorage.app",
  messagingSenderId: "749290575178",
  appId: "1:749290575178:web:efef1695c0c7a6b6bb1db3",
  measurementId: "G-30BXJG55MG"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// ✅ Inicializar Auth (sin persistencia personalizada por ahora)
const auth = getAuth(app);

// Inicializar Firestore
const db = getFirestore(app);

export { auth, db };