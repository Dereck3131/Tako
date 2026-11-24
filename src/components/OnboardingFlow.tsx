import Ionicons from '@expo/vector-icons/Ionicons';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { FieldError } from '@/components/FieldError';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { profileNameSchema } from '@/lib/validation';

const AVATAR_SWATCHES = ['#FF7A8A', '#2EC4B6', '#B9A5E8', '#FFC857', '#F5D6BA'] as const;

const DEMO_ITEMS = [
  {
    name: 'Ramen ×2',
    price: '₱680',
    active: [true, false, true, false],
  },
  {
    name: 'Chashu bowl ×3',
    price: '₱960',
    active: [true, true, false, true],
  },
  {
    name: 'Matcha tea ×4',
    price: '₱400',
    active: [true, true, true, true],
  },
] as const;

const DEMO_PEOPLE = [
  { label: 'Y', color: '#FF7A8A', ink: '#FFFFFF' },
  { label: 'M', color: '#2EC4B6', ink: '#FFFFFF' },
  { label: 'K', color: '#B9A5E8', ink: '#FFFFFF' },
  { label: 'J', color: '#F5D6BA', ink: '#2B1B3D' },
] as const;

const LESSON_STEPS: {
  num: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  sub: string;
}[] = [
  {
    num: '1',
    icon: 'add-circle-outline',
    color: '#FF7A8A',
    title: 'Create a split room',
    sub: 'Name the bill & add items',
  },
  {
    num: '2',
    icon: 'qr-code-outline',
    color: '#FFC857',
    title: 'Share the QR',
    sub: 'Friends scan and join',
  },
  {
    num: '3',
    icon: 'hand-left-outline',
    color: '#B9A5E8',
    title: 'Pick your items',
    sub: 'Tap what you ordered',
  },
  {
    num: '4',
    icon: 'checkmark-circle-outline',
    color: '#2EC4B6',
    title: 'Record & settle',
    sub: 'Log where you paid',
  },
];

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function OnboardingDot({ active }: { active: boolean }) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(active ? 20 : 6);

  useEffect(() => {
    const target = active ? 20 : 6;
    if (reducedMotion) {
      width.set(target);
    } else {
      width.set(withTiming(target, { duration: 220, easing: EASE_OUT }));
    }
  }, [active, reducedMotion, width]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.get(),
    backgroundColor: active ? palette.ink : palette.border,
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

interface OnboardingFlowProps {
  phase?: 'intro' | 'setup';
  onComplete: () => void;
}

export function OnboardingFlow({ phase = 'intro', onComplete }: OnboardingFlowProps) {
  const { palette, isDark } = useTakoTheme();
  const { user, profile, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [, requestPermission] = useCameraPermissions();
  const cardElevation = getCardElevation(isDark);

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(phase === 'setup' ? 5 : 0);
  const [cameraDeniedView, setCameraDeniedView] = useState(false);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarColor, setAvatarColor] = useState<string>(
    profile?.avatar_color || AVATAR_SWATCHES[0]
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initial = (displayName || profile?.display_name || user?.email || 'Y')
    .trim()
    .charAt(0)
    .toUpperCase();

  const tapLight = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleFinishProfile = async () => {
    const trimmed = displayName.trim();
    if (trimmed) {
      const parsed = profileNameSchema.safeParse(trimmed);
      if (!parsed.success) {
        setNameError(parsed.error.issues[0]?.message ?? 'Display name must be 1–30 characters.');
        return;
      }
      setSaving(true);
      await updateProfile({
        display_name: parsed.data,
        avatar_color: avatarColor,
      });
      setSaving(false);
    } else {
      setSaving(true);
      await updateProfile({
        avatar_color: avatarColor,
      });
      setSaving(false);
    }
    setNameError(null);
    tapLight();
    setCameraDeniedView(false);
    setStep(6);
  };

  const handleCameraContinue = async () => {
    tapLight();
    if (Platform.OS === 'web') {
      onComplete();
      return;
    }
    const res = await requestPermission();
    if (res.granted) {
      onComplete();
    } else {
      setCameraDeniedView(true);
    }
  };

  // Step 6b: Camera is off (dark plum fallback)
  if (step === 6 && cameraDeniedView) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]}>
        <View
          style={[
            styles.cameraOffWrap,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.cameraOffCenter}>
            <View style={styles.cameraMascotWrap}>
              <TakoMascot state="idle" size={128} interactive={false} />
              <View style={styles.cameraOffBadge}>
                <Ionicons name="videocam-off-outline" size={18} color={palette.coral} />
              </View>
            </View>
            <Text style={[styles.cameraOffTitle, { fontFamily: TakoFonts.black }]}>
              Camera is off
            </Text>
            <Text style={[styles.cameraOffBody, { fontFamily: TakoFonts.regular }]}>
              Turn on camera access in Settings to scan QR codes and receipts. You can still join
              with a code.
            </Text>
          </View>

          <View style={styles.cameraOffActions}>
            <SpringPressable
              onPress={() => Linking.openSettings().catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              style={[styles.coralBtn, { backgroundColor: palette.coral }]}>
              <Text style={[styles.coralBtnText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Open Settings
              </Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => {
                onComplete();
                router.replace('/(tabs)/scan');
              }}
              accessibilityRole="button"
              accessibilityLabel="Enter code instead"
              style={styles.outlinePlumBtn}>
              <Text style={[styles.outlinePlumText, { fontFamily: TakoFonts.bold }]}>
                Enter code instead
              </Text>
            </SpringPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Step 6a: Let Tako use your camera
  if (step === 6) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <View
          style={[
            styles.cameraAskWrap,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.cameraAskTop}>
            <Pressable
              onPress={() => setStep(5)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={[styles.circleBackBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Ionicons name="chevron-back" size={20} color={palette.ink} />
            </Pressable>
            <Pressable
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Skip
              </Text>
            </Pressable>
          </View>

          <View style={styles.cameraAskCenter}>
            <View style={[styles.cameraCircle, { backgroundColor: palette.coralSoft }]}>
              <Ionicons name="camera-outline" size={32} color={palette.coralAccent} />
            </View>
            <Text style={[styles.cameraAskTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Let Tako use your camera
            </Text>
            <Text style={[styles.cameraAskBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              We use it to scan split QR codes and receipts. Nothing is saved without your say-so.
            </Text>
          </View>

          <PrimaryButton label="Continue" onPress={handleCameraContinue} />
        </View>
      </SafeAreaView>
    );
  }

  // Step 0: Splitting 101 Chalkboard Welcome
  if (step === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <View
          style={[
            styles.welcomeWrap,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          {/* Top Bar */}
          <View style={styles.lessonTopBar}>
            <Text style={[styles.lessonWordmark, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              tako
            </Text>
            <Pressable
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Chalkboard + Mascot Stage */}
          <View style={styles.lessonStage}>
            <View style={styles.chalkboardWrap}>
              <View style={[styles.chalkboardFrame, { backgroundColor: palette.plum }]}>
                <View style={styles.chalkHeaderRow}>
                  <View>
                    <Text style={[styles.chalkTitle, { fontFamily: TakoFonts.black }]}>
                      Splitting 101
                    </Text>
                    <Svg width={128} height={10} viewBox="0 0 128 10" style={styles.chalkSquiggle}>
                      <Path
                        d="M2 6 Q 12 1, 22 6 T 42 6 T 62 6 T 82 6 T 102 6 T 124 6"
                        stroke="#FF7A8A"
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <Ionicons name="star-outline" size={24} color="#FFFFFF" />
                </View>

                <View style={styles.chalkList}>
                  {LESSON_STEPS.map((item, idx) => (
                    <View key={item.num} style={styles.chalkRow}>
                      <View style={styles.chalkNumCol}>
                        <View style={styles.chalkNumCircle}>
                          <Text style={[styles.chalkNumText, { fontFamily: TakoFonts.black }]}>
                            {item.num}
                          </Text>
                        </View>
                        {idx < LESSON_STEPS.length - 1 && <View style={styles.chalkDashLine} />}
                      </View>

                      <View style={styles.chalkIconBox}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>

                      <View style={styles.chalkRowCopy}>
                        <Text style={[styles.chalkRowTitle, { fontFamily: TakoFonts.black }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.chalkRowSub, { fontFamily: TakoFonts.regular }]}>
                          {item.sub}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Chalk tray + chalk sticks */}
              <View style={styles.chalkTray}>
                <View style={[styles.chalkStick, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.chalkStick, { backgroundColor: '#FF7A8A' }]} />
              </View>
            </View>

            {/* Speech bubble + Tako with pointer stick */}
            <View style={styles.lessonMascotRow}>
              <View
                style={[
                  styles.speechBubble,
                  { backgroundColor: palette.surface },
                  cardElevation,
                ]}>
                <Text style={[styles.speechText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Hi, I’m Tako!{'\n'}Let me show{'\n'}you how it{'\n'}works.
                </Text>
                <View style={[styles.speechTail, { backgroundColor: palette.surface }]} />
              </View>

              <View style={styles.lessonMascotWrap}>
                <View style={styles.pointerStickWrap} pointerEvents="none">
                  <View style={styles.pointerTip} />
                  <View style={styles.pointerShaft} />
                </View>
                <TakoMascot state="wave" size={142} />
              </View>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.welcomeActions}>
            <SpringPressable
              onPress={() => {
                tapLight();
                setStep(1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Start the lesson"
              style={[styles.darkPillBtn, styles.carouselCtaBtn, { backgroundColor: palette.chipOn }]}>
              <Text style={[styles.darkPillText, { color: palette.chipOnInk, fontFamily: TakoFonts.bold }]}>
                Start the lesson
              </Text>
            </SpringPressable>
            <Pressable
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel="Skip intro"
              style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Skip intro
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1–4: Feature Carousel (Create room -> QR -> Pick items -> Record & settle)
  if (step === 1 || step === 2 || step === 3 || step === 4) {
    const enterAnim = reducedMotion
      ? FadeIn.duration(140)
      : FadeInRight.duration(220).easing(EASE_OUT);
    const exitAnim = reducedMotion
      ? undefined
      : FadeOutLeft.duration(150).easing(EASE_OUT);

    const carouselTitle =
      step === 1
        ? 'Create a split room'
        : step === 2
          ? 'Friends join with a QR'
          : step === 3
            ? 'Everyone picks their item'
            : 'Settle up in seconds';

    const carouselSub =
      step === 1
        ? 'Name the hangout, add what you ordered, and open a room in seconds.'
        : step === 2
          ? 'Show the code. Everyone scans it and hops in.'
          : step === 3
            ? 'Tap what you had. Shared plates split evenly.'
            : 'Record where you paid — GCash, Maya, bank, or cash. Tako keeps the tab.';

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top', 'left', 'right']}>
        <View style={styles.carouselWrap}>
          <View style={styles.topSkipRow}>
            {step < 4 ? (
              <Pressable
                onPress={onComplete}
                accessibilityRole="button"
                accessibilityLabel="Skip"
                style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Skip
                </Text>
              </Pressable>
            ) : (
              <View style={styles.skipBtn} />
            )}
          </View>

          <Animated.View
            key={`card-${step}`}
            entering={enterAnim}
            exiting={exitAnim}
            style={styles.cardStage}>
            {step === 1 ? (
              <View style={[styles.featureCard, styles.createCard, { backgroundColor: palette.coralSoft }]}>
                <View style={styles.createCenterCol}>
                  <View style={styles.createPeekMascot}>
                    <TakoMascot state="wave" size={112} interactive={false} />
                  </View>
                  <View style={[styles.roomMockCard, { backgroundColor: '#FFFFFF' }, cardElevation]}>
                    <View style={styles.roomMockHeader}>
                      <View style={[styles.roomEmojiBadge, { backgroundColor: '#FFF0F3' }]}>
                        <Text style={styles.roomEmoji}>🍜</Text>
                      </View>
                      <View style={styles.roomHeaderCopy}>
                        <Text style={[styles.roomMockTitle, { fontFamily: TakoFonts.black }]}>
                          Ramen Night
                        </Text>
                        <Text style={[styles.roomMockSub, { fontFamily: TakoFonts.regular }]}>
                          4 friends · 3 items
                        </Text>
                      </View>
                      <Text style={[styles.roomMockTotal, { fontFamily: TakoFonts.black }]}>
                        ₱2,040
                      </Text>
                    </View>

                    <View style={styles.roomDivider} />

                    <View style={styles.roomMemberRow}>
                      <View style={styles.roomAvatarStack}>
                        {DEMO_PEOPLE.map((p, idx) => (
                          <View
                            key={p.label}
                            style={[
                              styles.roomMiniAvatar,
                              { backgroundColor: p.color, marginLeft: idx === 0 ? 0 : -8 },
                            ]}>
                            <Text
                              style={[
                                styles.roomMiniAvatarText,
                                { color: p.ink, fontFamily: TakoFonts.bold },
                              ]}>
                              {p.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={[styles.roomReadyPill, { backgroundColor: palette.tealSoft }]}>
                        <Ionicons name="sparkles" size={12} color={palette.teal} />
                        <Text style={[styles.roomReadyText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                          Room ready
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.createPillBtn, { backgroundColor: '#2B1B3D' }, cardElevation]}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={[styles.createPillText, { fontFamily: TakoFonts.bold }]}>
                    New split room
                  </Text>
                </View>
              </View>
            ) : step === 2 ? (
              <View style={[styles.featureCard, styles.qrCard, { backgroundColor: palette.lavenderSoft }]}>
                <View style={styles.qrMainRow}>
                  <View style={styles.qrSideColLeft}>
                    <View style={[styles.floatAvatar, { backgroundColor: '#2EC4B6' }]}>
                      <Text style={[styles.floatAvatarText, { fontFamily: TakoFonts.bold }]}>M</Text>
                    </View>
                    <View style={[styles.floatAvatar, { backgroundColor: '#F5D6BA' }]}>
                      <Text style={[styles.floatAvatarText, { color: '#2B1B3D', fontFamily: TakoFonts.bold }]}>
                        J
                      </Text>
                    </View>
                  </View>

                  <View style={styles.qrCenterCol}>
                    <View style={styles.qrPeekMascot}>
                      <TakoMascot state="wave" size={128} interactive={false} />
                    </View>
                    <View style={[styles.qrMockBox, { backgroundColor: '#FFFFFF' }, cardElevation]}>
                      <QRCode value="tako://join/TAKO-4821" size={156} color="#2B1B3D" backgroundColor="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.qrSideColRight}>
                    <View style={[styles.floatAvatar, { backgroundColor: '#B9A5E8' }]}>
                      <Text style={[styles.floatAvatarText, { fontFamily: TakoFonts.bold }]}>K</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.qrCodePill, { backgroundColor: '#FFFFFF' }, cardElevation]}>
                  <Text style={[styles.qrCodePillText, { fontFamily: TakoFonts.black }]}>
                    TAKO-4821
                  </Text>
                </View>
              </View>
            ) : step === 3 ? (
              <View style={[styles.featureCard, styles.itemsCard, { backgroundColor: palette.tealSoft }]}>
                <View style={styles.itemsListWrap}>
                  {DEMO_ITEMS.map((item, idx) => (
                    <Animated.View
                      key={item.name}
                      entering={
                        reducedMotion
                          ? undefined
                          : FadeInDown.delay(idx * 55).duration(200).easing(EASE_OUT)
                      }
                      style={[styles.demoItemCard, { backgroundColor: '#FFFFFF' }, cardElevation]}>
                      <View style={styles.demoItemTop}>
                        <Text style={[styles.demoItemName, { fontFamily: TakoFonts.bold }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.demoItemPrice, { fontFamily: TakoFonts.black }]}>
                          {item.price}
                        </Text>
                      </View>
                      <View style={styles.demoPeopleRow}>
                        {DEMO_PEOPLE.map((p, pIdx) => {
                          const on = item.active[pIdx];
                          return (
                            <View
                              key={p.label}
                              style={[
                                styles.demoPersonChip,
                                on
                                  ? { backgroundColor: p.color }
                                  : { borderWidth: 1.5, borderColor: '#D7D0BE', backgroundColor: '#FFFFFF' },
                              ]}>
                              <Text
                                style={[
                                  styles.demoPersonText,
                                  {
                                    color: on ? p.ink : '#6A6A6A',
                                    fontFamily: TakoFonts.bold,
                                  },
                                ]}>
                                {p.label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </Animated.View>
                  ))}
                </View>
                <View style={styles.itemsMascot}>
                  <TakoMascot state="idle" size={92} interactive={false} />
                </View>
              </View>
            ) : (
              <View style={[styles.featureCard, styles.settleCard, { backgroundColor: palette.goldSoft }]}>
                {/* Decorative Confetti */}
                <View style={styles.confettiLayer} pointerEvents="none">
                  <View style={[styles.confettiDot, { top: 44, left: 36, backgroundColor: '#FF7A8A' }]} />
                  <View style={[styles.confettiSquare, { top: 22, left: 92, backgroundColor: '#2EC4B6', transform: [{ rotate: '24deg' }] }]} />
                  <View style={[styles.confettiDot, { top: 18, left: '46%', backgroundColor: '#FFC857' }]} />
                  <View style={[styles.confettiSquare, { top: 26, right: 86, backgroundColor: '#B9A5E8', transform: [{ rotate: '-20deg' }] }]} />
                  <View style={[styles.confettiDot, { top: 64, right: 34, backgroundColor: '#2EC4B6' }]} />
                  <View style={[styles.confettiSquare, { top: 138, left: 26, backgroundColor: '#FFC857', transform: [{ rotate: '18deg' }] }]} />
                  <View style={[styles.confettiSquare, { top: 130, right: 28, backgroundColor: '#FF7A8A', transform: [{ rotate: '-28deg' }] }]} />
                  <View style={[styles.confettiDot, { top: 206, right: 42, backgroundColor: '#B9A5E8' }]} />
                  <View style={[styles.confettiDot, { top: 214, left: 44, backgroundColor: '#2EC4B6' }]} />
                </View>
                <TakoMascot state="celebrate" size={200} interactive={false} />
                <View style={styles.settleBadgeWrap}>
                  <View style={[styles.settlePill, { backgroundColor: '#FFFFFF' }, cardElevation]}>
                    <View style={[styles.settleCheckCircle, { backgroundColor: palette.teal }]}>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.settlePillText, { fontFamily: TakoFonts.black }]}>
                      ₱565 paid
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.settleSubCaption,
                      { color: isDark ? palette.mute : '#7D6A43', fontFamily: TakoFonts.regular },
                    ]}>
                    to Mia via GCash
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={styles.carouselTextSection}>
            {/* Persistent Animated Progress Dots */}
            <View style={styles.dotsRow}>
              {[1, 2, 3, 4].map((dotStep) => (
                <OnboardingDot key={dotStep} active={dotStep === step} />
              ))}
            </View>

            <Animated.View key={`copy-${step}`} entering={enterAnim} style={styles.carouselCopy}>
              <Text style={[styles.carouselTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {carouselTitle}
              </Text>
              <Text style={[styles.carouselSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                {carouselSub}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.carouselSpacer} />

          <View
            style={[
              styles.carouselButtonWrap,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}>
            <SpringPressable
              onPress={() => {
                tapLight();
                if (step === 1) {
                  setStep(2);
                } else if (step === 2) {
                  setStep(3);
                } else if (step === 3) {
                  setStep(4);
                } else if (phase === 'intro') {
                  onComplete();
                } else {
                  setStep(5);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={step === 4 && phase === 'intro' ? 'Get started' : 'Next'}
              style={[styles.darkPillBtn, styles.carouselCtaBtn, { backgroundColor: palette.chipOn }]}>
              <Text style={[styles.darkPillText, { color: palette.chipOnInk, fontFamily: TakoFonts.bold }]}>
                {step === 4 && phase === 'intro' ? 'Get started' : 'Next'}
              </Text>
            </SpringPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Step 5: Your profile (NO payment section, WITH photo upload)
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.profileWrap,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.profileHeader}>
            {phase === 'setup' ? (
              <View style={styles.headerSpacer} />
            ) : (
              <Pressable
                onPress={() => setStep(4)}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={[styles.circleBackBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Ionicons name="chevron-back" size={20} color={palette.ink} />
              </Pressable>
            )}
            <Text style={[styles.profileHeaderTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Your profile
            </Text>
            <Pressable
              onPress={() => {
                setCameraDeniedView(false);
                setStep(6);
              }}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                Skip
              </Text>
            </Pressable>
          </View>

          <View style={styles.profileBody}>
            <View style={[styles.bigAvatar, { backgroundColor: avatarColor }]}>
              <Text style={[styles.bigAvatarText, { fontFamily: TakoFonts.black }]}>
                {initial}
              </Text>
            </View>

            {/* Color Swatches */}
            <View style={styles.swatchRow}>
              {AVATAR_SWATCHES.map((swatch) => {
                const selected = avatarColor === swatch;
                return (
                  <Pressable
                    key={swatch}
                    onPress={() => {
                      tapLight();
                      setAvatarColor(swatch);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select avatar color ${swatch}`}
                    style={[
                      styles.swatchOuter,
                      selected && { borderColor: palette.ink, borderWidth: 2.5 },
                    ]}>
                    <View style={[styles.swatchInner, { backgroundColor: swatch }]} />
                  </Pressable>
                );
              })}
            </View>

            {/* Name Input */}
            <View style={styles.nameField}>
              <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={(txt) => {
                  setDisplayName(txt);
                  if (nameError) setNameError(null);
                }}
                placeholder="Your name"
                placeholderTextColor={palette.mute}
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleFinishProfile}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: palette.surface,
                    color: palette.ink,
                    borderColor: nameError ? palette.destructive : palette.border,
                    fontFamily: TakoFonts.regular,
                  },
                ]}
              />
              <FieldError message={nameError} />
            </View>
          </View>

          <PrimaryButton
            label="Finish setup"
            onPress={handleFinishProfile}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  welcomeWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    justifyContent: 'space-between',
    gap: 16,
  },
  lessonTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonWordmark: {
    fontSize: 24,
    letterSpacing: -0.9,
  },
  lessonStage: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  chalkboardWrap: {
    alignItems: 'center',
  },
  chalkboardFrame: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 8,
    borderColor: '#A98258',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 16,
  },
  chalkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chalkTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  chalkSquiggle: {
    marginTop: 4,
  },
  chalkList: {
    gap: 0,
  },
  chalkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 54,
  },
  chalkNumCol: {
    alignItems: 'center',
    width: 30,
  },
  chalkNumCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chalkNumText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  chalkDashLine: {
    width: 2,
    height: 22,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginVertical: 2,
  },
  chalkIconBox: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chalkRowCopy: {
    flex: 1,
    gap: 1,
    paddingTop: 1,
  },
  chalkRowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  chalkRowSub: {
    color: 'rgba(255, 246, 238, 0.68)',
    fontSize: 12.5,
  },
  chalkTray: {
    width: 170,
    height: 11,
    backgroundColor: '#A98258',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: 18,
    gap: 10,
    marginTop: -2,
  },
  chalkStick: {
    width: 26,
    height: 7,
    borderRadius: 4,
    marginTop: -4,
  },
  lessonMascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  speechBubble: {
    position: 'relative',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    maxWidth: 168,
  },
  speechText: {
    fontSize: 15,
    lineHeight: 22,
  },
  speechTail: {
    position: 'absolute',
    right: -6,
    top: '48%',
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
  },
  lessonMascotWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  pointerStickWrap: {
    position: 'absolute',
    top: -66,
    right: 6,
    alignItems: 'center',
    transform: [{ rotate: '-18deg' }],
    zIndex: 2,
  },
  pointerTip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF7A8A',
    marginBottom: -3,
  },
  pointerShaft: {
    width: 6,
    height: 104,
    borderRadius: 3,
    backgroundColor: '#FFC857',
  },
  welcomeActions: {
    gap: 10,
    alignItems: 'center',
  },
  createCard: {
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  createCenterCol: {
    width: '100%',
    alignItems: 'center',
  },
  createPeekMascot: {
    marginBottom: -22,
    zIndex: 1,
  },
  roomMockCard: {
    width: '100%',
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  roomMockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomEmoji: {
    fontSize: 22,
  },
  roomHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  roomMockTitle: {
    color: '#2B1B3D',
    fontSize: 16,
  },
  roomMockSub: {
    color: '#6A6A6A',
    fontSize: 12.5,
  },
  roomMockTotal: {
    color: '#2B1B3D',
    fontSize: 17,
  },
  roomDivider: {
    height: 1,
    backgroundColor: '#EEECE3',
  },
  roomMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomMiniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomMiniAvatarText: {
    fontSize: 12,
  },
  roomReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  roomReadyText: {
    fontSize: 12,
  },
  createPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  createPillText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  darkPillBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPillText: {
    fontSize: 16,
  },
  skipBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
  },
  carouselWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  topSkipRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardStage: {
    flex: 5,
    minHeight: 280,
    maxHeight: 480,
  },
  featureCard: {
    flex: 1,
    borderRadius: 32,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrCard: {
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  qrMainRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrSideColLeft: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
    paddingTop: 48,
  },
  qrSideColRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
  },
  qrCenterCol: {
    alignItems: 'center',
  },
  qrPeekMascot: {
    marginBottom: -24,
    zIndex: 1,
  },
  qrMockBox: {
    padding: 16,
    borderRadius: 22,
    zIndex: 2,
  },
  qrCodePill: {
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: Radii.pill,
  },
  qrCodePillText: {
    color: '#2B1B3D',
    fontSize: 16,
    letterSpacing: 1,
  },
  floatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  itemsCard: {
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 64,
  },
  itemsListWrap: {
    gap: 12,
  },
  demoItemCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
  },
  demoItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoItemName: {
    color: '#2B1B3D',
    fontSize: 15,
  },
  demoItemPrice: {
    color: '#2B1B3D',
    fontSize: 15,
  },
  demoPeopleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoPersonChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPersonText: {
    fontSize: 13,
  },
  itemsMascot: {
    position: 'absolute',
    right: 16,
    bottom: -14,
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
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  confettiSquare: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  settleCard: {
    justifyContent: 'center',
    gap: 26,
    paddingVertical: 24,
  },
  settleBadgeWrap: {
    alignItems: 'center',
    gap: 8,
  },
  settlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radii.pill,
  },
  settleCheckCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlePillText: {
    color: '#2B1B3D',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  settleSubCaption: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  carouselTextSection: {
    paddingTop: 16,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  carouselCopy: {
    gap: 8,
  },
  carouselTitle: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  carouselSub: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 44,
  },
  carouselSpacer: {
    flex: 1,
    minHeight: 24,
  },
  carouselButtonWrap: {
    paddingTop: 0,
  },
  carouselCtaBtn: {
    borderRadius: 18,
  },
  profileWrap: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: 'space-between',
    gap: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  profileHeaderTitle: {
    fontSize: 17,
  },
  profileBody: {
    alignItems: 'center',
    gap: 20,
  },
  avatarPickerWrap: {
    alignItems: 'center',
    gap: 8,
  },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  bigAvatarText: {
    color: '#2B1B3D',
    fontSize: 36,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 14,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swatchOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  nameField: {
    width: '100%',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
  },
  nameInput: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  cameraAskWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  cameraAskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraAskCenter: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  cameraCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cameraAskTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  cameraAskBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cameraOffWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    justifyContent: 'space-between',
  },
  cameraOffCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraMascotWrap: {
    position: 'relative',
  },
  cameraOffBadge: {
    position: 'absolute',
    right: 4,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3D2757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOffTitle: {
    color: '#FFF6EE',
    fontSize: 24,
    textAlign: 'center',
  },
  cameraOffBody: {
    color: '#C7B8DB',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  cameraOffActions: {
    gap: 10,
  },
  coralBtn: {
    minHeight: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralBtnText: {
    fontSize: 16,
  },
  outlinePlumBtn: {
    minHeight: 52,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,246,238,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinePlumText: {
    color: '#FFF6EE',
    fontSize: 15,
  },
});
