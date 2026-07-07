import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/hooks/useAppDispatch';
import { logout, updateProfile } from '../../src/store/slices/authSlice';
import { statsService } from '../../src/services/statsService';
import { usersService } from '../../src/services/usersService';
import { authService } from '../../src/services/authService';
import { ActivityHeatmap } from '../../src/components/ui/ActivityHeatmap';
import { ROLE_LABELS } from '../../src/constants';

export default function PlayerProfileScreen() {
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [data, me] = await Promise.all([
            statsService.getPlayerActivity(user!.id),
            usersService.getMe(),
          ]);
          setActivity(data.activity);
          setTotal(data.total);
          dispatch(updateProfile(me));
        } catch {
          // тихо
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const roleLabel = user?.in_game_role ? ROLE_LABELS[user.in_game_role] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Назад</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Профиль</Text>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{user?.username}</Text>
          {user?.full_name ? <Text style={styles.fullName}>{user.full_name}</Text> : null}
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Игрок</Text>
            </View>
            {roleLabel ? (
              <View style={[styles.roleBadge, styles.gameRoleBadge]}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {user?.bio ? (
        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>О себе</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/(player)/edit-profile')}>
        <Text style={styles.editBtnText}>✎ Редактировать профиль</Text>
      </TouchableOpacity>

      <ActivityHeatmap activity={activity} total={total} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  logoutBtn: { borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  logoutText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2d3e',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#f59e0b', fontSize: 24, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  fullName: { color: '#aaa', fontSize: 14, marginBottom: 2 },
  email: { color: '#888', fontSize: 13, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  roleBadge: { backgroundColor: '#2a1f00', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  gameRoleBadge: { borderWidth: 1, borderColor: '#f59e0b' },
  roleText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  bioCard: {
    backgroundColor: '#1a1d2e', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#2a2d3e',
  },
  bioTitle: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  bioText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  editBtn: {
    borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginBottom: 20,
  },
  editBtnText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
  backBtn: { paddingVertical: 4 },
  backText: { color: '#f59e0b', fontSize: 15 },
});
