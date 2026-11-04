import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Colors, Radii } from '../../src/constants/theme';

export default function MeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Me</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
              style={styles.avatarImg}
            />
          </View>
          <Text style={styles.profileName}>Alex Santos</Text>
          <Text style={styles.profileEmail}>alex@email.com</Text>

          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Menu Card */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuLabel}>Payment methods</Text>
            <Text style={styles.menuValue}>Apple Pay  ›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Text style={styles.menuValue}>On  ›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuLabel}>Currency</Text>
            <Text style={styles.menuValue}>USD $  ›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuLabel}>Help & support</Text>
            <Text style={styles.menuValue}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out CTA */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 20,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 90,
    height: 90,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  editProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editProfileText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
});
