import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../src/constants/theme';
import { Badge } from '../src/components/Badge';

export default function JoinQRModal() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.sheetContainer}>
        {/* Top Grab Handle */}
        <View style={styles.grabHandle} />

        <Text style={styles.title}>Point your phone to join this bill</Text>
        <Text style={styles.subtitle}>Scan the code or enter the PIN</Text>

        {/* Custom Stylized QR Code Graphic Container */}
        <View style={styles.qrCard}>
          <View style={styles.qrCornerTL} />
          <View style={styles.qrCornerTR} />
          <View style={styles.qrCornerBL} />
          <View style={styles.qrCornerBR} />

          {/* Grid pattern mock */}
          <View style={styles.qrCenterGraphic}>
            <View style={styles.qrPatternRow}>
              <View style={[styles.qrBox, styles.qrBoxLarge]} />
              <View style={styles.qrBox} />
              <View style={[styles.qrBox, styles.qrBoxLarge]} />
            </View>
            <View style={styles.qrPatternRow}>
              <View style={styles.qrBox} />
              <View style={[styles.qrBox, styles.qrBoxBlue]} />
              <View style={styles.qrBox} />
            </View>
            <View style={styles.qrPatternRow}>
              <View style={[styles.qrBox, styles.qrBoxLarge]} />
              <View style={styles.qrBox} />
              <View style={[styles.qrBox, styles.qrBoxLarge]} />
            </View>
          </View>
        </View>

        {/* PIN Badge Block */}
        <View style={styles.pinPill}>
          <Text style={styles.pinText}>PIN: 4821</Text>
        </View>

        {/* In the room Live Guest List */}
        <View style={styles.guestListSection}>
          <View style={styles.guestHeaderRow}>
            <Text style={styles.guestSectionTitle}>In the room</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Guest 1 */}
          <View style={styles.guestRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }}
              style={styles.guestAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>You</Text>
              <Text style={styles.guestDevice}>Host · iPhone</Text>
            </View>
            <Badge label="Connected" variant="emerald" />
          </View>

          {/* Guest 2 */}
          <View style={styles.guestRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' }}
              style={styles.guestAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>Mia</Text>
              <Text style={styles.guestDevice}>Just joined</Text>
            </View>
            <Badge label="Connected" variant="emerald" />
          </View>

          {/* Guest 3 */}
          <View style={styles.guestRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' }}
              style={styles.guestAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>Aly</Text>
              <Text style={styles.guestDevice}>Scanning code…</Text>
            </View>
            <Badge label="Joining" variant="amber" />
          </View>
        </View>

        {/* Close button */}
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
    backgroundColor: '#0B1530', // Dark overlay presentation
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
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 24,
  },
  qrCard: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  qrCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrCornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrCenterGraphic: {
    width: 130,
    height: 130,
    justifyContent: 'space-between',
  },
  qrPatternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qrBox: {
    width: 24,
    height: 24,
    backgroundColor: Colors.textPrimary,
    borderRadius: 4,
  },
  qrBoxLarge: {
    width: 38,
    height: 38,
    backgroundColor: Colors.textPrimary,
    borderRadius: 6,
  },
  qrBoxBlue: {
    backgroundColor: Colors.primary,
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
    marginBottom: 20,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  guestAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
