import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
} from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { TakoMascot } from '../src/components/TakoMascot';
import { NeoButton, NeoCard } from '../src/components/NeoUI';
import { StaggerItem } from '../src/components/MotionPrimitives';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  return (
    <DotGridBackground>
      <View style={styles.topBand} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={styles.brandText}>TabTogether</Text>
          </View>

          {/* Peeking Tako Mascot */}
          <View style={styles.takoPeek} pointerEvents="none">
            <TakoMascot size={84} />
          </View>

          <StaggerItem index={0} distance={10}>
            <NeoCard
              style={styles.cardMargin}
              borderRadius={Radii.cardLg}
              contentStyle={styles.cardContent}
            >
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start splitting in seconds.</Text>

              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Santos"
                placeholderTextColor="#6E6C91"
                autoComplete="name"
                returnKeyType="next"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="#6E6C91"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor="#6E6C91"
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

              <View style={{ marginTop: 8 }}>
                <NeoButton
                  label="Create account"
                  onPress={() => router.replace('/(tabs)')}
                  backgroundColor={Colors.primary}
                  textColor={Colors.textWhite}
                  height={54}
                  fontSize={17}
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
                    height={50}
                    fontSize={15}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <NeoButton
                    label="Google"
                    onPress={() => router.replace('/(tabs)')}
                    backgroundColor="#FFFFFF"
                    textColor={Colors.ink}
                    height={50}
                    fontSize={15}
                  />
                </View>
              </View>
            </NeoCard>
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
  topBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 190,
    backgroundColor: Colors.primary,
    borderBottomWidth: Border.width,
    borderBottomColor: Colors.ink,
  },
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
    paddingTop: 4,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  takoPeek: {
    position: 'absolute',
    right: 26,
    top: 94,
    zIndex: 2,
  },
  cardMargin: {
    marginTop: 86,
  },
  cardContent: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: Spacing.md,
  },
  input: {
    minHeight: 50,
    marginTop: 5,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    backgroundColor: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    minHeight: TouchTarget.minSize,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radii.xs,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  termsText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.lg,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.ink,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
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
    fontWeight: '700',
    color: Colors.ink,
  },
  bottomLinkAccent: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
