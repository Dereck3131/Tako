import React, { useState } from 'react';
import {
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
  TouchTarget,
  Typography,
} from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { TakoMascot } from '../src/components/TakoMascot';
import { BrandWordmark, NeoButton, NeoCard } from '../src/components/NeoUI';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { Badge } from '../src/components/Badge';
import { StaggerItem } from '../src/components/MotionPrimitives';

const SLIDES = [
  {
    title: 'Split the bill,\nlive together',
    subtitle:
      'Everyone joins by QR, claims their items and pays their share in one shared room.',
    cta: 'Next',
  },
  {
    title: 'Claim what\nyou ate',
    subtitle:
      'Tap your items and drag the slider to set your share. Everyone sees it instantly.',
    cta: 'Next',
  },
  {
    title: 'Pay your share\nin one tap',
    subtitle:
      'See exactly what you owe and watch friends settle up in real time.',
    cta: 'Get started',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < 2) {
      setSlide(slide + 1);
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
            <BrandWordmark fontSize={16} />
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
          <StaggerItem key={`slide-art-${slide}`} index={0} distance={10}>
            <View style={styles.illustrationArea}>
              {slide === 0 && (
                <View style={{ width: '100%' }}>
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <TakoMascot size={196} />
                  </View>

                  <NeoCard
                    style={{ marginTop: 8 }}
                    borderRadius={Radii.lg}
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
                    borderRadius={Radii.md}
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
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <TakoMascot size={150} />
                  </View>

                  <NeoCard
                    style={{ marginTop: 6 }}
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
                    style={{ marginTop: 14 }}
                    backgroundColor={Colors.amberTint}
                    borderRadius={Radii.lg}
                    contentStyle={styles.intro2SliderCard}
                  >
                    <View style={styles.rowGap10}>
                      <MemojiAvatar id="you" size={34} />
                      <Text style={[styles.cardTitle, { flex: 1, minWidth: 0 }]} numberOfLines={1}>
                        You
                      </Text>
                      <Badge label="25%" variant="amber" />
                      <Text style={styles.sliderAmount} numberOfLines={1}>
                        $30.00
                      </Text>
                    </View>
                    <View style={styles.sliderTrackWrap}>
                      <View style={styles.sliderTrack}>
                        <View style={styles.sliderFill} />
                      </View>
                      <View style={styles.sliderThumb} />
                    </View>
                  </NeoCard>
                </View>
              )}

              {slide === 2 && (
                <View style={{ width: '100%' }}>
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <TakoMascot size={150} />
                  </View>

                  <View style={styles.darkWrap}>
                    <View style={styles.darkAmberShadow} />
                    <View style={styles.darkCard}>
                      <Text style={styles.darkLabel}>Your share to pay</Text>
                      <Text style={styles.darkAmount} numberOfLines={1}>
                        $52.50
                      </Text>
                      <View style={{ marginTop: 10 }}>
                        <NeoButton
                          label="Pay Now"
                          onPress={() => router.replace('/(tabs)')}
                          backgroundColor={Colors.amber}
                          textColor={Colors.ink}
                          shadowColor={Colors.primary}
                          height={46}
                          fontSize={16}
                        />
                      </View>
                    </View>
                  </View>

                  <NeoCard
                    style={{ marginTop: 14 }}
                    borderRadius={Radii.md}
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
            </View>
          </StaggerItem>

          {/* Copy */}
          <View style={styles.copyArea}>
            <Text style={styles.headline}>{SLIDES[slide].title}</Text>
            <Text style={styles.subtitle}>{SLIDES[slide].subtitle}</Text>
          </View>

          {/* Bottom Navigation */}
          <View style={styles.bottomArea}>
            <View style={styles.dotsRow}>
              {[0, 1, 2].map((idx) => (
                <Pressable
                  key={idx}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: idx === slide }}
                  accessibilityLabel={`Slide ${idx + 1}`}
                  onPress={() => setSlide(idx)}
                  style={styles.dotHit}
                >
                  <View
                    style={[
                      styles.pillDot,
                      idx === slide ? styles.pillDotActive : styles.pillDotInactive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: Spacing.sm }}>
              <NeoButton
                label={SLIDES[slide].cta}
                onPress={handleNext}
                backgroundColor={Colors.primary}
                textColor={Colors.textWhite}
                height={54}
                fontSize={17}
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
    paddingHorizontal: Spacing.xxl,
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
    fontWeight: '800',
    color: Colors.ink,
  },
  illustrationArea: {
    minHeight: 340,
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
    paddingVertical: Spacing.md,
  },
  intro1JoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  intro2PillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TouchTarget.minSize,
    paddingHorizontal: 18,
  },
  intro2SliderCard: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  rowGap10: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardPrice: {
    ...Typography.currencyMd,
    fontSize: 22,
    color: Colors.ink,
    flexShrink: 0,
  },
  sliderAmount: {
    ...Typography.currencyMd,
    fontSize: 20,
    color: Colors.ink,
    flexShrink: 0,
  },
  sliderTrackWrap: {
    position: 'relative',
    height: 14,
    marginTop: 10,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 14,
    borderRadius: Radii.pill,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    backgroundColor: '#FFFFFF',
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
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.amber,
    borderWidth: Border.width,
    borderColor: Colors.ink,
  },
  darkWrap: {
    position: 'relative',
    marginTop: 4,
  },
  darkAmberShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: Radii.cardLg,
    backgroundColor: Colors.amber,
  },
  darkCard: {
    backgroundColor: Colors.ink,
    borderRadius: Radii.cardLg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  darkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textOnDarkMuted,
  },
  darkAmount: {
    ...Typography.currencyHero,
    fontSize: 44,
    lineHeight: 50,
    color: '#FFFFFF',
  },
  copyArea: {
    marginTop: Spacing.md,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 23,
    color: Colors.textBody,
    marginTop: 10,
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
    height: 12,
    borderRadius: 6,
    borderWidth: Border.width,
    borderColor: Colors.ink,
  },
  pillDotActive: {
    width: 30,
    backgroundColor: Colors.primary,
  },
  pillDotInactive: {
    width: 12,
    backgroundColor: '#FFFFFF',
  },
  loginLinkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    minHeight: TouchTarget.minSize,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
