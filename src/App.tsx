import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import AppNavigator from './navigation/AppNavigator';

const SPLASH_DELAY_MS = 2000;

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (error) {
        console.warn('[SplashScreen] preventAutoHideAsync failed', error);
      } finally {
        timeout = setTimeout(() => setIsAppReady(true), SPLASH_DELAY_MS);
      }
    };

    prepare();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      await SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

