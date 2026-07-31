import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useActiveTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useMessages, useSendMessage } from '@/hooks/useSocial';
import { tapLight } from '@/lib/haptics';
import type { Message } from '@/types';

export default function MessagesScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const recipientId = Number(userId);
  const theme = useActiveTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const listRef = useRef<FlatList>(null);

  const [content, setContent] = useState('');
  const { data: messages } = useMessages(recipientId);
  const sendMessage = useSendMessage();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!content.trim()) return;
    const text = content.trim();
    setContent('');
    await tapLight();
    await sendMessage.mutateAsync({ userId: recipientId, content: text });
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>
          Messages
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: 16 },
          ]}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.senderId.toString() !== userId}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No messages yet. Say hello!
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.tabBarBg,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.bgGlass,
                borderColor: content ? theme.borderActive : theme.border,
                color: theme.text,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Message…"
            placeholderTextColor={theme.textFaint}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => void handleSend()}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={!content.trim() || sendMessage.isPending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: content.trim()
                  ? theme.accent
                  : theme.bgGlass,
              },
            ]}
          >
            <Text
              style={[
                styles.sendText,
                {
                  color: content.trim() ? theme.accentContrast : theme.textFaint,
                },
              ]}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const theme = useActiveTheme();
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: theme.accent }
            : { backgroundColor: theme.bgGlassDeep, borderWidth: 1, borderColor: theme.border },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isOwn ? theme.accentContrast : theme.text },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  back: { fontSize: 28, width: 40 },
  navTitle: { fontSize: 17, fontWeight: '700' },
  messageList: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { fontSize: 20, fontWeight: '700' },
});
