import React from 'react';
import { Tabs } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Border, Colors, Motion, Radii, TouchTarget } from '../../src/constants/theme';
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
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
      <View style={styles.bar}>
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
                isFocused && styles.tabPillActive,
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
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
  },
  tabPill: {
    minHeight: TouchTarget.minSize,
    minWidth: 68,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  tabPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
