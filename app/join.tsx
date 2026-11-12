import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Colors,
  Motion,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from '../src/constants/theme';
import { NeoButton, NeoCard } from '../src/components/NeoUI';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { QRCodeVector } from '../src/components/QRCodeVector';
import { useReducedMotion } from '../src/components/MotionPrimitives';
import { useRoomStore } from '../src/store/roomStore';

const PIN_DIGITS = ['4', '8', '2', '1'];

export default function JoinQRModal() {
  const router = useRouter();
  const { selectedAnimal } = useRoomStore();
  const reducedMotion = useReducedMotion();
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(sheetAnim, {
      toValue: 1,
      duration: reducedMotion ? 120 : Motion.durationNormal,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();
    return () => anim.stop();
  }, [sheetAnim, reducedMotion]);

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [reducedMotion ? 0 : 28, 0],
  });

  return (
    <View style={styles.root}>
      {/* Dimmed Backdrop */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close join modal"
        style={styles.dimOverlay}
        onPress={() => router.back()}
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          Shadows.hero,
          {
            opacity: sheetAnim,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.handle} />
        <ScrollView
          contentContainerStyle={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Point your phone\nto join this bill'}</Text>

          <View style={styles.qrCenter}>
            <QRCodeVector size={208} />
          </View>

          {/* PIN Digits */}
          <View style={styles.pinRow}>
            <Text style={styles.pinLabel}>PIN</Text>
            {PIN_DIGITS.map((digit, idx) => (
              <NeoCard
                key={idx}
                borderRadius={Radii.md}
                contentStyle={styles.pinDigitBox}
              >
                <Text style={styles.pinDigitText}>{digit}</Text>
              </NeoCard>
            ))}
          </View>

          {/* In the room list */}
          <View style={styles.guestSection}>
            <View style={styles.guestHeader}>
              <Text style={styles.guestSectionTitle}>In the room</Text>
              <Badge label="Live" variant="emerald" />
            </View>

            <View style={styles.guestRow}>
              <View style={styles.avatarShrink}>
                <MemojiAvatar id={selectedAnimal} size={38} />
              </View>
              <View style={styles.guestTextCol}>
                <Text style={styles.guestName} numberOfLines={1}>
                  You
                </Text>
                <Text style={styles.guestSub} numberOfLines={1}>
                  Host · iPhone
                </Text>
              </View>
              <Badge label="Connected" variant="emerald" />
            </View>

            <View style={styles.guestRow}>
              <View style={styles.avatarShrink}>
                <MemojiAvatar id="mia" size={38} />
              </View>
              <View style={styles.guestTextCol}>
                <Text style={styles.guestName} numberOfLines={1}>
                  Mia
                </Text>
                <Text style={styles.guestSub} numberOfLines={1}>
                  Just joined
                </Text>
              </View>
              <Badge label="Connected" variant="emerald" />
            </View>

            <View style={styles.guestRow}>
              <View style={styles.avatarShrink}>
                <MemojiAvatar id="aly" size={38} />
              </View>
              <View style={styles.guestTextCol}>
                <Text style={styles.guestName} numberOfLines={1}>
                  Aly
                </Text>
                <Text style={styles.guestSub} numberOfLines={1}>
                  Scanning code…
                </Text>
              </View>
              <Badge label="Joining" variant="amber" />
            </View>
          </View>

          <View style={{ marginTop: Spacing.xl }}>
            <NeoButton
              label="Done"
              onPress={() => router.back()}
              backgroundColor={Colors.primary}
              textColor="#FFFFFF"
              height={50}
              fontSize={16}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimOverlay: {
    ...StyleSheet.flatten(StyleSheet.absoluteFill),
    backgroundColor: 'rgba(20, 18, 58, 0.35)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
    maxHeight: '90%',
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.screenTitle,
    textAlign: 'center',
  },
  qrCenter: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  pinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  pinLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  pinDigitBox: {
    width: 48,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigitText: {
    ...Typography.tabular,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.ink,
  },
  guestSection: {
    marginTop: Spacing.xl,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  guestSectionTitle: {
    ...Typography.sectionTitle,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 8,
  },
  avatarShrink: {
    flexShrink: 0,
  },
  guestTextCol: {
    flex: 1,
    minWidth: 0,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  guestSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
