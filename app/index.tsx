import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Automatically transition to Room Home or Onboarding after 1.8s
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Translucent circle patterns */}
      <View style={styles.circleTopLeft} />
      <View style={styles.circleBottomRight} />

      {/* Floating Memoji Avatars */}
      <View style={[styles.floatingAvatar, { top: 120, left: 40 }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
          style={styles.avatarImg}
        />
      </View>
      <View style={[styles.floatingAvatar, { top: 200, right: 35 }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' }}
          style={styles.avatarImg}
        />
      </View>
      <View style={[styles.floatingAvatar, { bottom: 220, left: 50 }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' }}
          style={styles.avatarImg}
        />
      </View>
      <View style={[styles.floatingAvatar, { bottom: 160, right: 45 }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80' }}
          style={styles.avatarImg}
        />
      </View>

      {/* Center Brand Squircle */}
      <View style={styles.centerContent}>
        <View style={styles.logoSquircle}>
          <View style={styles.coinBlue} />
          <View style={styles.coinAmber} />
        </View>
        <Text style={styles.brandTitle}>TabTogether</Text>
        <Text style={styles.brandSubtitle}>Split bills, live, with friends</Text>
      </View>

      {/* Bottom Paging Dots */}
      <View style={styles.bottomDots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  floatingAvatar: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE4E6',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  centerContent: {
    alignItems: 'center',
  },
  logoSquircle: {
    width: 96,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  coinBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    marginRight: -14,
  },
  coinAmber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.amber,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomDots: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
});
