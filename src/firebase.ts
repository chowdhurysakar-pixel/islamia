import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const metaEnv = (import.meta as any).env || {};

const envConfig: FirebaseConfig = {
  apiKey: (metaEnv.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (metaEnv.VITE_FIREBASE_APP_ID || "").trim(),
  firestoreDatabaseId: (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "").trim()
};

// ডাটাবেজ আইডি সরাসরি নিশ্চিত করা হলো
const TARGET_DB_ID = envConfig.firestoreDatabaseId || "ai-studio-d4de3759-a550-402d-907d-6317961785af";

export const firebaseApp = getApps().length === 0 ? initializeApp(envConfig) : getApp();
export const db = getFirestore(firebaseApp, TARGET_DB_ID);
export const auth = getAuth(firebaseApp);
export const isFirebaseAvailable = true;

export function initFirebase() {
  return true;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn("Firestore Operation Warning:", error);
}
