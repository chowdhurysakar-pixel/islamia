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
import { getFirestore, collection, doc, query, where, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';

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

export function initFirebase(config?: FirebaseConfig) {
  // Load and check from Vite environment variables first
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

  const finalConfig = (envConfig.apiKey && envConfig.apiKey !== 'placeholder' && !envConfig.apiKey.includes('MY_'))
    ? envConfig
    : (config || {} as FirebaseConfig);

  if (finalConfig && finalConfig.apiKey && finalConfig.apiKey !== 'placeholder' && !finalConfig.apiKey.includes('MY_')) {
    try {
      if (getApps().length === 0) {
        firebaseApp = initializeApp(finalConfig);
      } else {
        firebaseApp = getApp();
      }

      const requestedDbId = finalConfig.firestoreDatabaseId || config?.firestoreDatabaseId;
      try {
        if (requestedDbId && requestedDbId !== '(default)') {
          dbInstance = getFirestore(firebaseApp, requestedDbId);
        } else {
          dbInstance = getFirestore(firebaseApp);
        }
      } catch (dbErr) {
        console.warn("Falling back to default Firestore database instance:", dbErr);
        dbInstance = getFirestore(firebaseApp);
      }

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
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  
  // For network connection drops, offline status, or transient unavailable issues, log a warning softly
  if (
    errMsg.includes('unavailable') || 
    errMsg.includes('offline') || 
    errMsg.includes('Could not reach Cloud Firestore') ||
    errMsg.includes('failed-precondition') ||
    operationType === OperationType.GET ||
    operationType === OperationType.LIST
  ) {
    console.warn('Firestore Network/Cache Info: ', JSON.stringify(errInfo));
    return errInfo;
  }

  console.error('Firestore Error Detailed Logs: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
initFirebase();
 apiKey: "AIzaSyBDhtnThyEJOeZYs4GPnQgaK1mgAcSVLcI",
  authDomain: "gen-lang-client-0139585657.firebaseapp.com",
  projectId: "gen-lang-client-0139585657",
  storageBucket: "gen-lang-client-0139585657.firebasestorage.app",
  messagingSenderId: "24979260879",
  appId: "1:24979260879:web:66e8da41201bda29d3beba"
};
export { firebaseApp, dbInstance as db, authInstance as auth, isFirebaseAvailable };
