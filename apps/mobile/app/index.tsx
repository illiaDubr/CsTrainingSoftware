import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { setCredentials } from '../src/store/slices/authSlice';
import { apiClient } from '../src/services/apiClient';
import { storage } from '../src/services/storage';

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getItem('access_token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      const { data } = await apiClient.get('/users/me');
      const user = data.data;
      dispatch(setCredentials({ user, accessToken: token }));
      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'coach') router.replace('/(coach)/dashboard');
      else router.replace('/(player)/dashboard');
    } catch {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );
}