import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setCredentials } from '../store/slices/authSlice';
import { authService } from '../services/authService';
import { storage } from '../services/storage';

type Role = 'player' | 'coach' | 'admin';

const HOME: Record<Role, string> = {
  player: '/(player)/dashboard',
  coach: '/(coach)/dashboard',
  admin: '/(admin)/dashboard',
};

interface Props {
  role: Role;
  children: React.ReactNode;
}

/**
 * Пускает в раздел только пользователя с нужной ролью.
 * Если стор пуст (перезагрузка страницы на вебе) — восстанавливает сессию по токену.
 * Сетевые ошибки не считаются разлогином — показываем «Повторить».
 */
export function RoleGuard({ role, children }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const [status, setStatus] = useState<'checking' | 'no-token' | 'network-error' | 'done'>(
    user ? 'done' : 'checking'
  );

  const restore = async () => {
    setStatus('checking');
    try {
      const token = await storage.getItem('access_token');
      if (!token) {
        setStatus('no-token');
        return;
      }
      const me = await authService.fetchMe();
      dispatch(setCredentials({ user: me, accessToken: token }));
      setStatus('done');
    } catch (err: any) {
      if (err?.response) {
        setStatus('no-token'); // сервер отверг токен
      } else {
        setStatus('network-error'); // сеть/таймаут — токен не трогаем
      }
    }
  };

  useEffect(() => {
    if (!user) restore();
  }, []);

  if (user) {
    if (user.role !== role) return <Redirect href={HOME[(user.role as Role)] ?? '/(auth)/login'} />;
    return <>{children}</>;
  }

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (status === 'network-error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Нет связи с сервером</Text>
        <Text style={styles.errorHint}>Сервер просыпается или проблемы с сетью</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={restore}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Redirect href="/(auth)/login" />;
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
