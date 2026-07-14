import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { setCredentials } from '../src/store/slices/authSlice';
import { authService } from '../src/services/authService';
import { storage } from '../src/services/storage';

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setFailed(false);
    try {
      const token = await storage.getItem('access_token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      const user = await authService.fetchMe();
      dispatch(setCredentials({ user, accessToken: token }));
      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'coach') router.replace('/(coach)/dashboard');
      else router.replace('/(player)/dashboard');
    } catch (err: any) {
      if (err?.response) {
        // Сервер ответил (токен невалиден) — на логин
        router.replace('/(auth)/login');
      } else {
        // Сеть/таймаут — токен НЕ трогаем, даём повторить
        setFailed(true);
      }
    }
  };

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Нет связи с сервером</Text>
        <Text style={styles.errorHint}>Сервер просыпается или проблемы с сетью</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={checkAuth}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14', paddingHorizontal: 40 },
  errorTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  errorHint: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32,
  },
  retryText: { color: '#171000', fontWeight: '800', fontSize: 15 },
});
