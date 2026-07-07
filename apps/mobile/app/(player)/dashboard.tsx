import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { updateProfile } from '../../src/store/slices/authSlice';
import { groupsService } from '../../src/services/groupsService';
import { usersService } from '../../src/services/usersService';
import { Group } from '../../src/types';
import { ROLE_LABELS } from '../../src/constants';

export default function PlayerDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [groupList, me] = await Promise.all([
        groupsService.getMyGroups(),
        usersService.getMe(),
      ]);
      setGroups(groupList);
      dispatch(updateProfile(me));
    } catch {
      // тихо игнорируем — покажем пустое состояние
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
    >
      {/* Шапка-профиль */}
      <TouchableOpacity
        style={styles.profileCard}
        activeOpacity={0.8}
        onPress={() => router.push('/(player)/profile')}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{user?.username}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleLabel ?? 'Игрок'}</Text>
            </View>
          </View>
          {user?.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>Расскажи о себе в профиле</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Команды */}
      <Text style={styles.sectionTitle}>Твои команды</Text>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Ты пока не состоишь ни в одной команде</Text>
          <Text style={styles.emptySubtext}>Попроси тренера добавить тебя</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.tile}
              activeOpacity={0.7}
              onPress={() => router.push(`/(player)/group/${g.id}`)}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, width: '100%', maxWidth: 700, alignSelf: 'center' },
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
  bio: { color: '#888', fontSize: 12, lineHeight: 16 },
  bioEmpty: { color: '#555', fontSize: 12, fontStyle: 'italic' },
  chevron: { color: '#555', fontSize: 24, marginLeft: 8 },
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
});
