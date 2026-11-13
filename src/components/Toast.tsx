import Ionicons from '@expo/vector-icons/Ionicons';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  tone?: 'default' | 'success' | 'error';
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { palette, isDark } = useTakoTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const id = Date.now();
      setToast({ ...options, id });
      timerRef.current = setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
      }, options.durationMs ?? 4200);
    },
    []
  );

  const bg =
    toast?.tone === 'error'
      ? palette.destructive
      : isDark
        ? palette.surfaceAlt
        : palette.plum;

  const iconName =
    toast?.tone === 'error'
      ? 'alert-circle-outline'
      : toast?.tone === 'success'
        ? 'checkmark-circle-outline'
        : 'sparkles-outline';

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            { bottom: Math.max(insets.bottom, 16) + 78 },
          ]}>
          <Animated.View
            key={toast.id}
            entering={reducedMotion ? undefined : FadeInDown.duration(180)}
            exiting={reducedMotion ? undefined : FadeOutDown.duration(150)}
            style={[
              styles.toast,
              {
                backgroundColor: bg,
                borderColor: isDark ? palette.border : 'transparent',
              },
            ]}>
            <Ionicons
              name={iconName}
              size={18}
              color={toast.tone === 'success' ? palette.teal : '#FFF6EE'}
            />
            <Text
              style={[styles.msg, { fontFamily: TakoFonts.bold }]}
              numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel && toast.onAction && (
              <Pressable
                onPress={() => {
                  const fn = toast.onAction;
                  hideToast();
                  fn?.();
                }}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: 'rgba(255,255,255,0.14)' },
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={[styles.actionText, { color: palette.coral, fontFamily: TakoFonts.black }]}>
                  {toast.actionLabel}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    width: '100%',
    maxWidth: 460,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.22)' },
    }),
  },
  msg: {
    flex: 1,
    color: '#FFF6EE',
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    minHeight: 32,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
  },
});
