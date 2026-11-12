import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Motion,
  Radii,
  Spacing,
  TouchTarget,
  Typography,
} from '../../src/constants/theme';
import { DotGridBackground } from '../../src/components/DotGridBackground';
import { NeoButton, NeoCard } from '../../src/components/NeoUI';
import { MemojiAvatar } from '../../src/components/MemojiAvatar';
import { AppIconShowcase } from '../../src/components/AppIconBadge';
import { StaggerItem } from '../../src/components/MotionPrimitives';
import { useRoomStore } from '../../src/store/roomStore';

const ANIMALS = ['bear', 'fox', 'panda', 'frog', 'cat'] as const;

function ChevronRight() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={Colors.textSecondary}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export default function MeScreen() {
  const router = useRouter();
  const {
    selectedAnimal,
    setSelectedAnimal,
    currency,
    language,
    roundToPeso,
    soundEnabled,
    hapticsEnabled,
    muteNudges,
    optOutAwards,
    setSetting,
  } = useRoomStore();

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Me</Text>

          {/* Profile Card */}
          <StaggerItem index={0} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.profileContent}
            >
              <MemojiAvatar id={selectedAnimal} size={84} />
              <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
                Alex Santos
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1} ellipsizeMode="middle">
                alex@email.com
              </Text>
              <View style={{ marginTop: Spacing.md }}>
                <NeoButton
                  label="Edit profile"
                  onPress={() => {}}
                  backgroundColor={Colors.surfaceSubtle}
                  textColor={Colors.ink}
                  borderColor="transparent"
                  height={TouchTarget.minSize}
                  fontSize={14}
                />
              </View>
            </NeoCard>
          </StaggerItem>

          {/* YOUR ANIMAL Selector */}
          <StaggerItem index={1} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.animalCardContent}
            >
              <Text style={styles.sectionCap}>YOUR ANIMAL</Text>
              <View style={styles.animalRow}>
                {ANIMALS.map((animal) => {
                  const isSelected = selectedAnimal === animal;
                  return (
                    <Pressable
                      key={animal}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Select ${animal} avatar`}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {
                          // Fallback
                        }
                        setSelectedAnimal(animal);
                      }}
                      style={({ pressed }) => [
                        styles.animalRing,
                        isSelected && styles.animalRingSelected,
                        pressed && { transform: [{ scale: Motion.pressScale }] },
                      ]}
                    >
                      <MemojiAvatar id={animal} size={42} />
                    </Pressable>
                  );
                })}
              </View>
            </NeoCard>
          </StaggerItem>

          {/* Settings Menu Card */}
          <StaggerItem index={2} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.menuCardContent}
            >
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Payment methods
                </Text>
                <View style={styles.menuRight}>
                  <Text style={styles.menuValue} numberOfLines={1}>
                    Apple Pay
                  </Text>
                  <ChevronRight />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuRow,
                  styles.menuRowBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Notifications
                </Text>
                <View style={styles.menuRight}>
                  <Text style={styles.menuValue} numberOfLines={1}>
                    On
                  </Text>
                  <ChevronRight />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle currency between PHP and USD"
                onPress={() => setSetting('currency', currency === 'PHP' ? 'USD' : 'PHP')}
                style={({ pressed }) => [
                  styles.menuRow,
                  styles.menuRowBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Currency
                </Text>
                <View style={styles.menuRight}>
                  <Text style={styles.menuValue} numberOfLines={1}>
                    {currency === 'PHP' ? 'PHP ₱' : 'USD $'}
                  </Text>
                  <ChevronRight />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle language between English and Taglish"
                onPress={() => setSetting('language', language === 'en' ? 'tl' : 'en')}
                style={({ pressed }) => [
                  styles.menuRow,
                  styles.menuRowBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Language
                </Text>
                <View style={styles.menuRight}>
                  <Text style={styles.menuValue} numberOfLines={1}>
                    {language === 'en' ? 'English' : 'Taglish'}
                  </Text>
                  <ChevronRight />
                </View>
              </Pressable>

              <View style={[styles.menuRow, styles.menuRowBorder]}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Round to nearest peso
                </Text>
                <Switch
                  accessibilityLabel="Round to nearest peso"
                  value={roundToPeso}
                  onValueChange={(v) => setSetting('roundToPeso', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.menuRow, styles.menuRowBorder]}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Soft UI sounds
                </Text>
                <Switch
                  accessibilityLabel="Soft UI sounds"
                  value={soundEnabled}
                  onValueChange={(v) => setSetting('soundEnabled', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.menuRow, styles.menuRowBorder]}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Haptics
                </Text>
                <Switch
                  accessibilityLabel="Haptics"
                  value={hapticsEnabled}
                  onValueChange={(v) => setSetting('hapticsEnabled', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.menuRow, styles.menuRowBorder]}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Mute squirt-ink nudges
                </Text>
                <Switch
                  accessibilityLabel="Mute squirt-ink nudges"
                  value={muteNudges}
                  onValueChange={(v) => setSetting('muteNudges', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.menuRow, styles.menuRowBorder]}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Opt out of awards naming
                </Text>
                <Switch
                  accessibilityLabel="Opt out of awards naming"
                  value={optOutAwards}
                  onValueChange={(v) => setSetting('optOutAwards', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuRow,
                  styles.menuRowBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Help & support
                </Text>
                <View style={styles.menuRight}>
                  <ChevronRight />
                </View>
              </Pressable>
            </NeoCard>
          </StaggerItem>

          {/* Screen 11: App Icon Showcase */}
          <StaggerItem index={3} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.animalCardContent}
            >
              <Text style={styles.sectionCap}>APP ICON</Text>
              <AppIconShowcase />
            </NeoCard>
          </StaggerItem>

          {/* Log out */}
          <View style={{ marginTop: Spacing.xl }}>
            <NeoButton
              label="Log out"
              onPress={() => router.replace('/login' as never)}
              backgroundColor={Colors.card}
              textColor={Colors.danger}
              height={48}
              fontSize={15}
            />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  headerTitle: {
    ...Typography.screenTitle,
  },
  profileContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.sm,
    maxWidth: '100%',
  },
  profileEmail: {
    ...Typography.caption,
    fontSize: 13,
    marginTop: 2,
    maxWidth: '100%',
  },
  animalCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionCap: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  animalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  animalRing: {
    minWidth: TouchTarget.minSize,
    minHeight: TouchTarget.minSize,
    padding: 4,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalRingSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  menuCardContent: {
    paddingHorizontal: Spacing.lg,
  },
  menuRow: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  menuValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
