import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Border, Colors, Motion, Radii, TouchTarget } from '../../src/constants/theme';
import { MotionTokens } from '../../src/constants/motion';
import { useReducedMotion } from '../../src/components/MotionPrimitives';
import {
  ActivityIcon,
  HomeIcon,
  ListIcon,
  UserIcon,
} from '../../src/components/Icons';

interface NeoTabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, { options: { tabBarLabel?: unknown; title?: string } }>;
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

function NeoTabBar({ state, descriptors, navigation }: NeoTabBarProps) {
  const reducedMotion = useReducedMotion();
  const [barWidth, setBarWidth] = useState(0);
  const routeCount = Math.max(state.routes.length, 1);
  const horizontalPad = 10;
  const innerWidth = Math.max(0, barWidth - horizontalPad * 2);
  const slotWidth = innerWidth / routeCount;
  const pillWidth = Math.min(76, Math.max(60, slotWidth - 8));

  const pillX = useSharedValue(0);

  useEffect(() => {
    if (slotWidth <= 0) return;
    const targetX = horizontalPad + state.index * slotWidth + (slotWidth - pillWidth) / 2;
    if (reducedMotion) {
      pillX.value = targetX;
    } else {
      pillX.value = withSpring(targetX, MotionTokens.spring.tabPill);
    }
  }, [pillWidth, pillX, reducedMotion, slotWidth, state.index]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: slotWidth > 0 ? 1 : 0,
    width: pillWidth,
    transform: [{ translateX: pillX.value }],
  }));

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
      <View style={styles.bar} onLayout={onBarLayout}>
        {/* Gliding active pill */}
        <Animated.View
          pointerEvents="none"
          style={[styles.glidingPill, pillStyle]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconColor = isFocused ? Colors.primary : Colors.textSecondary;

          const renderIcon = () => {
            switch (route.name) {
              case 'index':
                return <HomeIcon size={21} color={iconColor} strokeWidth={2.1} />;
              case 'items':
                return <ListIcon size={21} color={iconColor} strokeWidth={2.1} />;
              case 'activity':
                return (
                  <ActivityIcon size={21} color={iconColor} strokeWidth={2.1} />
                );
              case 'me':
              default:
                return <UserIcon size={21} color={iconColor} strokeWidth={2.1} />;
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.tabPill,
                pressed && { transform: [{ scale: Motion.pressScale }] },
              ]}
            >
              {renderIcon()}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  { color: isFocused ? Colors.primary : Colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  const reducedMotion = useReducedMotion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? 'none' : 'fade',
      }}
      tabBar={(props) => <NeoTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Room' }} />
      <Tabs.Screen name="items" options={{ title: 'Items' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeWrap: {
    backgroundColor: Colors.card,
    borderTopWidth: Border.width,
    borderTopColor: Colors.border,
  },
  bar: {
    height: 70,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    position: 'relative',
  },
  glidingPill: {
    position: 'absolute',
    left: 0,
    height: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
  },
  tabPill: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
