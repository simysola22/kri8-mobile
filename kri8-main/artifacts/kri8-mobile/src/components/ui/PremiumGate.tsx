/**
 * PremiumGate
 *
 * Wraps any content that may require a paid tier in the future.
 * At launch all gates are OPEN — no restrictions apply.
 *
 * Usage:
 *   <PremiumGate entitlement="media_uploads">
 *     <MediaUploadButton />
 *   </PremiumGate>
 *
 * When a gate is closed, children are replaced by an upgrade prompt.
 */
import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { entitlements, type Entitlement } from '@/services/subscription/EntitlementService';
import { useActiveTheme } from '@/stores/theme';

interface PremiumGateProps {
  entitlement: Entitlement;
  children: ReactNode;
  /**
   * Custom fallback shown when the gate is closed.
   * Defaults to a standard "Upgrade to unlock" prompt.
   */
  fallback?: ReactNode;
  /**
   * Called when the user taps the upgrade CTA.
   * Wire to the paywall screen when monetization is activated.
   */
  onUpgrade?: () => void;
}

export function PremiumGate({
  entitlement,
  children,
  fallback,
  onUpgrade,
}: PremiumGateProps) {
  // All entitlements are currently open — render children directly
  if (entitlements.canUse(entitlement)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <DefaultUpgradePrompt
      entitlement={entitlement}
      onUpgrade={onUpgrade}
    />
  );
}

// ── Default upgrade prompt ─────────────────────────────────────

function DefaultUpgradePrompt({
  entitlement,
  onUpgrade,
}: {
  entitlement: Entitlement;
  onUpgrade?: () => void;
}) {
  const theme = useActiveTheme();

  const tierLabel: Record<string, string> = {
    creator: 'Creator',
    pro: 'Pro',
  };

  const minTier = entitlements.minimumTierFor(entitlement);
  const tierName = tierLabel[minTier] ?? 'Premium';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.bgGlass, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.icon]}>✨</Text>
      <Text style={[styles.title, { color: theme.text }]}>
        {tierName} Feature
      </Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Upgrade to Kri8 {tierName} to unlock this feature.
      </Text>
      {onUpgrade && (
        <TouchableOpacity
          onPress={onUpgrade}
          style={[styles.button, { backgroundColor: theme.accent }]}
          accessibilityRole="button"
          accessibilityLabel={`Upgrade to ${tierName}`}
        >
          <Text style={[styles.buttonText, { color: theme.accentContrast }]}>
            Upgrade to {tierName}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
