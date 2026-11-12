import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Colors, Motion, Radii, Shadows, Spacing, TouchTarget, Typography } from '../constants/theme';
import { BillAward } from '../services/awardsEngine';
import { CurrencyCode, formatMoney } from '../services/currency';
import { AppLanguage, t } from '../constants/i18n';
import { TakoMascot } from './TakoMascot';
import { MemojiAvatar, MemojiId, resolveAnimal } from './MemojiAvatar';
import { NeoButton, NeoCard } from './NeoUI';
import { Badge } from './Badge';
import { triggerHaptic } from '../services/feedbackEngine';

export type RecapAspect = 'portrait' | 'square';

interface RecapCardProps {
  groupName: string;
  dateLabel: string;
  totalCents: number;
  perPersonCents: number;
  currency: CurrencyCode;
  language: AppLanguage;
  awards: BillAward[];
  hideAmounts: boolean;
  onToggleHideAmounts: (next: boolean) => void;
  selectedAnimal: 'bear' | 'fox' | 'panda' | 'frog' | 'cat';
}

export function RecapCard({
  groupName,
  dateLabel,
  totalCents,
  perPersonCents,
  currency,
  language,
  awards,
  hideAmounts,
  onToggleHideAmounts,
  selectedAnimal,
}: RecapCardProps) {
  const [aspect, setAspect] = useState<RecapAspect>('portrait');
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = async () => {
    setIsSharing(true);
    setShareError(null);
    setShareFeedback(null);
    try {
      const totalStr = formatMoney(totalCents, currency, { hidden: hideAmounts });
      const perPersonStr = formatMoney(perPersonCents, currency, { hidden: hideAmounts });
      const awardLines = awards.map((a) => `• ${a.title}: ${a.winnerName} (${a.detail})`).join('\n');
      const message = `${groupName} · ${dateLabel}\nTotal: ${totalStr} (${perPersonStr}/person)\n\nAwards:\n${awardLines}\n\nSplit with TabTogether`;

      await Share.share({
        title: `${groupName} Recap`,
        message,
      });
      triggerHaptic('success');
      setShareFeedback(Platform.OS === 'web' ? 'Recap ready to share' : 'Shared!');
    } catch {
      triggerHaptic('warning');
      setShareError('Could not open share sheet. Try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {/* Controls: Aspect Toggle + Privacy Hide Amounts (ON by default) */}
      <NeoCard borderRadius={Radii.card} contentStyle={styles.controlsCard}>
        <View style={styles.aspectRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Portrait 1080 by 1920 story size"
            onPress={() => setAspect('portrait')}
            style={({ pressed }) => [
              styles.aspectPill,
              aspect === 'portrait' && styles.aspectPillActive,
              pressed && { transform: [{ scale: Motion.pressScale }] },
            ]}
          >
            <Text style={[styles.aspectText, aspect === 'portrait' && styles.aspectTextActive]}>
              Story 9:16
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Square 1 to 1 post size"
            onPress={() => setAspect('square')}
            style={({ pressed }) => [
              styles.aspectPill,
              aspect === 'square' && styles.aspectPillActive,
              pressed && { transform: [{ scale: Motion.pressScale }] },
            ]}
          >
            <Text style={[styles.aspectText, aspect === 'square' && styles.aspectTextActive]}>
              Square 1:1
            </Text>
          </Pressable>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>{t(language, 'hideAmounts')}</Text>
            <Text style={styles.toggleSub}>
              Keeps private totals masked when posting publicly
            </Text>
          </View>
          <Switch
            accessibilityLabel={t(language, 'hideAmounts')}
            value={hideAmounts}
            onValueChange={onToggleHideAmounts}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </NeoCard>

      {/* Visual Recap Card */}
      <View
        style={[
          styles.posterCard,
          Shadows.card,
          aspect === 'square' ? styles.posterSquare : styles.posterPortrait,
        ]}
      >
        <View style={styles.posterHeader}>
          <View style={{ flex: 1 }}>
            <Badge label={dateLabel} variant="blue" />
            <Text style={styles.posterTitle} numberOfLines={2}>
              {groupName}
            </Text>
          </View>
          <TakoMascot size={66} mood="celebrating" />
        </View>

        <View style={styles.figuresRow}>
          <View style={styles.figureBlock}>
            <Text style={styles.figureLabel}>Total</Text>
            <Text style={styles.figureValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(totalCents, currency, { hidden: hideAmounts })}
            </Text>
          </View>
          <View style={styles.figureDivider} />
          <View style={styles.figureBlock}>
            <Text style={styles.figureLabel}>Per person</Text>
            <Text style={styles.figureValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(perPersonCents, currency, { hidden: hideAmounts })}
            </Text>
          </View>
        </View>

        {awards.length === 0 ? (
          <View style={styles.emptyAwards}>
            <Text style={styles.emptyAwardsText}>
              Settle the bill to unlock tonight&apos;s awards.
            </Text>
          </View>
        ) : (
          <View style={styles.awardsList}>
            {awards.map((award) => {
              const avatarId: MemojiId =
                award.winnerAvatarKey === 'you'
                  ? selectedAnimal
                  : resolveAnimal(award.winnerAvatarKey as MemojiId);
              return (
                <View key={award.id} style={styles.awardRow}>
                  <MemojiAvatar id={avatarId} size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.awardTitle} numberOfLines={1}>
                      {award.title} · {award.winnerName}
                    </Text>
                    <Text style={styles.awardRule} numberOfLines={1}>
                      {award.rule}
                    </Text>
                  </View>
                  <Badge label={award.detail} variant="amber" />
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.posterFooter}>TabTogether · Eight arms. Zero drama.</Text>
      </View>

      {shareError && <Text style={styles.errorText}>{shareError}</Text>}
      {shareFeedback && <Text style={styles.successText}>{shareFeedback}</Text>}

      <NeoButton
        label={isSharing ? 'Preparing recap…' : t(language, 'shareRecap')}
        onPress={handleShare}
        disabled={isSharing}
        backgroundColor={Colors.primary}
        textColor="#FFFFFF"
        height={52}
        fontSize={16}
      >
        {isSharing ? <ActivityIndicator color="#FFFFFF" /> : null}
      </NeoButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
  },
  controlsCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  aspectRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  aspectPill: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  aspectText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  aspectTextActive: {
    color: Colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  posterCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.cardLg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  posterPortrait: {
    minHeight: 440,
  },
  posterSquare: {
    minHeight: 330,
  },
  posterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  posterTitle: {
    ...Typography.sectionTitle,
    fontSize: 22,
    marginTop: Spacing.sm,
  },
  figuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.card,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  figureBlock: {
    flex: 1,
  },
  figureDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  figureLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  figureValue: {
    ...Typography.currencyMedium,
    fontSize: 24,
    marginTop: 2,
  },
  emptyAwards: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyAwardsText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  awardsList: {
    gap: Spacing.sm,
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  awardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  awardRule: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  posterFooter: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
    textAlign: 'center',
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mintText,
    textAlign: 'center',
  },
});
