import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RoomMember } from '../types/database';
import { Colors, Radii } from '../constants/theme';
import { MemojiAvatar, MemojiId } from './MemojiAvatar';

interface PeopleCarouselProps {
  members: RoomMember[];
}

export const PeopleCarousel: React.FC<PeopleCarouselProps> = ({ members }) => {
  const getMemojiId = (name: string): MemojiId => {
    const lower = name.toLowerCase();
    if (lower.includes('mia')) return 'mia';
    if (lower.includes('jonas')) return 'jonas';
    if (lower.includes('aly')) return 'aly';
    if (lower.includes('ken')) return 'ken';
    return 'you';
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {members.map((member) => {
        const memojiId = getMemojiId(member.displayName);
        const isJoining = member.connectionStatus.includes('Joining');

        return (
          <View key={member.id} style={styles.card}>
            <View style={styles.avatarWrapper}>
              <MemojiAvatar id={memojiId} size={52} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {member.displayName}
            </Text>
            <Text
              style={[
                styles.status,
                isJoining && { color: Colors.amberText },
              ]}
              numberOfLines={1}
            >
              {member.connectionStatus}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: 102,
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  status: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
