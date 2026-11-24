import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthScreen } from '@/components/AuthScreen';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { TakoSplash } from '@/components/TakoSplash';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TakoThemeProvider, useTakoTheme } from '@/context/ThemeContext';
import { isLegendPreviewEnabled } from '@/lib/awards';

SplashScreen.preventAutoHideAsync().catch(() => {});
isLegendPreviewEnabled();

function isOnboardingPreview(): boolean {
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('onboardingPreview') === '1';
  }
  return false;
}

function RootNavigator() {
  const { isDark, palette } = useTakoTheme();
  const { session, loading, passwordRecoveryPending } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [introChecked, setIntroChecked] = useState(false);
  const [needsIntro, setNeedsIntro] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(isOnboardingPreview);

  const userId = session?.user?.id ?? null;
  const setupChecked = Boolean(userId && checkedUserId === userId);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('tako_intro_v1')
      .then((val) => {
        if (!mounted) return;
        setNeedsIntro(val !== 'done');
        setIntroChecked(true);
      })
      .catch(() => {
        if (!mounted) return;
        setNeedsIntro(false);
        setIntroChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOnboardingPreview() || !userId) return;
    let mounted = true;
    const key = `tako_setup_v1_${userId}`;
    AsyncStorage.getItem(key)
      .then((val) => {
        if (!mounted) return;
        setNeedsSetup(val !== 'done');
        setCheckedUserId(userId);
      })
      .catch(() => {
        if (!mounted) return;
        setNeedsSetup(false);
        setCheckedUserId(userId);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleIntroComplete = async () => {
    await AsyncStorage.setItem('tako_intro_v1', 'done').catch(() => {});
    setNeedsIntro(false);
  };

  const handleSetupComplete = async () => {
    if (userId) {
      await AsyncStorage.setItem(`tako_setup_v1_${userId}`, 'done').catch(() => {});
    }
    setNeedsSetup(false);
  };

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: palette.bg,
      card: palette.surface,
      text: palette.ink,
      border: palette.border,
      primary: palette.coralAccent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isOnboardingPreview() && needsSetup ? (
        <OnboardingFlow phase="intro" onComplete={handleSetupComplete} />
      ) : !loading && (!session || passwordRecoveryPending) ? (
        introChecked && needsIntro ? (
          <OnboardingFlow phase="intro" onComplete={handleIntroComplete} />
        ) : (
          <AuthScreen />
        )
      ) : session && setupChecked && needsSetup ? (
        <OnboardingFlow phase="setup" onComplete={handleSetupComplete} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="alerts" options={{ headerShown: false }} />
          <Stack.Screen name="join/[code]" options={{ headerShown: false }} />
          <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="group/new-split"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="group/review-items"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/split-ready"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/everyone-paid"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/join-split"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/who-had-what"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/settle-up"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/all-settled"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="group/add-expense"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      )}
      {showSplash && <TakoSplash onFinish={() => setShowSplash(false)} />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TakoThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ToastProvider>
        </TakoThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
