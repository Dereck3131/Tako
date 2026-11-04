import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { RoomMember } from '../types/database';
import { Colors, Radii } from '../constants/theme';

interface PeopleCarouselProps {
  members: RoomMember[];
}

export const PeopleCarousel: React.FC<PeopleCarouselProps> = ({ members }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {members.map((member) => (
        <View key={member.id} style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{member.displayName}</Text>
          <Text style={styles.status}>{member.connectionStatus}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: 96,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  status: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
