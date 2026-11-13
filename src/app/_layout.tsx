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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthScreen } from '@/components/AuthScreen';
import { TakoSplash } from '@/components/TakoSplash';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TakoThemeProvider, useTakoTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isDark, palette } = useTakoTheme();
  const { session, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

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
      {!loading && !session ? (
        <AuthScreen />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="group/new-split"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="group/split-ready"
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
      <TakoThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </TakoThemeProvider>
    </GestureHandlerRootView>
  );
}
