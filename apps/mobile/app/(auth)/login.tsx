import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { setCredentials } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Los Espada Training</Text>
        <Text style={styles.subtitle}>Войди в свой аккаунт</Text>

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
          onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#555"
          value={password}
          onChangeText={(v) => { setPassword(v); if (error) setError(null); }}
          secureTextEntry
          autoComplete="current-password"
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Войти</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
          <Text style={styles.link}>Нет аккаунта? Зарегистрироваться</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  inner: {
    flex: 1, justifyContent: 'center', paddingHorizontal: 28,
    width: '100%', maxWidth: 440, alignSelf: 'center',
  },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#f59e0b', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32 },
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
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  link: { color: '#f59e0b', textAlign: 'center', fontSize: 14 },
});
