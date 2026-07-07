import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { logout } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { groupsService } from '../../src/services/groupsService';
import { Group } from '../../src/types';

export default function CoachDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getMyGroups();
      setGroups(data);
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

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

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        {/* Шапка-профиль */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{user?.username}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Тренер</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Команд: {groups.length}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        {/* Команды */}
        <Text style={styles.sectionTitle}>Твои команды</Text>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>У тебя пока нет команд</Text>
            <Text style={styles.emptySubtext}>Создай первую команду для своих игроков</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.tile}
                activeOpacity={0.7}
                onPress={() => router.push(`/(coach)/group/${g.id}`)}
              >
                <Text style={styles.tileIcon}>👥</Text>
                <Text style={styles.tileName} numberOfLines={1}>{g.name}</Text>
                {g.description ? (
                  <Text style={styles.tileDescription} numberOfLines={2}>{g.description}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(coach)/create-group')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0f1117' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 16, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: '#2a2d3e',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1, borderColor: '#f59e0b',
  },
  avatarText: { color: '#f59e0b', fontSize: 24, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  roleBadge: { backgroundColor: '#2a1f00', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  subtitle: { color: '#888', fontSize: 12 },
  logoutBtn: {
    borderWidth: 1, borderColor: '#2a2d3e', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8,
  },
  logoutText: { color: '#888', fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: {
    width: '48%',
    backgroundColor: '#1a1d2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    padding: 16,
    minHeight: 110,
  },
  tileIcon: { fontSize: 26, marginBottom: 10 },
  tileName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tileDescription: { color: '#666', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#555', fontSize: 13, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
