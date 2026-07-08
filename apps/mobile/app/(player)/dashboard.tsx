import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { updateProfile } from '../../src/store/slices/authSlice';
import { groupsService } from '../../src/services/groupsService';
import { usersService } from '../../src/services/usersService';
import { Group } from '../../src/types';
import { ROLE_LABELS } from '../../src/constants';
import { colors, gradients, radius, shadows } from '../../src/theme';

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
        activeOpacity={0.8}
        onPress={() => router.push('/(player)/profile')}
      >
        <LinearGradient
          colors={gradients.surface}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{user?.username}</Text>
            {user?.full_name ? <Text style={styles.fullName}>{user.full_name}</Text> : null}
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{(roleLabel ?? 'Игрок').toUpperCase()}</Text>
              </View>
            </View>
            {user?.bio ? (
              <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>Расскажи о себе в профиле</Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Индивидуальная рутина */}
      <TouchableOpacity
        style={styles.routineTile}
        activeOpacity={0.7}
        onPress={() => router.push('/(player)/my-routines')}
      >
        <Text style={styles.routineTileIcon}>🔁</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.routineTileName}>Моя рутина</Text>
          <Text style={styles.routineTileHint}>Личные ежедневные задания</Text>
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
  container: { flex: 1, backgroundColor: '#0B0D14' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: colors.borderStrong,
    ...shadows.card,
  },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  username: { color: colors.text, fontSize: 19, fontWeight: '800', marginBottom: 2, letterSpacing: -0.3 },
  fullName: { color: '#A9B4C9', fontSize: 13, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  roleBadge: {
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderAccent,
  },
  roleText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  bio: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  bioEmpty: { color: colors.textFaint, fontSize: 12, fontStyle: 'italic' },
  chevron: { color: colors.textFaint, fontSize: 24, marginLeft: 8 },
  routineTile: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 28,
    ...shadows.subtle,
  },
  routineTileIcon: { fontSize: 26, marginRight: 14 },
  routineTileName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  routineTileHint: { color: colors.textMuted, fontSize: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 110,
    ...shadows.subtle,
  },
  tileIcon: { fontSize: 26, marginBottom: 10 },
  tileName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tileDescription: { color: colors.textMuted, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: colors.textFaint, fontSize: 13, textAlign: 'center' },
});
