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
import { BrandWordmark, NeoButton, NeoCard, NeoInput } from '../src/components/NeoUI';
import { StaggerItem } from '../src/components/MotionPrimitives';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <BrandWordmark fontSize={18} />
          </View>

          <StaggerItem index={0} distance={10}>
            <View style={styles.cardWrap}>
              {/* Small Tako peeking over the card */}
              <View style={styles.takoPeek}>
                <TakoMascot size={76} peekIn interactive />
              </View>

              <NeoCard borderRadius={Radii.cardLg} contentStyle={styles.cardContent}>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Start splitting in seconds.</Text>

                <NeoInput
                  label="Full name"
                  placeholder="Alex Santos"
                  autoComplete="name"
                  returnKeyType="next"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <NeoInput
                  label="Email"
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                />

                <NeoInput
                  label="Password"
                  placeholder="At least 8 characters"
                  secureTextEntry
                  autoComplete="new-password"
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setAgreed(!agreed)}
                >
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the Terms and Privacy Policy
                  </Text>
                </Pressable>

                <View style={{ marginTop: Spacing.xs }}>
                  <NeoButton
                    label="Create account"
                    onPress={() => router.replace('/(tabs)')}
                    backgroundColor={Colors.primary}
                    textColor={Colors.textWhite}
                    height={52}
                    fontSize={16}
                  />
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <View style={{ flex: 1 }}>
                    <NeoButton
                      label="Apple"
                      onPress={() => router.replace('/(tabs)')}
                      backgroundColor={Colors.ink}
                      textColor={Colors.textWhite}
                      height={48}
                      fontSize={15}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <NeoButton
                      label="Google"
                      onPress={() => router.replace('/(tabs)')}
                      backgroundColor="#FFFFFF"
                      textColor={Colors.ink}
                      height={48}
                      fontSize={15}
                    />
                  </View>
                </View>
              </NeoCard>
            </View>
          </StaggerItem>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.bottomLink,
              pressed && { transform: [{ scale: Motion.pressScale }] },
            ]}
            onPress={() => router.replace('/login' as never)}
          >
            <Text style={styles.bottomLinkText}>
              Already have an account?{' '}
              <Text style={styles.bottomLinkAccent}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </DotGridBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  headerRow: {
    paddingVertical: Spacing.sm,
  },
  cardWrap: {
    position: 'relative',
    marginTop: 44,
  },
  takoPeek: {
    position: 'absolute',
    right: 20,
    top: -46,
    zIndex: 0,
  },
  cardContent: {
    padding: Spacing.xl,
    zIndex: 1,
  },
  title: {
    ...Typography.screenTitle,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.xs,
    minHeight: TouchTarget.minSize,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: Border.width,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bottomLink: {
    marginTop: 'auto',
    paddingTop: Spacing.lg,
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  bottomLinkAccent: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
