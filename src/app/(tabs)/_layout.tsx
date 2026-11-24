import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radii } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

const TAB_ITEMS: {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { name: 'index', label: 'Splits', icon: 'receipt-outline', activeIcon: 'receipt' },
  { name: 'scan', label: 'Scan', icon: 'qr-code-outline', activeIcon: 'qr-code' },
  { name: 'activity', label: 'Activity', icon: 'time-outline', activeIcon: 'time' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function TabsLayout() {
  const { palette, isDark } = useTakoTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 14);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
      tabBar={({ state, emitter, navigateToTab }) => {
        const activeRoute = state.routes[state.index]?.name;
        if (activeRoute === 'scan') {
          return null;
        }

        return (
          <View
            pointerEvents="box-none"
            style={[styles.outerWrap, { bottom: bottomOffset }]}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
                isDark ? styles.darkShadow : styles.lightShadow,
              ]}>
              {TAB_ITEMS.map((item) => {
                const routeIndex = state.routes.findIndex((r) => r.name === item.name);
                const route = state.routes[routeIndex];
                const focused = state.index === routeIndex;
                const tint = focused ? palette.coralAccent : palette.mute;

                const onPress = () => {
                  if (!route) return;
                  const event = emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    navigateToTab(route.key);
                  }
                };

                return (
                  <Pressable
                    key={item.name}
                    onPress={onPress}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: focused }}
                    accessibilityLabel={item.label}
                    style={styles.tabItem}>
                    <Ionicons
                      name={focused ? item.activeIcon : item.icon}
                      size={24}
                      color={tint}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }}>
      <Tabs.Screen name="index" options={{ title: 'Splits' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 58,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  lightShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
    web: { boxShadow: '0 6px 20px rgba(43, 27, 61, 0.08)' },
  }),
  darkShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)' },
  }),
  tabItem: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
