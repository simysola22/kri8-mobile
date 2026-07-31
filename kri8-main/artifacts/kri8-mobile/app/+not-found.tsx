import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useActiveTheme } from '@/stores/theme';
import { GlassButton } from '@/components/ui/GlassButton';

export default function NotFoundScreen() {
  const theme = useActiveTheme();

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={styles.content}>
        <Text style={[styles.code, { color: theme.accent }]}>404</Text>
        <Text style={[styles.title, { color: theme.text }]}>Screen not found</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          This screen doesn't exist in the app.
        </Text>
        <Link href="/(tabs)" asChild>
          <GlassButton onPress={() => {}} size="lg">
            Go Home
          </GlassButton>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  code: { fontSize: 72, fontWeight: '900', letterSpacing: -2 },
  title: { fontSize: 24, fontWeight: '700' },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
