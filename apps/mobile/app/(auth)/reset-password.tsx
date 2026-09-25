import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService } from '../../src/services/authService';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { colors, gradients, radius, spacing, presets } from '../../src/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const token = typeof params.token === 'string' ? params.token : '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!token) {
      setError('Ссылка восстановления недействительна');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Заполни все поля');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Не удалось изменить пароль. Возможно, ссылка устарела.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => [
    styles.input,
    focused === name && styles.inputFocused,
  ];

  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.6 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>LE</Text>
          </View>

          <Text style={styles.logo}>Новый пароль</Text>

          <Text style={styles.subtitle}>
            Придумай новый пароль для своего аккаунта
          </Text>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <>
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    Пароль успешно изменён. Теперь можно войти в аккаунт.
                  </Text>
                </View>

                <GradientButton
                  title="Перейти ко входу"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.button}
                />
              </>
            ) : (
              <>
                {!token ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      В ссылке отсутствует токен восстановления.
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  style={inputStyle('password')}
                  placeholder="Новый пароль"
                  placeholderTextColor={colors.textFaint}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!loading}
                />

                <TextInput
                  style={inputStyle('confirmPassword')}
                  placeholder="Повтори новый пароль"
                  placeholderTextColor={colors.textFaint}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocused('confirmPassword')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!loading}
                  onSubmitEditing={handleResetPassword}
                />

                <GradientButton
                  title="Изменить пароль"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={!token}
                  style={styles.button}
                />
              </>
            )}
          </View>

          {!success ? (
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              disabled={loading}
            >
              <Text style={styles.link}>Вернуться ко входу</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  logoBadgeText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },

  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },

  input: {
    ...presets.input,
    marginBottom: 14,
  },

  inputFocused: {
    borderColor: colors.primary,
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

  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },

  successBox: {
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },

  successText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  button: {
    marginTop: 6,
  },

  link: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
});