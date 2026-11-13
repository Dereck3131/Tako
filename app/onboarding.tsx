import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Colors,
  Motion,
  Radii,
  Shadows,
  Spacing,
  TouchTarget,
  Typography,
} from '../src/constants/theme';
import { MotionTokens } from '../src/constants/motion';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { Tako, TakoState } from '../src/components/Tako';
import { BrandWordmark, NeoButton, NeoCard } from '../src/components/NeoUI';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { Badge } from '../src/components/Badge';
import { useIsScreenActive, useReducedMotion } from '../src/components/MotionPrimitives';

const SLIDES = [
  {
    title: 'Split live together',
    subtitle:
      'Everyone joins by QR, claims their items and pays their share in one shared room.',
    cta: 'Next',
  },
  {
    title: 'Claim what you ate',
    subtitle:
      'Tap your items and drag the slider to set your share. Everyone sees it update live.',
    cta: 'Next',
  },
  {
    title: 'Pay in one tap',
    subtitle:
      'See exactly what you owe and watch friends settle up in real time.',
    cta: 'Get started',
  },
];

const SLIDE_TAKO_STATE: TakoState[] = ['happy', 'counting', 'celebrating'];

function OnboardingDot({
  active,
  index,
  onPress,
  reducedMotion,
}: {
  active: boolean;
  index: number;
  onPress: () => void;
  reducedMotion: boolean;
}) {
  const width = useSharedValue(active ? 22 : 7);

  useEffect(() => {
    if (reducedMotion) {
      width.value = active ? 22 : 7;
    } else {
      width.value = withSpring(active ? 22 : 7, MotionTokens.spring.tabPill);
    }
  }, [active, reducedMotion, width]);

  const dotStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: active ? Colors.primary : Colors.border,
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Slide ${index + 1}`}
      onPress={onPress}
      style={styles.dotHit}
    >
      <Animated.View style={[styles.pillDot, dotStyle]} />
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion();
  const isActive = useIsScreenActive();

  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const takoScale = useSharedValue(1);

  const goToSlide = (nextSlide: number) => {
    if (nextSlide === slide) return;
    setDirection(nextSlide > slide ? 1 : -1);
    setSlide(nextSlide);
  };

  useEffect(() => {
    if (reducedMotion) {
      cardTranslateX.value = 0;
      cardOpacity.value = 1;
      takoScale.value = 1;
      return;
    }
    cardOpacity.value = 0;
    cardTranslateX.value = direction * MotionTokens.distance.slideX;
    cardOpacity.value = withTiming(1, {
      duration: MotionTokens.duration.normal,
      easing: MotionTokens.easing.reanimatedOut,
    });
    cardTranslateX.value = withTiming(0, {
      duration: MotionTokens.duration.normal,
      easing: MotionTokens.easing.reanimatedOut,
    });
    takoScale.value = withSpring(slide === 0 ? 1 : 0.84, MotionTokens.spring.settle);
  }, [cardOpacity, cardTranslateX, direction, reducedMotion, slide, takoScale]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }],
  }));

  const takoWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: takoScale.value }],
  }));

  const handleNext = () => {
    if (slide < 2) {
      goToSlide(slide + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <BrandWordmark fontSize={17} />
            {slide < 2 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip onboarding"
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && { transform: [{ scale: Motion.pressScale }] },
                ]}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={styles.skipPlaceholder} />
            )}
          </View>

          {/* Illustration Area */}
          <View style={styles.illustrationArea}>
            <View style={{ width: '100%' }}>
              {/* Shared Tako mascot across slides */}
              <Animated.View style={[{ alignItems: 'center', marginTop: 8 }, takoWrapStyle]}>
                <Tako
                  state={SLIDE_TAKO_STATE[slide]}
                  size={164}
                  interactive
                  isActive={isActive}
                />
              </Animated.View>

              <Animated.View style={cardAnimStyle}>
                {slide === 0 && (
                  <View style={{ width: '100%' }}>
                    <NeoCard
                      style={{ marginTop: 12 }}
                      borderRadius={Radii.card}
                      contentStyle={styles.intro1ItemRow}
                    >
                      <View style={styles.flexMin0}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          Truffle Burger ×2
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={1}>
                          Added by Mia · just now
                        </Text>
                      </View>
                      <Text style={styles.cardPrice} numberOfLines={1}>
                        $36.00
                      </Text>
                    </NeoCard>

                    <NeoCard
                      style={{ marginTop: Spacing.md }}
                      borderRadius={Radii.card}
                      contentStyle={styles.intro1JoinRow}
                    >
                      <MemojiAvatar id="aly" size={34} />
                      <Text style={[styles.cardTitle, { flex: 1, minWidth: 0 }]} numberOfLines={1}>
                        Aly joined the room
                      </Text>
                      <Badge label="Live" variant="emerald" />
                    </NeoCard>
                  </View>
                )}

                {slide === 1 && (
                  <View style={{ width: '100%' }}>
                    <NeoCard
                      style={{ marginTop: 10 }}
                      borderRadius={Radii.pill}
                      contentStyle={styles.intro2PillRow}
                    >
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        Burgers ×4
                      </Text>
                      <Text style={[styles.cardTitle, Typography.tabular]} numberOfLines={1}>
                        $120.00
                      </Text>
                    </NeoCard>

                    <NeoCard
                      style={{ marginTop: 12 }}
                      backgroundColor={Colors.card}
                      borderRadius={Radii.card}
                      contentStyle={styles.intro2SliderCard}
                    >
                      <View style={styles.rowGap10}>
                        <MemojiAvatar id="you" size={34} />
                        <Text style={[styles.cardTitle, { flex: 1, minWidth: 0 }]} numberOfLines={1}>
                          You
                        </Text>
                        <Badge label="25%" variant="blue" />
                        <Text style={styles.sliderAmount} numberOfLines={1}>
                          $30.00
                        </Text>
                      </View>
                      <View style={styles.sliderTrackWrap}>
                        <View style={styles.sliderTrack}>
                          <View style={styles.sliderFill} />
                        </View>
                        <View style={[styles.sliderThumb, Shadows.cardSoft]} />
                      </View>
                    </NeoCard>
                  </View>
                )}

                {slide === 2 && (
                  <View style={{ width: '100%' }}>
                    <View style={[styles.darkCard, Shadows.hero]}>
                      <Text style={styles.darkLabel}>Your share to pay</Text>
                      <Text style={styles.darkAmount} numberOfLines={1}>
                        $52.50
                      </Text>
                      <View style={{ marginTop: 12 }}>
                        <NeoButton
                          label="Pay Now"
                          onPress={() => router.replace('/(tabs)')}
                          backgroundColor={Colors.amber}
                          textColor={Colors.ink}
                          height={46}
                          fontSize={15}
                        />
                      </View>
                    </View>

                    <NeoCard
                      style={{ marginTop: 12 }}
                      borderRadius={Radii.card}
                      contentStyle={styles.intro1JoinRow}
                    >
                      <MemojiAvatar id="mia" size={34} />
                      <Text style={[styles.cardTitle, { flex: 1, minWidth: 0 }]} numberOfLines={1}>
                        Mia
                      </Text>
                      <Badge label="Paid" variant="emerald" />
                    </NeoCard>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>

          {/* Copy */}
          <Animated.View style={[styles.copyArea, cardAnimStyle]}>
            <Text style={styles.headline}>{SLIDES[slide].title}</Text>
            <Text style={styles.subtitle}>{SLIDES[slide].subtitle}</Text>
          </Animated.View>

          {/* Bottom Navigation */}
          <View style={styles.bottomArea}>
            <View style={styles.dotsRow}>
              {[0, 1, 2].map((idx) => (
                <OnboardingDot
                  key={idx}
                  index={idx}
                  active={idx === slide}
                  onPress={() => goToSlide(idx)}
                  reducedMotion={reducedMotion}
                />
              ))}
            </View>

            <View style={{ marginTop: Spacing.sm }}>
              <NeoButton
                label={SLIDES[slide].cta}
                onPress={handleNext}
                backgroundColor={Colors.primary}
                textColor={Colors.textWhite}
                height={52}
                fontSize={16}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login' as never)}
              style={({ pressed }) => [
                styles.loginLinkWrap,
                pressed && { transform: [{ scale: Motion.pressScale }] },
              ]}
            >
              <Text style={styles.loginLinkText}>I already have an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DotGridBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TouchTarget.minSize,
  },
  skipBtn: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipPlaceholder: {
    height: TouchTarget.minSize,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  illustrationArea: {
    minHeight: 330,
    justifyContent: 'flex-start',
  },
  flexMin0: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.sm,
  },
  intro1ItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  intro1JoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  intro2PillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TouchTarget.minSize,
    paddingHorizontal: 18,
  },
  intro2SliderCard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
    paddingBottom: 16,
  },
  rowGap10: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    ...Typography.cardTitle,
  },
  cardSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  cardPrice: {
    ...Typography.currencyMd,
    color: Colors.ink,
    flexShrink: 0,
  },
  sliderAmount: {
    ...Typography.currencyMd,
    color: Colors.ink,
    flexShrink: 0,
  },
  sliderTrackWrap: {
    position: 'relative',
    height: 20,
    marginTop: 12,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    overflow: 'hidden',
  },
  sliderFill: {
    width: '25%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    left: '25%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  darkCard: {
    backgroundColor: Colors.cardDark,
    borderRadius: Radii.cardLg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginTop: 8,
  },
  darkLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textOnDarkMuted,
  },
  darkAmount: {
    ...Typography.currencyHero,
    fontSize: 40,
    lineHeight: 46,
    color: '#FFFFFF',
    marginTop: 2,
  },
  copyArea: {
    marginTop: Spacing.lg,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 34,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: Spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dotHit: {
    minHeight: TouchTarget.minSize,
    minWidth: TouchTarget.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDot: {
    height: 8,
    borderRadius: 4,
  },
  pillDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  pillDotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  loginLinkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    minHeight: TouchTarget.minSize,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
