import { useState } from 'react';
import {
  View, Text, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { setCredentials } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { colors, gradients, radius, spacing, presets } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Заполни все поля');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await authService.login(trimmedEmail, password);
      dispatch(setCredentials({ user, accessToken }));

      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'coach') router.replace('/(coach)/dashboard');
      else router.replace('/(player)/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Что-то пошло не так. Попробуй ещё раз';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => [
    styles.input,
    focused === name && styles.inputFocused,
  ];

  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>LE</Text>
          </View>
          <Text style={styles.logo}>Los Espada Training</Text>
          <Text style={styles.subtitle}>Войди в свой аккаунт</Text>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={inputStyle('email')}
              placeholder="Email"
              placeholderTextColor={colors.textFaint}
              value={email}
              onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
            <TextInput
              style={inputStyle('password')}
              placeholder="Пароль"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={(v) => { setPassword(v); if (error) setError(null); }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              autoComplete="current-password"
              editable={!loading}
              onSubmitEditing={handleLogin}
            />

            <GradientButton
              title="Войти"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
            <Text style={styles.link}>
              Нет аккаунта? <Text style={styles.linkAccent}>Зарегистрироваться</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1, justifyContent: 'center', paddingHorizontal: 28,
    width: '100%', maxWidth: 440, alignSelf: 'center',
  },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20, alignSelf: 'center',
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderAccent,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  logoBadgeText: { color: colors.primary, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  logo: {
    fontSize: 28, fontWeight: '800', color: colors.text,
    textAlign: 'center', marginBottom: spacing.sm, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  input: {
    ...presets.input,
    marginBottom: 14,
  },
  inputFocused: { borderColor: colors.primary },
  button: { marginTop: 6 },
  link: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  linkAccent: { color: colors.primary, fontWeight: '700' },
});
