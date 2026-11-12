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
      <View style={styles.emptyWrap}>
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
          <View key={member.id} style={[styles.cardWrapper, Shadows.cardSoft]}>
            <View style={styles.cardShadow} />
            <View style={styles.card}>
              <View style={styles.avatarWrap}>
                <MemojiAvatar id={(member.avatarUrl as MemojiId) || 'you'} size={46} />
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
    borderColor: Colors.ink,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardWrapper: {
    position: 'relative',
    width: 82,
  },
  cardShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: Radii.md,
    backgroundColor: Colors.ink,
  },
  card: {
    width: 82,
    backgroundColor: Colors.card,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    borderRadius: Radii.md,
    paddingTop: 10,
    paddingBottom: 8,
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
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 5,
    maxWidth: '100%',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
});
