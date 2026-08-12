import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDhtnThyEJOeZYs4GPnQgaK1mgAcSVLcI",
  authDomain: "gen-lang-client-0139585657.firebaseapp.com",
  projectId: "gen-lang-client-0139585657",
  storageBucket: "gen-lang-client-0139585657.firebasestorage.app",
  messagingSenderId: "24979260879",
  appId: "1:24979260879:web:66e8da41201bda29d3beba"
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect specifically to your named Firestore database
export const db = getFirestore(
  firebaseApp, 
  "ai-studio-remixislamiagues-3281db5c-c7cb-4537-998c-2b87b8a55c0c"
);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseAvailable = true;

export { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};
