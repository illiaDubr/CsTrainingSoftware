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
import { MapOfDayBanner } from '../../src/components/ui/MapOfDayBanner';
import { mapsService, MapOfDay } from '../../src/services/mapsService';
import { showAlert, showConfirm } from '../../src/utils/alert';
import { colors, gradients, radius, shadows } from '../../src/theme';

export default function CoachDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeMap, setActiveMap] = useState<MapOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    try {
      const [data, maps] = await Promise.all([
        groupsService.getMyGroups(),
        mapsService.getActiveMaps().catch(() => []),
      ]);
      setGroups(data);
      setActiveMap(maps[0] ?? null);
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveMap = () => {
    if (!activeMap) return;
    showConfirm('Снять карту дня?', undefined, async () => {
      try {
        await mapsService.deleteMap(activeMap.id);
        setActiveMap(null);
      } catch {
        showAlert('Ошибка', 'Не удалось снять карту');
      }
    }, 'Снять');
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

        {/* Карта дня */}
        {activeMap ? (
          <MapOfDayBanner
            map={activeMap}
            onPress={() => router.push('/(coach)/set-map')}
            onRemove={handleRemoveMap}
          />
        ) : (
          <TouchableOpacity
            style={styles.setMapTile}
            activeOpacity={0.7}
            onPress={() => router.push('/(coach)/set-map')}
          >
            <Text style={styles.setMapIcon}>🗺️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.setMapTitle}>Назначить карту дня</Text>
              <Text style={styles.setMapHint}>Игроки увидят её на главном экране</Text>
            </View>
            <Text style={styles.setMapChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Раскидки */}
        <TouchableOpacity
          style={styles.nadesTile}
          activeOpacity={0.7}
          onPress={() => router.push('/(coach)/nades')}
        >
          <Text style={styles.nadesTileIcon}>💣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.nadesTileName}>Раскидки</Text>
            <Text style={styles.nadesTileHint}>Гранаты по картам для всех команд</Text>
          </View>
          <Text style={styles.nadesChevron}>›</Text>
        </TouchableOpacity>

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
  setMapTile: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    padding: 14, marginBottom: 14,
  },
  setMapIcon: { fontSize: 24, marginRight: 12 },
  setMapTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  setMapHint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  setMapChevron: { color: colors.textFaint, fontSize: 22, marginLeft: 8 },
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
  nadesTile: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginTop: -14, marginBottom: 28,
    ...shadows.subtle,
  },
  nadesTileIcon: { fontSize: 26, marginRight: 14 },
  nadesTileName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  nadesTileHint: { color: colors.textMuted, fontSize: 12 },
  nadesChevron: { color: colors.textFaint, fontSize: 24, marginLeft: 8 },
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
