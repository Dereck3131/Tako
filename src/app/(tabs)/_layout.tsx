import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { palette, isDark } = useTakoTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 6;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: palette.coralAccent,
        tabBarInactiveTintColor: palette.mute,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomOffset,
          height: 66,
          borderRadius: 33,
          backgroundColor: palette.surface,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: palette.border,
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 8,
          shadowColor: isDark ? '#000' : '#2B1B3D',
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        tabBarItemStyle: {
          borderRadius: 26,
          marginHorizontal: 2,
          minHeight: 48,
        },
        tabBarLabelStyle: {
          fontFamily: TakoFonts.bold,
          fontSize: 11,
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Splits',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: palette.surfaceAlt },
              ]}>
              <Ionicons name="receipt-outline" size={20} color={String(color)} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: palette.surfaceAlt },
              ]}>
              <Ionicons name="qr-code-outline" size={20} color={String(color)} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: palette.surfaceAlt },
              ]}>
              <Ionicons name="time-outline" size={20} color={String(color)} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: palette.surfaceAlt },
              ]}>
              <Ionicons name="person-outline" size={20} color={String(color)} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
