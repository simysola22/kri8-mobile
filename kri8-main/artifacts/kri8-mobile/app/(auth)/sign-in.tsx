import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { midnight } from '@/themes/midnight';

// Auth screens always use Midnight — the user hasn't loaded their prefs yet
const T = midnight;

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded || !email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });
      if (result.status !== 'complete') {
        setError(
          'Sign-in requires an additional verification step that is not available in this screen.',
        );
        return;
      }
      if (!result.createdSessionId) {
        setError('Sign-in completed, but no session was created. Please try again.');
        return;
      }
      await setActive({ session: result.createdSessionId });
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[] };
      setError(
        clerkError.errors?.[0]?.message ?? 'Sign in failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, signIn, setActive]);

  return (
    <LinearGradient colors={T.gradient} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / wordmark */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: T.accent }]}>Kri8</Text>
            <Text style={[styles.tagline, { color: T.textMuted }]}>
              Your ideas deserve a home
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={[styles.title, { color: T.text }]}>Welcome back</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: T.textMuted }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: T.bgGlass,
                    color: T.text,
                    borderColor: T.border,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={T.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: T.textMuted }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: T.bgGlass,
                    color: T.text,
                    borderColor: T.border,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={T.textFaint}
                secureTextEntry
                textContentType="password"
              />
            </View>

            {error && (
              <Text style={[styles.error, { color: T.error }]}>{error}</Text>
            )}

            <GlassButton
              onPress={() => void handleSignIn()}
              loading={loading}
              disabled={!email || !password}
              fullWidth
              size="lg"
              style={styles.signInButton}
            >
              Sign In
            </GlassButton>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: T.border }]} />
              <Text style={[styles.dividerText, { color: T.textFaint }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: T.border }]} />
            </View>

            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity style={styles.signUpLink}>
                <Text style={[styles.signUpText, { color: T.textMuted }]}>
                  Don't have an account?{' '}
                  <Text style={{ color: T.accent, fontWeight: '700' }}>
                    Sign up
                  </Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  card: { gap: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  signInButton: { marginTop: 4 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  signUpLink: { alignItems: 'center', paddingVertical: 4 },
  signUpText: { fontSize: 14 },
});
