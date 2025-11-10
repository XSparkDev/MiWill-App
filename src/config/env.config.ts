import {
  LOCAL_STORAGE_ROOT,
  APP_NAME,
  APP_VERSION,
  APP_ENVIRONMENT,
  MAX_FILE_SIZE_MB,
  POL_VERIFICATION_TIMEOUT_DAYS,
  ESCALATION_RETRY_MAX_ATTEMPTS,
} from '@env';

const getEnvValue = (value: string | undefined, fallbackKey: string): string | undefined => {
  if (value && value.trim().length > 0) {
    return value;
  }
  if (typeof process !== 'undefined' && process.env && process.env[fallbackKey]) {
    const fallback = process.env[fallbackKey];
    if (fallback) {
      console.warn(`[env.config] Falling back to process.env.${fallbackKey}`);
      return fallback;
    }
  }
  return undefined;
};

const localStorageRoot = getEnvValue(LOCAL_STORAGE_ROOT, 'LOCAL_STORAGE_ROOT');
const appName = getEnvValue(APP_NAME, 'APP_NAME');
const appVersion = getEnvValue(APP_VERSION, 'APP_VERSION');
const appEnvironment = getEnvValue(APP_ENVIRONMENT, 'APP_ENVIRONMENT');
const maxFileSize = getEnvValue(MAX_FILE_SIZE_MB, 'MAX_FILE_SIZE_MB');
const verificationTimeout = getEnvValue(POL_VERIFICATION_TIMEOUT_DAYS, 'POL_VERIFICATION_TIMEOUT_DAYS');
const escalationRetry = getEnvValue(ESCALATION_RETRY_MAX_ATTEMPTS, 'ESCALATION_RETRY_MAX_ATTEMPTS');

// Environment configuration
export const config = {
  app: {
    name: appName || 'MiWill',
    version: appVersion || '1.0.0',
    environment: appEnvironment || 'development',
  },
  storage: {
    localRoot: localStorageRoot || '/Users/Desktop/MiWill-App/storage',
    maxFileSizeMB: parseInt(maxFileSize || '50', 10),
  },
  verification: {
    timeoutDays: parseInt(verificationTimeout || '7', 10),
    maxRetryAttempts: parseInt(escalationRetry || '3', 10),
  },
};

export default config;

