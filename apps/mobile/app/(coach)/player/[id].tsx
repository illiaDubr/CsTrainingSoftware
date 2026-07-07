import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { statsService } from '../../../src/services/statsService';
import { routinesService } from '../../../src/services/routinesService';
import { ActivityHeatmap } from '../../../src/components/ui/ActivityHeatmap';
import { MonthGrid } from '../../../src/components/ui/MonthGrid';
import { Routine } from '../../../src/types';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#666', medium: '#f59e0b', high: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не отмечено',
  in_progress: 'В процессе',
  completed: 'Выполнено',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#666',
  in_progress: '#3b82f6',
  completed: '#22c55e',
};

export default function CoachPlayerProfileScreen() {
  const { id, username, email } = useLocalSearchParams<{ id: string; username: string; email: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [personalRoutines, setPersonalRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [data, routines] = await Promise.all([
            statsService.getPlayerActivity(Number(id)),
            routinesService.getPlayerPersonalRoutines(Number(id)).catch(() => []),
          ]);
          setActivity(data.activity);
          setTotal(data.total);
          setPersonalRoutines(routines);
        } catch {
          // тихо
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const todayDate = new Date().toLocaleDateString('en-CA');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(coach)/dashboard')}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Профиль игрока</Text>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username?.[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Игрок</Text>
          </View>
        </View>
      </View>

      <ActivityHeatmap activity={activity} total={total} />

      {/* Личная рутина игрока */}
      <Text style={styles.sectionTitle}>🔁 Личная рутина игрока</Text>
      {personalRoutines.length === 0 ? (
        <Text style={styles.emptyText}>Игрок пока не создал личных заданий</Text>
      ) : (
        personalRoutines.map((r) => (
          <View key={r.id} style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <View style={styles.routineHeaderLeft}>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[r.priority] }]} />
                <Text style={styles.routineTitle}>{r.title}</Text>
              </View>
              <Text style={styles.routineRate}>{r.completionRate ?? 0}%</Text>
            </View>

            {r.description ? (
              <Text style={styles.routineDescription}>{r.description}</Text>
            ) : null}

            <MonthGrid monthProgress={r.monthProgress || []} todayDate={todayDate} />

            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Сегодня:</Text>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[r.todayStatus || 'pending'] }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[r.todayStatus || 'pending'] }]}>
                  {STATUS_LABELS[r.todayStatus || 'pending']}
                </Text>
              </View>
            </View>
            {r.todayNote ? (
              <Text style={styles.todayNote}>«{r.todayNote}»</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#2a2d3e',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#f59e0b', fontSize: 24, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#888', fontSize: 13, marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#2a1f00', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  roleText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 14 },
  emptyText: { color: '#666', fontSize: 14 },
  routineCard: {
    backgroundColor: '#1a1d2e', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#2a2d3e',
  },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routineHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  routineTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  routineRate: { color: '#f59e0b', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  routineDescription: { color: '#888', fontSize: 12, marginBottom: 10 },
  todayRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  todayLabel: { color: '#888', fontSize: 13 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  todayNote: { color: '#aaa', fontSize: 12, fontStyle: 'italic', marginTop: 6 },
});
