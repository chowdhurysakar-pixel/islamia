/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { getFirestore, collection, doc, query, where, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';

// We define a stub interface to avoid compilation errors if config is empty.
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

let firebaseApp: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let isFirebaseAvailable = false;

// Attempt to load and initialize Firebase
try {
  // We can dynamically check if there's a real config or if we should use fallback
  // In React/Vite, we can import it using dynamic import or standard import
  // To protect compiler against a missing JSON file, we can require/import it safely
  // If we write a placeholder json file first, it prevents compile errors.
} catch (e) {
  console.warn("Firebase not initialized yet. Running in high-fidelity Sandbox Sandbox Mode.", e);
}

export function initFirebase(config: FirebaseConfig) {
  // Load and check from Vite environment variables first
  const metaEnv = (import.meta as any).env || {};
  const envConfig: FirebaseConfig = {
    apiKey: (metaEnv.VITE_FIREBASE_API_KEY || "").trim(),
    authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
    projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID || "").trim(),
    storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
    messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
    appId: (metaEnv.VITE_FIREBASE_APP_ID || "").trim(),
    firestoreDatabaseId: (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || config?.firestoreDatabaseId || "(default)").trim()
  };

  const finalConfig = (envConfig.apiKey && envConfig.apiKey !== 'placeholder' && !envConfig.apiKey.includes('MY_'))
    ? envConfig
    : config;

  if (finalConfig && finalConfig.apiKey && finalConfig.apiKey !== 'placeholder' && !finalConfig.apiKey.includes('MY_')) {
    try {
      if (getApps().length === 0) {
        firebaseApp = initializeApp(finalConfig);
      } else {
        firebaseApp = getApp();
      }
      dbInstance = getFirestore(firebaseApp, finalConfig.firestoreDatabaseId || '(default)');
      authInstance = getAuth(firebaseApp);
      isFirebaseAvailable = true;
      console.log("Firebase Successfully Connected using live credentials!", finalConfig.projectId);
      return true;
    } catch (err) {
      console.error("Failed to initialize Firebase with provided config:", err);
    }
  }
  return false;
}

// Error Handler following the 3rd guidelines rule from standard firebase integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Logs: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { firebaseApp, dbInstance as db, authInstance as auth, isFirebaseAvailable };
