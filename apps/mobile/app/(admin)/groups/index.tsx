import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminGroup } from '../../../src/types';
import { colors, radius, shadows } from '../../../src/theme';

export default function AdminGroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setGroups(await adminService.getGroups());
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
    if (!query.trim()) return groups;
    const q = query.trim().toLowerCase();
    return groups.filter((g) => `${g.name} ${g.coach_username}`.toLowerCase().includes(q));
  }, [groups, query]);

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
      <Text style={styles.title}>👥 Группы</Text>
      <Text style={styles.subtitle}>{filtered.length} из {groups.length}</Text>

      <TextInput
        style={styles.search}
        placeholder="Поиск по названию или тренеру..."
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.listCard}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Группы не найдены</Text>
        ) : (
          filtered.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.row}
              onPress={() => router.push(`/(admin)/groups/${g.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>👥</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{g.name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>Тренер: {g.coach_username} · {g.member_count} игроков</Text>
              </View>
              <Text style={styles.chevronText}>›</Text>
            </TouchableOpacity>
          ))
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
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14,
  },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.subtle,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent,
  },
  avatarText: { fontSize: 15 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chevronText: { color: colors.textFaint, fontSize: 18 },
  emptyText: { color: colors.textFaint, fontSize: 13, padding: 20, textAlign: 'center' },
});
