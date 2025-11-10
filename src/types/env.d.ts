// Declare environment variables provided by react-native-dotenv
// This allows TypeScript to resolve imports from '@env'
declare module '@env' {
  // Firebase
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;

  // App / Local storage
  export const LOCAL_STORAGE_ROOT: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const APP_ENVIRONMENT: string;

  // Settings
  export const MAX_FILE_SIZE_MB: string;
  export const POL_VERIFICATION_TIMEOUT_DAYS: string;
  export const ESCALATION_RETRY_MAX_ATTEMPTS: string;
}
