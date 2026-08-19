import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../src/services/adminService';
import { AdminOverview } from '../../src/types';
import { colors, radius, shadows } from '../../src/theme';

const ROLE_LABEL: Record<string, string> = { admin: 'Админы', coach: 'Тренеры', player: 'Игроки' };

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await adminService.getOverview());
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

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const maxSignup = Math.max(1, ...data.signupSeries.map((d) => d.count));

  const StatCard = ({ icon, label, value, onPress }: { icon: string; label: string; value: number | string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.statCard} activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>📊 Дашборд</Text>
      <Text style={styles.subtitle}>Обзор всей платформы Los Espada</Text>

      <Text style={styles.sectionTitle}>Пользователи</Text>
      <View style={styles.grid}>
        <StatCard icon="👥" label="Всего" value={data.users.total} onPress={() => router.push('/(admin)/users' as any)} />
        <StatCard icon="🎯" label="Тренеры" value={data.users.coach} />
        <StatCard icon="🎮" label="Игроки" value={data.users.player} />
        <StatCard icon="🛡️" label="Админы" value={data.users.admin} />
        <StatCard icon="✅" label="Активны" value={data.users.active} />
        <StatCard icon="🚫" label="Забанены" value={data.users.inactive} />
      </View>

      <Text style={styles.sectionTitle}>Команды и контент</Text>
      <View style={styles.grid}>
        <StatCard icon="🏆" label="Группы" value={data.groups} onPress={() => router.push('/(admin)/groups' as any)} />
        <StatCard icon="💣" label="Раскидки" value={data.content.nades} onPress={() => router.push('/(admin)/content/nades' as any)} />
        <StatCard icon="🧠" label="Тактики" value={data.content.tactics} onPress={() => router.push('/(admin)/content/tactics' as any)} />
        <StatCard icon="📚" label="Материалы" value={data.content.materials} onPress={() => router.push('/(admin)/content/materials' as any)} />
        <StatCard icon="🎯" label="Тренировки" value={data.content.trainings} onPress={() => router.push('/(admin)/content/trainings' as any)} />
        <StatCard icon="📅" label="Матчи" value={data.content.matches} onPress={() => router.push('/(admin)/content/matches' as any)} />
        <StatCard icon="📋" label="Задачи" value={data.content.tasks} />
        <StatCard icon="🔁" label="Рутины" value={data.content.routines} />
      </View>

      <Text style={styles.sectionTitle}>Регистрации за 30 дней</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          {data.signupSeries.map((d) => (
            <View key={d.date} style={styles.barWrap}>
              <View style={[styles.bar, { height: Math.max(2, (d.count / maxSignup) * 80) }]} />
            </View>
          ))}
        </View>
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>{data.signupSeries[0]?.date}</Text>
          <Text style={styles.chartFooterText}>{data.signupSeries[data.signupSeries.length - 1]?.date}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Новые пользователи</Text>
      <View style={styles.listCard}>
        {data.recentUsers.length === 0 ? (
          <Text style={styles.emptyText}>Пока никого нет</Text>
        ) : (
          data.recentUsers.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.listRow}
              onPress={() => router.push(`/(admin)/users/${u.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>{u.username?.[0]?.toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{u.username}</Text>
                <Text style={styles.listSub}>{u.email} · {ROLE_LABEL[u.role] ?? u.role}</Text>
              </View>
              {!u.is_active ? <Text style={styles.bannedBadge}>бан</Text> : null}
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Новые группы</Text>
      <View style={styles.listCard}>
        {data.recentGroups.length === 0 ? (
          <Text style={styles.emptyText}>Пока нет групп</Text>
        ) : (
          data.recentGroups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.listRow}
              onPress={() => router.push(`/(admin)/groups/${g.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>👥</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{g.name}</Text>
                <Text style={styles.listSub}>Тренер: {g.coach_username}</Text>
              </View>
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
  subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: 24 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 12, letterSpacing: -0.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: 130, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, ...shadows.subtle,
  },
  statIcon: { fontSize: 20, marginBottom: 8 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 16, ...shadows.subtle,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 84 },
  barWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 8, backgroundColor: colors.primary, borderRadius: 3, opacity: 0.85 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartFooterText: { color: colors.textFaint, fontSize: 10 },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent,
  },
  avatarText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  listSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bannedBadge: {
    color: colors.danger, fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: colors.danger,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  emptyText: { color: colors.textFaint, fontSize: 13, padding: 16, textAlign: 'center' },
});
