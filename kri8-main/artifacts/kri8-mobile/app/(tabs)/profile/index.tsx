import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useActiveTheme, useTheme } from '@/stores/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useCurrentUser, useUpdateUser, useUsernameAvailability } from '@/hooks/useUser';
import { useIdeaStats } from '@/hooks/useIdeas';
import { clearQueue } from '@/stores/offlineQueue';
import { THEME_LIST } from '@/themes';
import { tapLight, tapHeavy } from '@/lib/haptics';
import type { ThemeName } from '@/types';
import { useBiometric } from '@/hooks/useBiometric';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { SUPPORT_CONFIG } from '@/config/support';

export default function ProfileScreen() {
  const theme = useActiveTheme();
  const { setTheme, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: stats } = useIdeaStats();
  const updateUser = useUpdateUser();
  const [usernameModalVisible, setUsernameModalVisible] = React.useState(false);
  const [usernameDraft, setUsernameDraft] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [helpVisible, setHelpVisible] = React.useState(false);
  const usernameAvailability = useUsernameAvailability(usernameDraft);
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

  const openUsernameEditor = () => {
    setUsernameDraft(user?.username ?? '');
    setUsernameError('');
    setUsernameModalVisible(true);
  };

  const handleUsernameSave = async () => {
    if (usernameDraft !== usernameDraft.trim()) {
      setUsernameError('Remove leading or trailing spaces');
      return;
    }
    const normalizedUsername = usernameDraft.trim().toLowerCase();
    const validationError = validateUsername(normalizedUsername);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    const isCurrentUsername = normalizedUsername === user?.username;
    if (!isCurrentUsername && usernameAvailability.isFetching) {
      setUsernameError('Checking username availability…');
      return;
    }
    if (!isCurrentUsername && usernameAvailability.data?.available !== true) {
      setUsernameError(usernameAvailability.data?.reason ?? 'Choose an available username');
      return;
    }

    try {
      await updateUser.mutateAsync({ username: normalizedUsername });
      setUsernameModalVisible(false);
      setUsernameError('');
      Alert.alert('Username updated', 'Your new username is now visible across Kri8.');
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : 'Could not update username');
    }
  };

  const openSupport = async (kind: 'problem' | 'contact' | 'feedback' | 'faq') => {
    const subject = {
      problem: 'Kri8 problem report',
      contact: 'Kri8 support request',
      feedback: 'Kri8 app feedback',
    }[kind as 'problem' | 'contact' | 'feedback'];

    try {
      if (kind === 'faq' && SUPPORT_CONFIG.url) {
        await Linking.openURL(SUPPORT_CONFIG.url);
        return;
      }
      if (kind !== 'faq' && SUPPORT_CONFIG.email) {
        await Linking.openURL(`mailto:${SUPPORT_CONFIG.email}?subject=${encodeURIComponent(subject ?? 'Kri8 support')}`);
        return;
      }
    } catch {
      Alert.alert('Could not open support', 'Please try again or use the configured support destination later.');
      return;
    }
    Alert.alert(
      'Support contact not configured',
      'This support destination can be enabled centrally with the production support email or help URL.',
    );
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
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity
            onPress={() => setHelpVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open Help and Support"
            style={[styles.helpButton, { borderColor: theme.border, backgroundColor: theme.bgGlass }]}
          >
            <Text style={[styles.helpIcon, { color: theme.text }]}>?</Text>
          </TouchableOpacity>
        </View>

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
            <TouchableOpacity onPress={openUsernameEditor} accessibilityRole="button">
              <Text style={[styles.userHandle, { color: theme.textMuted }]}>@{user.username}</Text>
            </TouchableOpacity>
          )}
          {!user?.username && (
            <TouchableOpacity onPress={openUsernameEditor} accessibilityRole="button">
              <Text style={[styles.editLink, { color: theme.accent }]}>Add a username</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openUsernameEditor} accessibilityRole="button">
            <Text style={[styles.editLink, { color: theme.accent }]}>Edit username</Text>
          </TouchableOpacity>
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

      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit username</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Use 3–30 letters, numbers, or underscores. Your username updates everywhere after saving.
            </Text>
            <TextInput
              value={usernameDraft}
              onChangeText={(value) => {
                setUsernameDraft(value);
                setUsernameError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              placeholder="your_username"
              placeholderTextColor={theme.textFaint}
              style={[styles.modalInput, { color: theme.text, borderColor: usernameError ? '#F87171' : theme.border, backgroundColor: theme.bgGlass }]}
            />
            {usernameDraft.trim().length >= 3 && !usernameError && usernameDraft.trim().toLowerCase() !== user?.username && (
              <Text style={[styles.availabilityText, { color: usernameAvailability.isFetching ? theme.textMuted : usernameAvailability.data?.available ? theme.success : '#F87171' }]}>
                {usernameAvailability.isFetching
                  ? 'Checking availability…'
                  : usernameAvailability.data?.available
                    ? 'Username is available'
                    : usernameAvailability.data?.reason ?? 'Username is unavailable'}
              </Text>
            )}
            {!!usernameError && <Text style={[styles.modalError, { color: '#F87171' }]}>{usernameError}</Text>}
            <View style={styles.modalActions}>
              <GlassButton variant="secondary" onPress={() => setUsernameModalVisible(false)} style={styles.modalAction}>
                Cancel
              </GlassButton>
              <GlassButton onPress={() => void handleUsernameSave()} loading={updateUser.isPending} style={styles.modalAction}>
                Save
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={helpVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)} accessibilityLabel="Close Help and Support">
                <Text style={[styles.closeText, { color: theme.textMuted }]}>Close</Text>
              </TouchableOpacity>
            </View>
            {([
              ['problem', 'Report a problem', 'Tell us what went wrong'],
              ['contact', 'Contact support', 'Get help with your account'],
              ['feedback', 'App feedback', 'Share an idea for Kri8'],
              ['faq', 'FAQ / Help', 'Find answers and guidance'],
            ] as const).map(([kind, label, description]) => (
              <TouchableOpacity
                key={kind}
                onPress={() => void openSupport(kind)}
                style={[styles.supportRow, { borderBottomColor: theme.border }]}
                accessibilityRole="button"
              >
                <View style={styles.supportCopy}>
                  <Text style={[styles.supportLabel, { color: theme.text }]}>{label}</Text>
                  <Text style={[styles.supportDescription, { color: theme.textMuted }]}>{description}</Text>
                </View>
                <Text style={[styles.supportArrow, { color: theme.accent }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1.1 },
  helpButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  helpIcon: { fontSize: 21, fontWeight: '800' },
  profileCard: { alignItems: 'center', gap: 10 },
  userName: { fontSize: 26, fontWeight: '800', marginTop: 5, letterSpacing: -0.5 },
  userHandle: { fontSize: 15, marginTop: -5 },
  editLink: { fontSize: 13, fontWeight: '700', marginTop: 1 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', padding: 22 },
  modalCard: { borderRadius: 24, borderWidth: 1, padding: 22, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, lineHeight: 20 },
  modalInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  availabilityText: { fontSize: 13, fontWeight: '600', marginTop: -5 },
  modalError: { fontSize: 13, lineHeight: 18, marginTop: -5 },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 2 },
  modalAction: { flex: 1 },
  closeText: { fontSize: 14, fontWeight: '600' },
  supportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  supportCopy: { flex: 1, gap: 3 },
  supportLabel: { fontSize: 16, fontWeight: '700' },
  supportDescription: { fontSize: 13, lineHeight: 18 },
  supportArrow: { fontSize: 22, marginLeft: 12 },
});

function validateUsername(username: string): string | null {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be 30 characters or fewer';
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Use only letters, numbers, and underscores';
  }
  return null;
}

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
