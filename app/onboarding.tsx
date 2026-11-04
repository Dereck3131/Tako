import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../src/constants/theme';
import { TicketCard } from '../src/components/TicketCard';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar } from '../src/components/MemojiAvatar';

export default function OnboardingScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: 'Split the bill,\nlive and together',
      subtitle:
        'Everyone joins by QR, claims their items and pays their share, all in one shared room.',
      cta: 'Next',
    },
    {
      title: 'Claim what\nyou ate',
      subtitle:
        'Tap your items and drag the slider to adjust your share. Everyone sees changes instantly.',
      cta: 'Next',
    },
    {
      title: 'Pay your share\nin one tap',
      subtitle:
        'See exactly what you owe and watch friends settle up in real time.',
      cta: 'Get started',
    },
  ];

  const handleNext = () => {
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>TabTogether</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Card illustration area matching Figma Pages 9, 10, 11 */}
        <View style={styles.illustrationArea}>
          {slide === 0 && (
            <View style={{ width: '100%' }}>
              <TicketCard
                childrenTop={
                  <View style={styles.ticketTopRow}>
                    <View>
                      <Text style={styles.ticketTitle}>Truffle Burger ×2</Text>
                      <Text style={styles.ticketAuthor}>Added by Mia · just now</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.ticketPrice}>$36.00</Text>
                      <Badge label="NEW" variant="amber" />
                    </View>
                  </View>
                }
                childrenBottom={
                  <View style={styles.ticketBottomRow}>
                    <Text style={styles.splitWays}>Split 3 ways</Text>
                    <View style={styles.avatarMiniStack}>
                      <View style={[styles.miniWrap, { zIndex: 3 }]}>
                        <MemojiAvatar id="mia" size={24} />
                      </View>
                      <View style={[styles.miniWrap, { marginLeft: -6, zIndex: 2 }]}>
                        <MemojiAvatar id="jonas" size={24} />
                      </View>
                      <View style={[styles.miniWrap, { marginLeft: -6, zIndex: 1 }]}>
                        <MemojiAvatar id="aly" size={24} />
                      </View>
                    </View>
                  </View>
                }
              />
              <View style={styles.pillBanner}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.pillBannerText}>Aly joined the room Live</Text>
              </View>
            </View>
          )}

          {slide === 1 && (
            <View style={styles.slidersPreviewCard}>
              <View style={styles.sliderItemHeader}>
                <Text style={styles.itemHeaderName}>Burgers ×4</Text>
                <Text style={styles.itemHeaderPrice}>$120.00</Text>
              </View>
              <View style={styles.sliderBox}>
                <View style={styles.sliderHeader}>
                  <View style={styles.sliderUserRow}>
                    <MemojiAvatar id="you" size={28} />
                    <Text style={styles.sliderName}>You</Text>
                  </View>
                  <Text style={styles.sliderPercent}>25%  $30.00</Text>
                </View>
                <View style={styles.sliderBar}>
                  <View style={[styles.sliderFill, { width: '25%' }]} />
                </View>
              </View>
              <View style={styles.sliderBox}>
                <View style={styles.sliderHeader}>
                  <View style={styles.sliderUserRow}>
                    <MemojiAvatar id="mia" size={28} />
                    <Text style={styles.sliderName}>Mia</Text>
                  </View>
                  <Text style={styles.sliderPercent}>25%  $30.00</Text>
                </View>
                <View style={styles.sliderBar}>
                  <View style={[styles.sliderFill, { width: '25%' }]} />
                </View>
              </View>
            </View>
          )}

          {slide === 2 && (
            <View style={styles.settlePreviewArea}>
              <View style={styles.darkSettleTicket}>
                <Text style={styles.darkSubtext}>Your share to pay</Text>
                <Text style={styles.darkPrice}>$52.50</Text>
                <View style={styles.amberBtnMock}>
                  <Text style={styles.amberBtnText}>Pay Now</Text>
                </View>
              </View>
              <View style={styles.paidMockRow}>
                <View style={styles.paidUserRow}>
                  <MemojiAvatar id="mia" size={28} />
                  <Text style={styles.mockName}>Mia</Text>
                </View>
                <Badge label="Paid" variant="emerald" />
              </View>
              <View style={styles.paidMockRow}>
                <View style={styles.paidUserRow}>
                  <MemojiAvatar id="jonas" size={28} />
                  <Text style={styles.mockName}>Jonas</Text>
                </View>
                <Badge label="Paid" variant="emerald" />
              </View>
            </View>
          )}
        </View>

        {/* Text descriptions */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>{slides[slide].title}</Text>
          <Text style={styles.mainSubtitle}>{slides[slide].subtitle}</Text>
        </View>

        {/* Paging Indicators */}
        <View style={styles.indicatorRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                slide === i && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Bottom CTAs */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>{slides[slide].cta}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accountLink}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.accountLinkText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  illustrationArea: {
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ticketAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitWays: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  avatarMiniStack: {
    flexDirection: 'row',
  },
  miniWrap: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 13,
  },
  pillBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginTop: -8,
  },
  greenLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 8,
  },
  pillBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  slidersPreviewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  sliderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemHeaderPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sliderBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sliderPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  sliderBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  settlePreviewArea: {
    width: '100%',
    gap: 10,
  },
  darkSettleTicket: {
    backgroundColor: Colors.cardMidnight,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  darkSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  darkPrice: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    marginVertical: 8,
  },
  amberBtnMock: {
    backgroundColor: Colors.amber,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  amberBtnText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  paidMockRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  paidUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textContainer: {
    marginVertical: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  accountLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  accountLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
