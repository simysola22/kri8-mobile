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
import { useSignUp } from '@clerk/clerk-expo';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { midnight } from '@/themes/midnight';

const T = midnight;

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[] };
      setError(clerkError.errors?.[0]?.message ?? 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, signUp]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[] };
      setError(clerkError.errors?.[0]?.message ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded, signUp, setActive]);

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
          <View style={styles.header}>
            <Text style={[styles.logo, { color: T.accent }]}>Kri8</Text>
            <Text style={[styles.tagline, { color: T.textMuted }]}>
              Start capturing your best ideas
            </Text>
          </View>

          <GlassCard style={styles.card}>
            {!pendingVerification ? (
              <>
                <Text style={[styles.title, { color: T.text }]}>
                  Create account
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: T.textMuted }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: T.bgGlass, color: T.text, borderColor: T.border }]}
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

                <View style={styles.field}>
                  <Text style={[styles.label, { color: T.textMuted }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: T.bgGlass, color: T.text, borderColor: T.border }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="8+ characters"
                    placeholderTextColor={T.textFaint}
                    secureTextEntry
                    textContentType="newPassword"
                  />
                </View>

                {error && (
                  <Text style={[styles.error, { color: T.error }]}>{error}</Text>
                )}

                <GlassButton
                  onPress={() => void handleSignUp()}
                  loading={loading}
                  disabled={!email || password.length < 8}
                  fullWidth
                  size="lg"
                >
                  Create Account
                </GlassButton>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: T.text }]}>
                  Check your email
                </Text>
                <Text style={[styles.subtitle, { color: T.textMuted }]}>
                  We sent a verification code to {email}
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: T.textMuted }]}>Verification Code</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: T.bgGlass, color: T.text, borderColor: T.border, textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="000000"
                    placeholderTextColor={T.textFaint}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                {error && (
                  <Text style={[styles.error, { color: T.error }]}>{error}</Text>
                )}

                <GlassButton
                  onPress={() => void handleVerify()}
                  loading={loading}
                  disabled={code.length < 6}
                  fullWidth
                  size="lg"
                >
                  Verify Email
                </GlassButton>
              </>
            )}

            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.signInLink}>
                <Text style={[styles.signInText, { color: T.textMuted }]}>
                  Already have an account?{' '}
                  <Text style={{ color: T.accent, fontWeight: '700' }}>Sign in</Text>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  tagline: { fontSize: 16, letterSpacing: 0.3 },
  card: { gap: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: -8, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  signInLink: { alignItems: 'center', paddingVertical: 4 },
  signInText: { fontSize: 14 },
});
