import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { TakoColors, type TakoPalette } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
  palette: TakoPalette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function TakoThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  const isDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      isDark,
      palette: isDark ? TakoColors.dark : TakoColors.light,
    }),
    [preference, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTakoTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTakoTheme must be used inside TakoThemeProvider');
  }
  return ctx;
}
