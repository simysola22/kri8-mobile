import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useActiveTheme, useTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useCurrentUser, useUpdateUser } from '@/hooks/useUser';
import { useIdeaStats } from '@/hooks/useIdeas';
import { clearQueue } from '@/stores/offlineQueue';
import { THEME_LIST } from '@/themes';
import { tapLight, tapHeavy } from '@/lib/haptics';
import type { ThemeName } from '@/types';
import { useBiometric } from '@/hooks/useBiometric';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';

export default function ProfileScreen() {
  const theme = useActiveTheme();
  const { setTheme, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: stats } = useIdeaStats();
  const updateUser = useUpdateUser();
  const {
    isAvailable,
    isEnabled,
    setEnabled,
    authenticate,
    isChecking,
    supportedTypes,
    refreshAvailability,
  } = useBiometric();

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await tapHeavy();
          clearQueue();
          await signOut();
        },
      },
    ]);
  };

  const handleThemeChange = async (name: ThemeName) => {
    await tapLight();
    setTheme(name);
    // Sync theme preference to backend
    updateUser.mutate({ themePreference: name });
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
           { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 112 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <GlassCard style={styles.profileCard}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.name ?? user?.username}
            size="xl"
          />
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name ?? 'Creator'}
          </Text>
          {user?.username && (
            <Text style={[styles.userHandle, { color: theme.textMuted }]}>
              @{user.username}
            </Text>
          )}
          {user?.bio && (
            <Text style={[styles.userBio, { color: theme.textMuted }]}>
              {user.bio}
            </Text>
          )}
          {user?.isPublic && <Badge variant="success">Public Profile</Badge>}
        </GlassCard>

        {/* Stats */}
        {stats && (
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              {[
                { label: 'Ideas', value: stats.total },
                { label: 'Used', value: stats.used },
                { label: 'Branches', value: stats.totalBranches },
              ].map(({ label, value }, idx) => (
                <React.Fragment key={label}>
                  {idx > 0 && (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  )}
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: theme.text }]}>{value}</Text>
                    <Text style={[styles.statLbl, { color: theme.textMuted }]}>{label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Theme picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
          <View style={styles.themeGrid}>
            {THEME_LIST.map((t) => (
              <TouchableOpacity
                key={t.name}
                onPress={() => void handleThemeChange(t.name)}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: t.bg,
                    borderColor: themeName === t.name ? t.accent : t.border,
                    borderWidth: themeName === t.name ? 2 : 1,
                  },
                ]}
              >
                {/* Colour swatch */}
                <View style={[styles.themeSwatch, { backgroundColor: t.accent }]} />
                <Text
                  style={[styles.themeLabel, { color: t.text }]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
                {themeName === t.name && (
                  <Text style={{ color: t.accent, fontSize: 10 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Security</Text>
          <GlassCard style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <View style={styles.securityCopy}>
                <Text style={[styles.securityTitle, { color: theme.text }]}>
                  Biometric unlock
                </Text>
                <Text style={[styles.securitySubtitle, { color: theme.textMuted }]}>
                  {isChecking
                    ? 'Checking this device…'
                    : isAvailable
                      ? `${formatBiometricTypes(supportedTypes)} available`
                      : 'Not available on this device'}
                </Text>
              </View>
              <TouchableOpacity
                disabled={isChecking || (!isAvailable && !isEnabled)}
                onPress={() => {
                  if (isEnabled) {
                    setEnabled(false);
                    return;
                  }
                  void authenticate('Confirm biometric unlock').then((result) => {
                    if (result.success) {
                      setEnabled(true);
                    } else {
                      Alert.alert(
                        'Biometric unlock not enabled',
                        result.error === 'user_cancel'
                          ? 'The setup was cancelled.'
                          : 'Authentication failed. Try again when you are ready.',
                      );
                    }
                  });
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: isEnabled, disabled: isChecking || !isAvailable }}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: isEnabled ? theme.accent : theme.bgGlassDeep,
                    borderColor: isEnabled ? theme.accent : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { backgroundColor: isEnabled ? '#FFFFFF' : theme.textMuted },
                  ]}
                />
              </TouchableOpacity>
            </View>
            {isEnabled && (
              <Text style={[styles.securityHint, { color: theme.textMuted }]}>
                Kri8 will lock when you return to the app. You can always use account sign-in
                from the lock screen.
              </Text>
            )}
            {!isAvailable && !isChecking && (
              <GlassButton
                variant="ghost"
                size="sm"
                onPress={() => void refreshAvailability()}
              >
                Check again
              </GlassButton>
            )}
          </GlassCard>
        </View>

        <View style={styles.syncRow}>
          <Text style={[styles.syncLabel, { color: theme.textMuted }]}>Sync status</Text>
          <SyncStatusIndicator />
        </View>

        {/* Sign out */}
        <GlassButton
          onPress={handleSignOut}
          variant="ghost"
          fullWidth
          size="lg"
        >
          Sign Out
        </GlassButton>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 22 },
  profileCard: { alignItems: 'center', gap: 10 },
  userName: { fontSize: 26, fontWeight: '800', marginTop: 5, letterSpacing: -0.5 },
  userHandle: { fontSize: 15, marginTop: -5 },
  userBio: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 2 },
  statsCard: {},
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  divider: { width: 1, height: 44 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    minWidth: '46%',
    minHeight: 48,
  },
  themeSwatch: { width: 10, height: 10, borderRadius: 5 },
  themeLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  securityCard: { gap: 14 },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  securityCopy: { flex: 1, gap: 5 },
  securityTitle: { fontSize: 17, fontWeight: '700' },
  securitySubtitle: { fontSize: 13, lineHeight: 19 },
  securityHint: { fontSize: 13, lineHeight: 19 },
  toggle: {
    width: 54,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, alignSelf: 'flex-start' },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  syncLabel: { fontSize: 13 },
});

function formatBiometricTypes(
  types: import('expo-local-authentication').AuthenticationType[],
): string {
  const labels = types.map((type) => {
    switch (type) {
      case 1:
        return 'fingerprint';
      case 2:
        return 'facial recognition';
      case 3:
        return 'iris';
      default:
        return 'biometrics';
    }
  });
  return labels.length > 0 ? labels.join(' / ') : 'Biometrics';
}
