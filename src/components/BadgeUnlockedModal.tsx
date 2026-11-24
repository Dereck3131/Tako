import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

import { AmbientGlow } from '@/components/AmbientGlow';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoBadgeEmblem } from '@/components/TakoBadgeEmblem';
import { TakoMascot } from '@/components/TakoMascot';
import { TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';
import type { TakoBadge } from '@/lib/awards';
import { playSound } from '@/lib/sounds';

interface BadgeUnlockedModalProps {
  badge: TakoBadge | null;
  onClose: () => void;
}

const CELEBRATION_COPY: Record<string, string> = {
  'on-time-streak':
    'You settled on time without a single nudge. Keep your streak alive!',
  'speed-settler':
    'You recorded a payment within an hour of a split. Lightning fast!',
  'zero-nudge':
    'You settled 3 splits without a single reminder. Your friends are lucky to have you.',
  'host-most':
    'You hosted 3 splits where everyone paid. Peak dinner-table leadership.',
  'full-table':
    'You split a bill with 5 or more friends without breaking a sweat.',
  'clean-slate':
    'You owe ₱0 across every split. Clean tab, happy friends.',
  'tako-legend':
    'You unlocked all 5 badges! Your Gold Avatar Ring and Tako Legend title are now live across Tako.',
};

// 16 alternating sunburst wedges centered at (200, 260)
const SUNBURST_RAYS = Array.from({ length: 16 }, (_, i) => {
  const cx = 200;
  const cy = 260;
  const r = 560;
  const a1 = (i * 22.5 * Math.PI) / 180;
  const a2 = ((i * 22.5 + 11.25) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  return `${cx},${cy} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
});

export function BadgeUnlockedModal({ badge, onClose }: BadgeUnlockedModalProps) {
  const { palette } = useTakoTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (badge) {
      playSound('celebrate');
    }
  }, [badge]);

  if (!badge) return null;

  const celebrationBody = CELEBRATION_COPY[badge.id] ?? badge.description;

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await Share.share({
      message: `I just unlocked the "${badge.title}" badge on Tako! ${celebrationBody}`,
    }).catch(() => {});
  };

  return (
    <Modal
      visible={Boolean(badge)}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]}>
        {/* Sunburst Rays */}
        <View style={styles.sunburstWrap} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 400 844" preserveAspectRatio="xMidYMin slice">
            {SUNBURST_RAYS.map((pts, idx) => (
              <Polygon key={idx} points={pts} fill="rgba(255, 255, 255, 0.045)" />
            ))}
          </Svg>
        </View>

        {/* Confetti */}
        <View style={styles.confettiLayer} pointerEvents="none">
          <View style={[styles.confettiSquare, { top: 88, left: 120, backgroundColor: '#2EC4B6', transform: [{ rotate: '22deg' }] }]} />
          <View style={[styles.confettiDot, { top: 84, right: 118, backgroundColor: '#B9A5E8' }]} />
          <View style={[styles.confettiSquare, { top: 150, left: 40, backgroundColor: '#FF7A8A', transform: [{ rotate: '-18deg' }] }]} />
          <View style={[styles.confettiDot, { top: 132, right: 54, backgroundColor: '#2EC4B6' }]} />
          <View style={[styles.confettiSquare, { top: 230, left: 26, backgroundColor: '#B9A5E8', transform: [{ rotate: '16deg' }] }]} />
          <View style={[styles.confettiDot, { top: 242, right: 36, backgroundColor: '#FFC857' }]} />
          <View style={[styles.confettiSquare, { top: 304, left: 72, backgroundColor: '#FFC857', transform: [{ rotate: '-24deg' }] }]} />
          <View style={[styles.confettiDot, { top: 332, right: 70, backgroundColor: '#FF7A8A' }]} />
        </View>

        <View
          style={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.heroCenter}>
            <View style={styles.medalStage}>
              <AmbientGlow size={320} color="#FFFFFF" opacity={0.3} style={styles.glow} />
              <View style={styles.medalForeground}>
                <TakoBadgeEmblem id={badge.id} unlocked size={212} />
              </View>
            </View>

            <View style={styles.mascotWrap}>
              <TakoMascot state="idle" size={90} interactive={false} />
            </View>

            <View style={styles.copyWrap}>
              <Text style={[styles.eyebrow, { color: palette.coral, fontFamily: TakoFonts.black }]}>
                {badge.id === 'tako-legend'
                  ? '5/5 BADGES COMPLETE'
                  : badge.tier !== 'none'
                    ? `${badge.tier.toUpperCase()} BADGE UNLOCKED`
                    : 'BADGE UNLOCKED'}
              </Text>
              <Text style={[styles.title, { fontFamily: TakoFonts.black }]}>
                {badge.title}
              </Text>
              <Text style={[styles.body, { fontFamily: TakoFonts.regular }]}>
                {celebrationBody}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <SpringPressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                }
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Awesome!"
              style={[styles.primaryBtn, { backgroundColor: palette.coral }]}>
              <Text style={[styles.primaryText, { color: palette.plum, fontFamily: TakoFonts.black }]}>
                Awesome!
              </Text>
            </SpringPressable>

            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share badge"
              style={styles.shareBtn}>
              <Text style={[styles.shareText, { fontFamily: TakoFonts.bold }]}>
                Share badge
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  sunburstWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confettiSquare: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 3.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    justifyContent: 'space-between',
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  medalStage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    alignSelf: 'center',
    zIndex: 0,
  },
  medalForeground: {
    position: 'relative',
    zIndex: 2,
  },
  mascotWrap: {
    marginTop: 2,
  },
  copyWrap: {
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 6,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255, 246, 238, 0.78)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
  },
  shareBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
