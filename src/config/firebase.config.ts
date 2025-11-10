import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from '@env';

const getEnvValue = (value: string | undefined, fallbackKey: string): string | undefined => {
  if (value && value.trim().length > 0) {
    return value;
  }
  if (typeof process !== 'undefined' && process.env && process.env[fallbackKey]) {
    const fallback = process.env[fallbackKey];
    if (fallback) {
      console.warn(`[firebase.config] Falling back to process.env.${fallbackKey}`);
      return fallback;
    }
  }
  return undefined;
};

const apiKey = getEnvValue(FIREBASE_API_KEY, 'FIREBASE_API_KEY');
const authDomain = getEnvValue(FIREBASE_AUTH_DOMAIN, 'FIREBASE_AUTH_DOMAIN');
const projectId = getEnvValue(FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID');
const storageBucket = getEnvValue(FIREBASE_STORAGE_BUCKET, 'FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnvValue(FIREBASE_MESSAGING_SENDER_ID, 'FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnvValue(FIREBASE_APP_ID, 'FIREBASE_APP_ID');
const measurementId = getEnvValue(FIREBASE_MEASUREMENT_ID, 'FIREBASE_MEASUREMENT_ID');

const requiredFirebaseEnv = {
  FIREBASE_API_KEY: apiKey,
  FIREBASE_AUTH_DOMAIN: authDomain,
  FIREBASE_PROJECT_ID: projectId,
  FIREBASE_APP_ID: appId,
  FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  FIREBASE_STORAGE_BUCKET: storageBucket,
};

const missingEnvVars = Object.entries(requiredFirebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  const errorMessage =
    `[firebase.config] Missing Firebase environment variables: ${missingEnvVars.join(', ')}. ` +
    'Create a .env file with your Firebase web credentials (see SETUP_INSTRUCTIONS.md).';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Firebase configuration
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

if (__DEV__) {
  console.log('[firebase.config] Firebase project', {
    projectId,
    appId,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 8)}…` : 'missing',
  });
}

// Initialize Firebase
let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage | null = null;

if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  
  // Only initialize storage if bucket is configured
  if (FIREBASE_STORAGE_BUCKET) {
    storageInstance = getStorage(appInstance);
  }
} else {
  appInstance = getApps()[0];
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  if (FIREBASE_STORAGE_BUCKET) {
    storageInstance = getStorage(appInstance);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export default appInstance;

