import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTakoTheme } from '@/context/ThemeContext';
import { previewInviteByCode } from '@/lib/takoData';

export default function JoinCodeDeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { palette } = useTakoTheme();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await previewInviteByCode(code ?? '');
      if (cancelled) return;
      if (res.ok) {
        const row = res.preview;
        router.replace({
          pathname: '/group/join-split',
          params: {
            code: row.invite_code,
            name: row.name,
            totalCents: String(row.total_cents),
            itemCount: String(row.item_count),
            memberCount: String(row.member_count),
            paidBy: row.paid_by,
            membersJson: JSON.stringify(row.members ?? []),
          },
        });
      } else {
        router.replace('/(tabs)/scan');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.plum }]}>
      <ActivityIndicator size="large" color={palette.coral} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
