import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminUser, AdminRole } from '../../../src/types';
import { colors, radius, shadows } from '../../../src/theme';

const ROLE_META: Record<AdminRole, { label: string; icon: string; color: string }> = {
  admin: { label: 'Админ', icon: '🛡️', color: '#A78BFA' },
  coach: { label: 'Тренер', icon: '🎯', color: colors.primary },
  player: { label: 'Игрок', icon: '🎮', color: colors.info },
};

const ROLE_FILTERS: { key: AdminRole | null; label: string }[] = [
  { key: null, label: 'Все' },
  { key: 'admin', label: 'Админы' },
  { key: 'coach', label: 'Тренеры' },
  { key: 'player', label: 'Игроки' },
];

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');

  const load = async () => {
    try {
      setUsers(await adminService.getUsers());
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'banned' && u.is_active) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${u.username} ${u.email} ${u.full_name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>👤 Пользователи</Text>
      <Text style={styles.subtitle}>{filtered.length} из {users.length}</Text>

      <TextInput
        style={styles.search}
        placeholder="Поиск по нику, email, имени..."
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.chip, roleFilter === f.key && styles.chipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.chipText, roleFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterRow}>
        {([
          { key: 'all', label: 'Любой статус' },
          { key: 'active', label: '✅ Активные' },
          { key: 'banned', label: '🚫 Забаненные' },
        ] as const).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listCard}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Никого не найдено</Text>
        ) : (
          filtered.map((u) => {
            const meta = ROLE_META[u.role];
            return (
              <TouchableOpacity
                key={u.id}
                style={styles.row}
                onPress={() => router.push(`/(admin)/users/${u.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{u.username?.[0]?.toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{u.username}</Text>
                    {!u.is_active ? <Text style={styles.bannedBadge}>бан</Text> : null}
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>{u.email}{u.full_name ? ` · ${u.full_name}` : ''}</Text>
                </View>
                <View style={[styles.roleBadge, { borderColor: meta.color }]}>
                  <Text style={[styles.roleBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 900, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: 18 },
  search: {
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  listCard: {
    marginTop: 10, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.subtle,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent,
  },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bannedBadge: {
    color: colors.danger, fontSize: 9, fontWeight: '800', borderWidth: 1, borderColor: colors.danger,
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1,
  },
  roleBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { color: colors.textFaint, fontSize: 13, padding: 20, textAlign: 'center' },
});
