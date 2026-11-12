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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <DotGridBackground>
      {/* Top Cobalt Blue Header Band */}
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
            <TakoMascot size={92} />
          </View>

          {/* Main Login Card */}
          <StaggerItem index={0} distance={10}>
            <NeoCard
              style={styles.cardMargin}
              borderRadius={Radii.cardLg}
              contentStyle={styles.cardContent}
            >
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Log in to rejoin your rooms.</Text>

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
                placeholder="Your password"
                placeholderTextColor="#6E6C91"
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.forgotWrap,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <View style={{ marginTop: 6 }}>
                <NeoButton
                  label="Log in"
                  onPress={() => router.replace('/(tabs)')}
                  backgroundColor={Colors.primary}
                  textColor={Colors.textWhite}
                  height={54}
                  fontSize={17}
                />
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
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
            onPress={() => router.replace('/signup' as never)}
          >
            <Text style={styles.bottomLinkText}>
              New here? <Text style={styles.bottomLinkAccent}>Create an account</Text>
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
    height: 220,
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
    top: 96,
    zIndex: 2,
  },
  cardMargin: {
    marginTop: 112,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
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
