import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../src/constants/theme';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { QRCodeVector } from '../src/components/QRCodeVector';

export default function JoinQRModal() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.sheetContainer}>
        {/* Top Grab Handle */}
        <View style={styles.grabHandle} />

        <Text style={styles.title}>Point your phone to join this bill</Text>
        <Text style={styles.subtitle}>Scan the code or enter the PIN</Text>

        {/* Clean Vector Stylized QR Code with Blue Corner Finders */}
        <View style={styles.qrWrapper}>
          <QRCodeVector size={210} />
        </View>

        {/* PIN Badge Block */}
        <View style={styles.pinPill}>
          <Text style={styles.pinText}>PIN: 4821</Text>
        </View>

        {/* In the room Live Guest List matching Figma Page 5 */}
        <View style={styles.guestListSection}>
          <View style={styles.guestHeaderRow}>
            <Text style={styles.guestSectionTitle}>In the room</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Guest 1: You */}
          <View style={styles.guestRow}>
            <View style={styles.avatarWrap}>
              <MemojiAvatar id="you" size={42} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>You</Text>
              <Text style={styles.guestDevice}>Host · iPhone</Text>
            </View>
            <Badge label="Connected" variant="emerald" />
          </View>

          {/* Guest 2: Mia */}
          <View style={styles.guestRow}>
            <View style={styles.avatarWrap}>
              <MemojiAvatar id="mia" size={42} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>Mia</Text>
              <Text style={styles.guestDevice}>Just joined</Text>
            </View>
            <Badge label="Connected" variant="emerald" />
          </View>

          {/* Guest 3: Aly */}
          <View style={styles.guestRow}>
            <View style={styles.avatarWrap}>
              <MemojiAvatar id="aly" size={42} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>Aly</Text>
              <Text style={styles.guestDevice}>Scanning code…</Text>
            </View>
            <Badge label="Joining" variant="amber" />
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1530',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  grabHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 20,
  },
  qrWrapper: {
    marginBottom: 16,
  },
  pinPill: {
    backgroundColor: '#EEF3FF',
    borderRadius: Radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 24,
  },
  pinText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  guestListSection: {
    width: '100%',
    marginBottom: 24,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 6,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarWrap: {
    marginRight: 12,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  guestDevice: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.pill,
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
