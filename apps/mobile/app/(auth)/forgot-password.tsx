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
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/authService';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { colors, gradients, radius, spacing, presets } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Введите email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authService.forgotPassword(trimmedEmail);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Не удалось отправить письмо. Попробуйте ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  };

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

          <Text style={styles.logo}>Восстановление пароля</Text>

          <Text style={styles.subtitle}>
            Введите email вашего аккаунта
          </Text>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  Если аккаунт с таким email существует, мы отправили ссылку
                  для восстановления пароля.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.input,
                    focused && styles.inputFocused,
                  ]}
                  placeholder="Email"
                  placeholderTextColor={colors.textFaint}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                  onSubmitEditing={handleSubmit}
                />

                <GradientButton
                  title="Отправить ссылку"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.button}
                />
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            disabled={loading}
          >
            <Text style={styles.link}>Вернуться ко входу</Text>
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

  button: {
    marginTop: 6,
  },

  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: spacing.lg,
  },

  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },

  successBox: {
    padding: 12,
  },

  successText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },

  link: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
});