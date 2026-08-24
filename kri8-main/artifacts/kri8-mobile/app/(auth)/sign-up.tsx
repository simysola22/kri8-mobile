import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { midnight } from '@/themes/midnight';

const T = midnight;
const REDIRECT_URL = 'kri8://callback';

export default function SignUpScreen() {
  const { startHostedAuth } = useHostedAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await startHostedAuth({
        mode: 'sign-up',
        redirectUrl: REDIRECT_URL,
      });
    } catch {
      setError('Unable to open secure sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={T.gradient} style={styles.root}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: T.accent }]}>Kri8</Text>
          <Text style={[styles.tagline, { color: T.textMuted }]}>
            Start capturing your best ideas
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.title, { color: T.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: T.textMuted }]}>
            Create your account securely with Kri8&apos;s account portal.
          </Text>

          {error && <Text style={[styles.error, { color: T.error }]}>{error}</Text>}

          <GlassButton
            onPress={() => void handleSignUp()}
            loading={loading}
            fullWidth
            size="lg"
          >
            Create Account
          </GlassButton>
        </GlassCard>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  tagline: { fontSize: 16, letterSpacing: 0.3 },
  card: { gap: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});