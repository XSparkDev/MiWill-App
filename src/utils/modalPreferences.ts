import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCE_KEYS = {
  UPLOAD_WILL_WELCOME: 'modal_pref_upload_will_welcome',
  ADD_ASSET_FIRST_TIME: 'modal_pref_add_asset_first_time',
  ADD_ASSET_LINK_BENEFICIARY: 'modal_pref_add_asset_link_beneficiary',
  ADD_POLICY_FIRST_TIME: 'modal_pref_add_policy_first_time',
  ADD_POLICY_LINK_BENEFICIARY: 'modal_pref_add_policy_link_beneficiary',
  ADD_BENEFICIARY_GUIDED: 'modal_pref_add_beneficiary_guided',
} as const;

export type ModalPreferenceKey = keyof typeof PREFERENCE_KEYS;

/**
 * Check if a modal should be shown based on user preference
 */
export const shouldShowModal = async (key: ModalPreferenceKey): Promise<boolean> => {
  try {
    const preferenceKey = PREFERENCE_KEYS[key];
    const value = await AsyncStorage.getItem(preferenceKey);
    const shouldShow = value !== 'true'; // Show modal if preference is not set or is false
    console.log(`[ModalPreference] ${key}: value=${value}, shouldShow=${shouldShow}`);
    return shouldShow;
  } catch (error) {
    console.error(`Error checking modal preference for ${key}:`, error);
    return true; // Default to showing modal if there's an error
  }
};

/**
 * Save the "Don't Show Again" preference for a modal
 */
export const setDontShowAgain = async (key: ModalPreferenceKey): Promise<void> => {
  try {
    const preferenceKey = PREFERENCE_KEYS[key];
    await AsyncStorage.setItem(preferenceKey, 'true');
  } catch (error) {
    console.error(`Error saving modal preference for ${key}:`, error);
  }
};

/**
 * Reset a modal preference (for testing or settings)
 */
export const resetModalPreference = async (key: ModalPreferenceKey): Promise<void> => {
  try {
    const preferenceKey = PREFERENCE_KEYS[key];
    await AsyncStorage.removeItem(preferenceKey);
    console.log(`[ModalPreference] Reset preference for ${key}`);
  } catch (error) {
    console.error(`Error resetting modal preference for ${key}:`, error);
  }
};

/**
 * Reset all modal preferences (for testing)
 */
export const resetAllModalPreferences = async (): Promise<void> => {
  try {
    const keys = Object.values(PREFERENCE_KEYS);
    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    console.log('[ModalPreference] Reset all modal preferences');
  } catch (error) {
    console.error('Error resetting all modal preferences:', error);
  }
};

