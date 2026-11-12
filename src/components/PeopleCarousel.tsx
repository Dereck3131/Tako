import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoomMember } from '../types/database';
import { Border, Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { MemojiAvatar, MemojiId } from './MemojiAvatar';

interface PeopleCarouselProps {
  members: RoomMember[];
}

export function PeopleCarousel({ members }: PeopleCarouselProps) {
  const guests = members.filter((m) => m.role !== 'host');

  if (guests.length === 0) {
    return (
      <View style={[styles.emptyWrap, Shadows.cardSoft]}>
        <Text style={styles.emptyText}>Waiting for friends to join…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {guests.map((member) => {
        const isJoining = member.connectionStatus.toLowerCase().includes('joining');
        return (
          <View key={member.id} style={[styles.card, Shadows.cardSoft]}>
            <View style={styles.avatarWrap}>
              <MemojiAvatar id={(member.avatarUrl as MemojiId) || 'you'} size={44} />
            </View>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {member.displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.status,
                { color: isJoining ? Colors.amberText : Colors.mintText },
              ]}
            >
              {isJoining ? 'Joining' : 'Live'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 10,
    paddingBottom: 6,
    paddingRight: 8,
  },
  emptyWrap: {
    backgroundColor: Colors.card,
    borderWidth: Border.width,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  card: {
    width: 82,
    backgroundColor: Colors.card,
    borderWidth: Border.width,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 6,
    maxWidth: '100%',
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
