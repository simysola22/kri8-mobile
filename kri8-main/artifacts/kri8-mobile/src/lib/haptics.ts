import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback wrappers.
 * All functions are safe to call on web / simulator (they no-op gracefully).
 */

/** Light tap — button presses, selections. */
export async function tapLight(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — confirming an action, marking an idea as used. */
export async function tapMedium(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — destructive actions, errors. */
export async function tapHeavy(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success — idea saved, sync complete. */
export async function notifySuccess(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning — approaching limit, degraded state. */
export async function notifyWarning(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Error — failed action, network error. */
export async function notifyError(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Selection change — scrolling through pickers, theme selector. */
export async function selectionChanged(): Promise<void> {
  await Haptics.selectionAsync();
}
