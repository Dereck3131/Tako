import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Radii, TakoFonts } from '@/constants/theme';

interface QRCodeCardProps {
  code: string;
  joinUrl: string;
  groupName: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function QRCodeCard({
  code,
  joinUrl,
  groupName,
}: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={styles.card}>
      <View
        style={styles.qrFrame}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`QR code to join ${groupName}. Invite code ${code}`}>
        <QRCode
          value={joinUrl || code}
          size={196}
          color="#2B1B3D"
          backgroundColor="#FFFFFF"
          quietZone={8}
          ecl="M"
        />
      </View>

      <Text
        style={[styles.groupName, { fontFamily: TakoFonts.bold }]}
        numberOfLines={1}>
        {groupName}
      </Text>

      <Pressable
        onPress={handleCopy}
        accessibilityRole="button"
        accessibilityLabel={`Copy invite code ${code}`}
        style={({ pressed }) => [
          styles.codeWrap,
          pressed && { opacity: 0.8 },
        ]}>
        <Text
          selectable
          style={[
            styles.codeText,
            {
              color: copied ? '#2EC4B6' : '#E5405E',
              fontFamily: TakoFonts.black,
            },
          ]}>
          {copied ? `${code} ✓` : code}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 292,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)' },
    }),
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  groupName: {
    color: '#2B1B3D',
    fontSize: 17,
    textAlign: 'center',
  },
  codeWrap: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  codeText: {
    fontSize: 23,
    letterSpacing: 2.2,
    fontVariant: ['tabular-nums'],
  },
});
