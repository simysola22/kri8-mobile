import React from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
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
import {
  useFriends,
  useRespondToFriendRequest,
  useConversations,
  useSearchUsers,
  useSendFriendRequest,
} from '@/hooks/useSocial';
import { tapMedium } from '@/lib/haptics';
import type { Conversation, UserPublic, FriendRequest } from '@/types';

export default function CommunityScreen() {
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const { data: friends, isLoading, refetch, isRefetching } = useFriends();
  const { data: conversations } = useConversations();
  const [search, setSearch] = React.useState('');
  const { data: searchResults = [], isLoading: isSearching, isFetching: isSearchFetching } =
    useSearchUsers(search);
  const sendRequest = useSendFriendRequest();
  const respond = useRespondToFriendRequest();

  const pendingRequests = friends?.pendingReceived ?? [];
  const friendIds = new Set((friends?.friends ?? []).map((user) => user.id));
  const pendingSentIds = new Set(
    (friends?.pendingSent ?? [])
      .map((request) => request.addressee?.id ?? request.addresseeId)
      .filter((id): id is number => typeof id === 'number'),
  );
  const pendingReceivedIds = new Set(
    (friends?.pendingReceived ?? [])
      .map((request) => request.requester?.id ?? request.requesterId)
      .filter((id): id is number => typeof id === 'number'),
  );

  const getFriendState = (userId: number): 'friend' | 'pending' | 'add' => {
    if (friendIds.has(userId)) return 'friend';
    if (pendingSentIds.has(userId) || pendingReceivedIds.has(userId)) return 'pending';
    return 'add';
  };

  const handleSendRequest = async (user: UserPublic) => {
    try {
      await sendRequest.mutateAsync(user.id);
      Alert.alert('Request sent', `Your request to ${user.name ?? user.username ?? 'this user'} was sent.`);
    } catch (error) {
      Alert.alert('Could not send request', getErrorMessage(error));
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <FlatList
        data={friends?.friends ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
           { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 112 },
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

            <View style={styles.discoverSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Discover people
              </Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or username"
                placeholderTextColor={theme.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.searchInput,
                  {
                    color: theme.text,
                    borderColor: search ? theme.borderActive : theme.border,
                    backgroundColor: theme.bgGlass,
                  },
                ]}
              />
              {search.trim().length >= 2 && (
                <View style={styles.searchResults}>
                  {(isSearching || isSearchFetching) && <LoadingSpinner />}
                  {!isSearching && !isSearchFetching && searchResults.length === 0 && (
                    <Text style={[styles.helperText, { color: theme.textMuted }]}>
                      No matching users yet.
                    </Text>
                  )}
                  {searchResults.map((user) => (
                    <DiscoverRow
                      key={user.id}
                      user={user}
                      state={getFriendState(user.id)}
                      onAdd={() => void handleSendRequest(user)}
                      disabled={sendRequest.isPending}
                    />
                  ))}
                </View>
              )}
            </View>

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
              Conversations
            </Text>
            {conversations?.map((conversation) => (
              <ConversationRow key={conversation.partner.id} conversation={conversation} />
            ))}
            {conversations?.length === 0 && (
              <Text style={[styles.helperText, { color: theme.textMuted }]}>
                Your conversations will appear here.
              </Text>
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
  onReject: () => void | Promise<void>;
}) {
  const theme = useActiveTheme();
  const requester = request.requester;
  return (
    <GlassCard style={styles.requestCard}>
      <View style={styles.requestIdentity}>
        <Avatar
          uri={requester?.avatarUrl}
          name={requester?.name ?? requester?.username ?? 'User'}
          size="sm"
        />
        <Text style={[styles.requestText, { color: theme.text }]}>
          {requester?.name ?? requester?.username ?? `User #${request.requesterId ?? 'unknown'}`}
          {' wants to connect'}
        </Text>
      </View>
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

function DiscoverRow({
  user,
  state,
  onAdd,
  disabled,
}: {
  user: UserPublic;
  state: 'friend' | 'pending' | 'add';
  onAdd: () => void;
  disabled: boolean;
}) {
  const theme = useActiveTheme();
  const identity = (
    <>
      <Avatar uri={user.avatarUrl} name={user.name ?? user.username} size="sm" />
      <View style={styles.discoverInfo}>
        <Text style={[styles.friendName, { color: theme.text }]}>
          {user.name ?? user.username ?? 'Unknown'}
        </Text>
        {user.username && (
          <Text style={[styles.friendUsername, { color: theme.textMuted }]}>
            @{user.username}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <GlassCard style={styles.discoverCard}>
      {user.username ? (
        <Link href={`/(tabs)/profile/${user.username}`} asChild>
          <TouchableOpacity style={styles.discoverIdentity} activeOpacity={0.85}>
            {identity}
          </TouchableOpacity>
        </Link>
      ) : (
        <View style={styles.discoverIdentity}>{identity}</View>
      )}
      <TouchableOpacity
        onPress={onAdd}
        disabled={disabled || state !== 'add'}
        style={[
          styles.requestButton,
          { backgroundColor: state === 'add' ? theme.accentSoft : theme.bgGlass },
        ]}
      >
        <Text
          style={[
            styles.requestButtonText,
            { color: state === 'add' ? theme.accent : theme.textMuted },
          ]}
        >
          {state === 'friend' ? 'Friend' : state === 'pending' ? 'Pending' : 'Add'}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const theme = useActiveTheme();
  const partner = conversation.partner;
  return (
    <Link href={`/(tabs)/community/messages/${partner.id}`} asChild>
      <TouchableOpacity activeOpacity={0.85}>
        <GlassCard style={styles.conversationCard}>
          <Avatar uri={partner.avatarUrl} name={partner.name ?? partner.username} size="md" />
          <View style={styles.conversationInfo}>
            <Text style={[styles.friendName, { color: theme.text }]}>
              {partner.name ?? partner.username ?? 'Unknown'}
            </Text>
            <Text style={[styles.messagePreview, { color: theme.textMuted }]} numberOfLines={1}>
              {conversation.lastMessage.content}
            </Text>
          </View>
          {conversation.unreadCount > 0 && (
            <Badge variant="accent">{conversation.unreadCount}</Badge>
          )}
          <Text style={[styles.arrow, { color: theme.textFaint }]}>→</Text>
        </GlassCard>
      </TouchableOpacity>
    </Link>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 22, gap: 14 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1, marginBottom: 14 },
  discoverSection: { gap: 10, marginBottom: 4 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  searchResults: { gap: 10 },
  helperText: { fontSize: 14, lineHeight: 20 },
  section: { gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  discoverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68 },
  discoverIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  discoverInfo: { flex: 1, gap: 4 },
  requestButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  requestButtonText: { fontSize: 13, fontWeight: '700' },
  conversationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 78 },
  conversationInfo: { flex: 1, gap: 4 },
  messagePreview: { fontSize: 13, lineHeight: 18 },
  friendCard: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 82 },
  friendInfo: { flex: 1, gap: 5 },
  friendName: { fontSize: 17, fontWeight: '600' },
  friendUsername: { fontSize: 14 },
  arrow: { fontSize: 20 },
  requestCard: { gap: 12 },
  requestIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestText: { flex: 1, fontSize: 15, lineHeight: 21 },
  requestActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  acceptBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22 },
  acceptText: { fontSize: 14, fontWeight: '700' },
  rejectText: { fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 76, gap: 14 },
  emptyIcon: { fontSize: 42, lineHeight: 48 },
  emptyText: { fontSize: 16, lineHeight: 22 },
});
