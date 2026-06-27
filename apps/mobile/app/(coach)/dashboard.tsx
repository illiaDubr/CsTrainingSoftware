import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { logout } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';

export default function PlayerDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Привет, {user?.username} 👋</Text>
      <Text style={styles.role}>Роль: Тренер</Text>
      <Text style={styles.placeholder}>Здесь групы и ученики</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  role: { fontSize: 14, color: '#f59e0b', marginBottom: 32 },
  placeholder: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 48 },
  logoutBtn: { borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  logoutText: { color: '#f59e0b', fontWeight: '600' },
});