import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { logout } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { groupsService } from '../../src/services/groupsService';
import { Group } from '../../src/types';
import { FAB } from '../../src/components/ui/FAB';
import { colors, gradients, radius, shadows } from '../../src/theme';

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
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>ТРЕНЕР</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Команд: {groups.length}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </LinearGradient>

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

      <FAB onPress={() => router.push('/(coach)/create-group')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0B0D14' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl, padding: 18, marginBottom: 28,
    borderWidth: 1, borderColor: colors.borderStrong,
    ...shadows.card,
  },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  username: { color: colors.text, fontSize: 19, fontWeight: '800', marginBottom: 5, letterSpacing: -0.3 },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  roleBadge: {
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderAccent,
  },
  roleText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
  logoutBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8,
  },
  logoutText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
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
