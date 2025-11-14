import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AddAssetScreen from '../screens/AddAssetScreen';
import AddPolicyScreen from '../screens/AddPolicyScreen';
import AddBeneficiaryScreen from '../screens/AddBeneficiaryScreen';
import UploadWillScreen from '../screens/UploadWillScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import DocumentsContactsScreen from '../screens/DocumentsContactsScreen';
import SecurityPrivacyScreen from '../screens/SecurityPrivacyScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import VerificationHistoryScreen from '../screens/VerificationHistoryScreen';
import ExecutorContactsScreen from '../screens/ExecutorContactsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import TwoFactorSettingsScreen from '../screens/TwoFactorSettingsScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import UpdateAttorneyScreen from '../screens/UpdateAttorneyScreen';
import UpdateExecutorScreen from '../screens/UpdateExecutorScreen';

export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  AddAsset: undefined;
  AddPolicy: undefined;
  AddBeneficiary: undefined;
  UploadWill: undefined;
  UpdateProfile: undefined;
  UpdateAttorney: undefined;
  UpdateExecutor: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  DocumentsContacts: undefined;
  SecurityPrivacy: undefined;
  Support: undefined;
  About: undefined;
  NotificationPreferences: undefined;
  VerificationHistory: undefined;
  ExecutorContacts: undefined;
  PrivacySettings: undefined;
  TwoFactorSettings: undefined;
  TermsConditions: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  // No auth check for now - just navigation
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AddAsset" component={AddAssetScreen} />
      <Stack.Screen name="AddPolicy" component={AddPolicyScreen} />
      <Stack.Screen name="AddBeneficiary" component={AddBeneficiaryScreen} />
      <Stack.Screen name="UploadWill" component={UploadWillScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="UpdateAttorney" component={UpdateAttorneyScreen} />
      <Stack.Screen name="UpdateExecutor" component={UpdateExecutorScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="DocumentsContacts" component={DocumentsContactsScreen} />
      <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacyScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="VerificationHistory" component={VerificationHistoryScreen} />
      <Stack.Screen name="ExecutorContacts" component={ExecutorContactsScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="TwoFactorSettings" component={TwoFactorSettingsScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

