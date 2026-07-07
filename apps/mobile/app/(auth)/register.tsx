import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { setCredentials } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { PLAYER_ROLES } from '../../src/constants';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
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
          placeholderTextColor="#555"
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
          placeholderTextColor="#555"
          value={username}
          onChangeText={(v) => { setUsername(v); clearError(); }}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Имя (необязательно)"
          placeholderTextColor="#555"
          value={fullName}
          onChangeText={(v) => { setFullName(v); clearError(); }}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль (минимум 6 символов)"
          placeholderTextColor="#555"
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
              placeholderTextColor="#555"
              value={bio}
              onChangeText={(v) => { setBio(v); clearError(); }}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!loading}
            />
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Зарегистрироваться</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  inner: {
    flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40,
    width: '100%', maxWidth: 440, alignSelf: 'center',
  },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#f59e0b', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 28 },
  errorBox: {
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  input: {
    backgroundColor: '#1a1d2e',
    borderWidth: 1,
    borderColor: '#2a2d3e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: '#888', fontSize: 13, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    alignItems: 'center',
    backgroundColor: '#1a1d2e',
  },
  roleBtnActive: { borderColor: '#f59e0b', backgroundColor: '#2a1f00' },
  roleBtnText: { color: '#888', fontWeight: '600' },
  roleBtnTextActive: { color: '#f59e0b' },
  gameRoleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  gameRoleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    backgroundColor: '#1a1d2e',
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  link: { color: '#f59e0b', textAlign: 'center', fontSize: 14, marginBottom: 20 },
});
