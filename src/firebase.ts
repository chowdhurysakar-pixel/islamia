/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

let firebaseApp: FirebaseApp;
let db: Firestore;
let auth: Auth;
let isFirebaseAvailable = false;

try {
  if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'placeholder' && !firebaseConfig.apiKey.includes('MY_')) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Critical: Connect to specific database if provided, or default
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
    
    auth = getAuth(firebaseApp);
    isFirebaseAvailable = true;
    console.log("Firebase Connected successfully to:", firebaseConfig.projectId, firebaseConfig.firestoreDatabaseId);
  } else {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApp();
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  }
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

export function initFirebase(_customConfig?: FirebaseConfig): boolean {
  return isFirebaseAvailable;
}

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
  const currentAuth = auth;
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
    errMsg.includes('the client is offline') ||
    errMsg.includes('Failed to get document because the client is offline') ||
    operationType === OperationType.GET ||
    operationType === OperationType.LIST
  ) {
    console.warn('Firestore Network/Cache Notice: ', JSON.stringify(errInfo));
    return errInfo;
  }

  console.error('Firestore Error Detailed Logs: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { firebaseApp, db, auth, isFirebaseAvailable };
