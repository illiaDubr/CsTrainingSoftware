import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { tasksService } from '../../../../src/services/tasksService';
import { trainingsService } from '../../../../src/services/trainingsService';
import { materialsService } from '../../../../src/services/materialsService';
import { routinesService } from '../../../../src/services/routinesService';
import { Routine } from '../../../../src/types';

export default function PlayerGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [counts, setCounts] = useState({ routines: 0, tasks: 0, trainings: 0, materials: 0 });
  const [routinesDone, setRoutinesDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [routineList, taskList, trainingList, materialList] = await Promise.all([
        routinesService.getRoutinesByGroup(Number(id)),
        tasksService.getTasksByGroup(Number(id)),
        trainingsService.getTrainingsByGroup(Number(id)),
        materialsService.getMaterialsByGroup(Number(id)),
      ]);
      setCounts({
        routines: routineList.length,
        tasks: taskList.length,
        trainings: trainingList.length,
        materials: materialList.length,
      });
      setRoutinesDone(
        (routineList as Routine[]).filter((r) => r.todayStatus === 'completed').length
      );
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
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

  const TILES = [
    {
      key: 'routines', label: 'Рутина', icon: '🔁',
      count: counts.routines,
      hint: counts.routines > 0 ? `Выполнено сегодня: ${routinesDone}/${counts.routines}` : 'Ежедневные задания',
      route: `/(player)/group/${id}/routines`,
    },
    { key: 'tasks', label: 'Задачи', icon: '📋', count: counts.tasks, hint: 'Твои задачи', route: `/(player)/group/${id}/tasks` },
    { key: 'trainings', label: 'Тренировки', icon: '🎯', count: counts.trainings, hint: 'Расписание', route: `/(player)/group/${id}/trainings` },
    { key: 'materials', label: 'Материалы', icon: '📚', count: counts.materials, hint: 'Обучение', route: `/(player)/group/${id}/materials` },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
    >
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(player)/dashboard')}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Группа</Text>
      <Text style={styles.subtitle}>Выбери раздел</Text>

      <View style={styles.grid}>
        {TILES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tile}
            activeOpacity={0.7}
            onPress={() => router.push(t.route as any)}
          >
            <View style={styles.tileTop}>
              <Text style={styles.tileIcon}>{t.icon}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{t.count}</Text>
              </View>
            </View>
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={styles.tileHint}>{t.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 14, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: {
    width: '48%',
    backgroundColor: '#151827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242A40',
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tileIcon: { fontSize: 28 },
  countBadge: {
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  countText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  tileLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tileHint: { color: '#748099', fontSize: 12 },
});
