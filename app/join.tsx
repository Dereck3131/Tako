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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Border,
  Colors,
  Motion,
  Radii,
  Spacing,
  Typography,
} from '../src/constants/theme';
import { TakoMascot } from '../src/components/TakoMascot';
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
      {/* Blue Header Band + Dimmed Backdrop */}
      <View style={styles.blueTopBand} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close join modal"
        style={styles.dimOverlay}
        onPress={() => router.back()}
      />

      {/* Centered Tako Mascot */}
      <SafeAreaView pointerEvents="none" style={styles.takoSafe}>
        <View style={styles.takoCenter}>
          <TakoMascot size={104} />
        </View>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: sheetAnim,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Point your phone\nto join this bill'}</Text>

          <View style={styles.qrCenter}>
            <QRCodeVector size={216} />
          </View>

          {/* PIN Digits */}
          <View style={styles.pinRow}>
            <Text style={styles.pinLabel}>PIN</Text>
            {PIN_DIGITS.map((digit, idx) => (
              <NeoCard
                key={idx}
                borderRadius={Radii.md}
                shadowOffset={3}
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

          <View style={{ marginTop: 18 }}>
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
    backgroundColor: Colors.background,
  },
  blueTopBand: {
    height: 200,
    backgroundColor: Colors.primary,
    borderBottomWidth: Border.width,
    borderBottomColor: Colors.ink,
  },
  dimOverlay: {
    ...StyleSheet.flatten(StyleSheet.absoluteFill),
    backgroundColor: 'rgba(20, 18, 58, 0.55)',
  },
  takoSafe: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  takoCenter: {
    alignItems: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 118,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
    borderWidth: Border.width,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    zIndex: 3,
  },
  sheetScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 30,
    color: Colors.ink,
    textAlign: 'center',
  },
  qrCenter: {
    alignItems: 'center',
    marginTop: 14,
  },
  pinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: 18,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
    marginRight: 2,
  },
  pinDigitBox: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigitText: {
    ...Typography.tabular,
    fontSize: 30,
    fontWeight: '900',
    color: Colors.ink,
  },
  guestSection: {
    marginTop: 18,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
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
    fontWeight: '800',
    color: Colors.ink,
  },
  guestSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
