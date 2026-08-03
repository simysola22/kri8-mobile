/**
 * NotificationService
 *
 * Interactive push notification architecture.
 * Handles registration, channel setup, action buttons, and deep-link routing.
 *
 * Notification categories (actionable):
 *  - friend_request   → Accept Friend / Dismiss
 *  - new_message      → Reply / Mark Read
 *  - trend_alert      → Open / Dismiss
 *  - reminder         → Open Idea / Dismiss
 *  - collaboration    → Open / Dismiss
 *  - schedule         → Open / Dismiss
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { analytics } from './analytics/AnalyticsService';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kri8-obvh.onrender.com';

// ── Types ─────────────────────────────────────────────────────

export type NotificationCategory =
  | 'friend_request'
  | 'new_message'
  | 'trend_alert'
  | 'reminder'
  | 'collaboration'
  | 'schedule';

export interface NotificationPayload {
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, string | number>;
}

// ── Channel setup (Android) ───────────────────────────────────

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C6EF5',
  });

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100],
    lightColor: '#7C6EF5',
  });

  await Notifications.setNotificationChannelAsync('trends', {
    name: 'Trends',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// ── Action categories (iOS interactive notifications) ─────────

async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('friend_request', [
    { identifier: 'accept', buttonTitle: 'Accept', options: { opensAppToForeground: false } },
    { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: true, opensAppToForeground: false } },
  ]);

  await Notifications.setNotificationCategoryAsync('new_message', [
    { identifier: 'reply', buttonTitle: 'Reply', options: { opensAppToForeground: true } },
    { identifier: 'mark_read', buttonTitle: 'Mark Read', options: { opensAppToForeground: false } },
  ]);

  await Notifications.setNotificationCategoryAsync('trend_alert', [
    { identifier: 'open', buttonTitle: 'View Trend', options: { opensAppToForeground: true } },
    { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: false, opensAppToForeground: false } },
  ]);

  await Notifications.setNotificationCategoryAsync('reminder', [
    { identifier: 'open_idea', buttonTitle: 'Open Idea', options: { opensAppToForeground: true } },
    { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: true, opensAppToForeground: false } },
  ]);

  await Notifications.setNotificationCategoryAsync('collaboration', [
    { identifier: 'open', buttonTitle: 'View', options: { opensAppToForeground: true } },
    { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: false, opensAppToForeground: false } },
  ]);
}

// ── Registration ──────────────────────────────────────────────

/**
 * Request permissions, set up channels/categories, and register the push token.
 * Call once after the user signs in.
 */
export async function setupNotifications(token: string, userId: number): Promise<void> {
  await setupAndroidChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  await setupNotificationCategories();

  // Register push token with the backend
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await fetch(`${API_BASE}/api/users/me/push-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokenData.data, platform: Platform.OS }),
    });
  } catch {
    // Non-fatal — push tokens can be re-registered on next launch
  }
}

// ── Action handler ────────────────────────────────────────────

export type NotificationActionHandler = (
  action: string,
  data: Record<string, string | number>,
) => void | Promise<void>;

/**
 * Register a handler for notification actions (button taps).
 * Returns an unsubscribe function.
 */
export function onNotificationAction(handler: NotificationActionHandler): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = (response.notification.request.content.data ?? {}) as Record<string, string | number>;

    analytics.track('notification_opened', { action: actionId });

    void handler(actionId, data);
  });
  return () => sub.remove();
}

/**
 * Register a handler for foreground notifications.
 * Returns an unsubscribe function.
 */
export function onNotificationReceived(
  handler: (notification: Notifications.Notification) => void,
): () => void {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    analytics.track('notification_received');
    handler(notification);
  });
  return () => sub.remove();
}

// ── Local scheduling (reminders) ─────────────────────────────

/** Schedule a local reminder notification. */
export async function scheduleReminder(
  ideaId: number,
  ideaTitle: string,
  scheduledAt: Date,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to create 🎬',
      body: ideaTitle,
      categoryIdentifier: 'reminder',
      data: { ideaId, screen: 'idea_detail' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
    },
  });
}

/** Cancel a scheduled reminder. */
export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
