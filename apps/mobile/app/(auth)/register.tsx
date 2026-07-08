import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { setCredentials } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { PLAYER_ROLES } from '../../src/constants';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { colors, gradients, radius, spacing, presets } from '../../src/theme';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'coach'>('player');
  const [inGameRole, setInGameRole] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => { if (error) setError(null); };

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedUsername || !password) {
      setError('Заполни email, ник и пароль');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Некорректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (bio.length > 500) {
      setError('Описание — максимум 500 символов');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await authService.register({
        email: trimmedEmail,
        username: trimmedUsername,
        password,
        role,
        full_name: fullName.trim() || null,
        in_game_role: role === 'player' ? inGameRole : null,
        bio: role === 'player' ? bio.trim() || null : null,
      });
      dispatch(setCredentials({ user, accessToken }));

      if (user.role === 'coach') router.replace('/(coach)/dashboard');
      else router.replace('/(player)/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Что-то пошло не так. Попробуй ещё раз';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={styles.container}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>LE</Text>
        </View>
        <Text style={styles.logo}>Los Espada Training</Text>
        <Text style={styles.subtitle}>Создай аккаунт</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#5B677D"
          value={email}
          onChangeText={(v) => { setEmail(v); clearError(); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Ник"
          placeholderTextColor="#5B677D"
          value={username}
          onChangeText={(v) => { setUsername(v); clearError(); }}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Имя (необязательно)"
          placeholderTextColor="#5B677D"
          value={fullName}
          onChangeText={(v) => { setFullName(v); clearError(); }}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль (минимум 6 символов)"
          placeholderTextColor="#5B677D"
          value={password}
          onChangeText={(v) => { setPassword(v); clearError(); }}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <Text style={styles.label}>Кто ты</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'player' && styles.roleBtnActive]}
            onPress={() => setRole('player')}
            disabled={loading}
          >
            <Text style={[styles.roleBtnText, role === 'player' && styles.roleBtnTextActive]}>
              Игрок
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'coach' && styles.roleBtnActive]}
            onPress={() => setRole('coach')}
            disabled={loading}
          >
            <Text style={[styles.roleBtnText, role === 'coach' && styles.roleBtnTextActive]}>
              Тренер
            </Text>
          </TouchableOpacity>
        </View>

        {role === 'player' ? (
          <>
            <Text style={styles.label}>Роль на карте (необязательно)</Text>
            <View style={styles.gameRoleGrid}>
              {PLAYER_ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.gameRoleBtn, inGameRole === r.value && styles.roleBtnActive]}
                  onPress={() => setInGameRole(inGameRole === r.value ? null : r.value)}
                  disabled={loading}
                >
                  <Text style={[styles.roleBtnText, inGameRole === r.value && styles.roleBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>О себе (необязательно)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Стиль игры, любимые карты, опыт..."
              placeholderTextColor="#5B677D"
              value={bio}
              onChangeText={(v) => { setBio(v); clearError(); }}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!loading}
            />
          </>
        ) : null}

        <GradientButton
          title="Зарегистрироваться"
          onPress={handleRegister}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.link}>
            Уже есть аккаунт? <Text style={styles.linkAccent}>Войти</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40,
    width: '100%', maxWidth: 440, alignSelf: 'center',
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: 18, alignSelf: 'center',
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderAccent,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  logoBadgeText: { color: colors.primary, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  logo: {
    fontSize: 26, fontWeight: '800', color: colors.text,
    textAlign: 'center', marginBottom: spacing.sm, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },
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
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: {
    color: colors.textSecondary, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10,
  },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xl },
  roleBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleBtnText: { color: colors.textSecondary, fontWeight: '600' },
  roleBtnTextActive: { color: colors.primary },
  gameRoleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
  gameRoleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  button: { marginBottom: spacing.xl },
  link: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, marginBottom: spacing.xl },
  linkAccent: { color: colors.primary, fontWeight: '700' },
});
