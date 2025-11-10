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
  Settings: undefined;
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
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

