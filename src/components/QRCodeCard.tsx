import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

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
  onRegenerate,
  regenerating,
}: QRCodeCardProps) {
  const { palette, isDark } = useTakoTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        !isDark && styles.lightShadow,
      ]}>
      {/* Always light QR background with dark modules in BOTH themes for reliable scanning */}
      <View
        style={styles.qrFrame}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`QR code to join ${groupName}. Invite code ${code}`}>
        <QRCode
          value={joinUrl}
          size={196}
          color="#2B1B3D"
          backgroundColor="#FFFFFF"
          quietZone={12}
          ecl="H"
        />
        <View style={styles.centerBadge} pointerEvents="none">
          <TakoMascot state="idle" size={34} interactive={false} />
        </View>
      </View>

      <Text style={[styles.codeLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
        INVITE CODE
      </Text>

      <View style={styles.codeActions}>
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel={`Copy invite code ${code}`}
          style={({ pressed }) => [
            styles.codePill,
            {
              backgroundColor: copied ? palette.tealSoft : palette.chip,
              borderColor: copied ? palette.teal : palette.border,
            },
            pressed && { opacity: 0.85 },
          ]}>
          <Text
            selectable
            style={[
              styles.codeText,
              {
                color: copied ? palette.teal : palette.ink,
                fontFamily: TakoFonts.black,
              },
            ]}>
            {code}
          </Text>
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={18}
            color={copied ? palette.teal : palette.mute}
          />
          {copied && (
            <Text style={[styles.copiedBadge, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
              Copied
            </Text>
          )}
        </Pressable>

        {onRegenerate && (
          <Pressable
            onPress={onRegenerate}
            disabled={regenerating}
            accessibilityRole="button"
            accessibilityLabel="Regenerate invite code"
            style={({ pressed }) => [
              styles.regenBtn,
              { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
              pressed && { opacity: 0.8 },
            ]}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={palette.ink}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  lightShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 3 },
    web: { boxShadow: '0 4px 16px rgba(43, 27, 61, 0.08)' },
  }),
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 20,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  copiedBadge: {
    fontSize: 12,
  },
  regenBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
