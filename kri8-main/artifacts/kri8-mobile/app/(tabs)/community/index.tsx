import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFriends, useRespondToFriendRequest, useConversations } from '@/hooks/useSocial';
import { tapMedium } from '@/lib/haptics';
import type { UserPublic, FriendRequest } from '@/types';

export default function CommunityScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const { data: friends, isLoading, refetch, isRefetching } = useFriends();
  const { data: conversations } = useConversations();
  const respond = useRespondToFriendRequest();

  const pendingRequests = friends?.pendingReceived ?? [];

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <FlatList
        data={friends?.friends ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: theme.text }]}>Community</Text>

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Friend Requests{' '}
                  <Badge variant="accent">{pendingRequests.length}</Badge>
                </Text>
                {pendingRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onAccept={async () => {
                      await tapMedium();
                      await respond.mutateAsync({ requestId: req.id, status: 'accepted' });
                    }}
                    onReject={() =>
                      respond.mutate({ requestId: req.id, status: 'rejected' })
                    }
                  />
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Friends
            </Text>
            {isLoading && <LoadingSpinner style={{ marginTop: 24 }} />}
          </>
        }
        renderItem={({ item }) => <FriendRow user={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No friends yet
              </Text>
            </View>
          ) : null
        }
      />
    </LinearGradient>
  );
}

function FriendRow({ user }: { user: UserPublic }) {
  const theme = useActiveTheme();
  return (
    <Link href={`/(tabs)/community/messages/${user.id}`} asChild>
      <TouchableOpacity activeOpacity={0.85}>
        <GlassCard style={styles.friendCard}>
          <Avatar uri={user.avatarUrl} name={user.name ?? user.username} size="md" />
          <View style={styles.friendInfo}>
            <Text style={[styles.friendName, { color: theme.text }]}>
              {user.name ?? user.username ?? 'Unknown'}
            </Text>
            {user.username && (
              <Text style={[styles.friendUsername, { color: theme.textMuted }]}>
                @{user.username}
              </Text>
            )}
          </View>
          <Text style={[styles.arrow, { color: theme.textFaint }]}>→</Text>
        </GlassCard>
      </TouchableOpacity>
    </Link>
  );
}

function RequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: FriendRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  const theme = useActiveTheme();
  return (
    <GlassCard style={styles.requestCard}>
      <Text style={[styles.requestText, { color: theme.text }]}>
        User #{request.requesterId} wants to connect
      </Text>
      <View style={styles.requestActions}>
        <TouchableOpacity
          onPress={onAccept}
          style={[styles.acceptBtn, { backgroundColor: theme.accentSoft }]}
        >
          <Text style={[styles.acceptText, { color: theme.accent }]}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReject}>
          <Text style={[styles.rejectText, { color: theme.textMuted }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 10 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  section: { gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  friendCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendInfo: { flex: 1, gap: 2 },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendUsername: { fontSize: 13 },
  arrow: { fontSize: 18 },
  requestCard: { gap: 10 },
  requestText: { fontSize: 15 },
  requestActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  acceptBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  acceptText: { fontSize: 14, fontWeight: '700' },
  rejectText: { fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16 },
});
