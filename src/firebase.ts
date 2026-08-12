import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase using the JSON config file directly
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target the active database instance
export const db = getFirestore(firebaseApp, "ai-studio-d4de3759-a550-402d-907d-6317961785af");
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

export function handleFirestoreError(error: unknown) {
  console.warn("Firestore Warning:", error);
}
