import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../../src/services/groupsService';
import { tasksService } from '../../../../src/services/tasksService';
import { trainingsService } from '../../../../src/services/trainingsService';
import { materialsService } from '../../../../src/services/materialsService';
import { routinesService } from '../../../../src/services/routinesService';

export default function CoachGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [counts, setCounts] = useState({ routines: 0, tasks: 0, trainings: 0, materials: 0, members: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [group, taskList, trainingList, materialList, routineList] = await Promise.all([
        groupsService.getGroupById(Number(id)),
        tasksService.getTasksByGroup(Number(id)),
        trainingsService.getTrainingsByGroup(Number(id)),
        materialsService.getMaterialsByGroup(Number(id)),
        routinesService.getRoutinesByGroup(Number(id)),
      ]);
      setGroupName(group.name);
      setCounts({
        routines: routineList.length,
        tasks: taskList.length,
        trainings: trainingList.length,
        materials: materialList.length,
        members: group.members?.length ?? 0,
      });
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
    { key: 'routines', label: 'Рутина', icon: '🔁', count: counts.routines, hint: 'Ежедневные задания', route: `/(coach)/group/${id}/routines` },
    { key: 'tasks', label: 'Задачи', icon: '📋', count: counts.tasks, hint: 'Разовые задачи', route: `/(coach)/group/${id}/tasks` },
    { key: 'trainings', label: 'Тренировки', icon: '🎯', count: counts.trainings, hint: 'Расписание', route: `/(coach)/group/${id}/trainings` },
    { key: 'materials', label: 'Материалы', icon: '📚', count: counts.materials, hint: 'Обучение', route: `/(coach)/group/${id}/materials` },
    { key: 'members', label: 'Игроки', icon: '👥', count: counts.members, hint: 'Состав группы', route: `/(coach)/group/${id}/members` },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
    >
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(coach)/dashboard')}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{groupName}</Text>
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
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: {
    width: '48%',
    backgroundColor: '#1a1d2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    padding: 16,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tileIcon: { fontSize: 28 },
  countBadge: {
    backgroundColor: '#2a1f00',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  countText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  tileLabel: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tileHint: { color: '#666', fontSize: 12 },
});
