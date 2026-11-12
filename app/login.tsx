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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
              <View style={styles.takoPeek} pointerEvents="none">
                <TakoMascot size={78} />
              </View>

              <NeoCard borderRadius={Radii.cardLg} contentStyle={styles.cardContent}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Log in to rejoin your rooms.</Text>

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
                  placeholder="Your password"
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

                <View style={{ marginTop: Spacing.xs }}>
                  <NeoButton
                    label="Log in"
                    onPress={() => router.replace('/(tabs)')}
                    backgroundColor={Colors.primary}
                    textColor={Colors.textWhite}
                    height={52}
                    fontSize={16}
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
    marginTop: 52,
  },
  takoPeek: {
    position: 'absolute',
    right: 20,
    top: -48,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
