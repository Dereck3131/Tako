import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

function TabIconPill({
  name,
  color,
  focused,
  surfaceAlt,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
  surfaceAlt: string;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused && !reducedMotion) {
      scale.value = 0.88;
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    }
  }, [focused, reducedMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.iconPill,
        focused && { backgroundColor: surfaceAlt },
        animStyle,
      ]}>
      <Ionicons name={name} size={20} color={color} />
    </Animated.View>
  );
}

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
            <TabIconPill
              name="receipt-outline"
              color={String(color)}
              focused={focused}
              surfaceAlt={palette.surfaceAlt}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill
              name="qr-code-outline"
              color={String(color)}
              focused={focused}
              surfaceAlt={palette.surfaceAlt}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill
              name="time-outline"
              color={String(color)}
              focused={focused}
              surfaceAlt={palette.surfaceAlt}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill
              name="person-outline"
              color={String(color)}
              focused={focused}
              surfaceAlt={palette.surfaceAlt}
            />
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
