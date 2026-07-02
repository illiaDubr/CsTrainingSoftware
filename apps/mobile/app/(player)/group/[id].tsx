import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { tasksService } from '../../../src/services/tasksService';
import { trainingsService } from '../../../src/services/trainingsService';
import { materialsService } from '../../../src/services/materialsService';
import { routinesService } from '../../../src/services/routinesService';
import { TaskCard } from '../../../src/components/cards/TaskCard';
import { TrainingCard } from '../../../src/components/cards/TrainingCard';
import { MaterialCard } from '../../../src/components/cards/MaterialCard';
import { Task, Training, Material, Routine, RoutineProgress } from '../../../src/types';
import { RoutineCardPlayer } from '../../../src/components/cards/RoutineCardPlayer';

type Tab = 'routines' | 'tasks' | 'trainings' | 'materials';

export default function PlayerGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('routines');

  const loadData = async () => {
    try {
      const [routineList, taskList, trainingList, materialList] = await Promise.all([
        routinesService.getRoutinesByGroup(Number(id)),
        tasksService.getTasksByGroup(Number(id)),
        trainingsService.getTrainingsByGroup(Number(id)),
        materialsService.getMaterialsByGroup(Number(id)),
      ]);
      setRoutines(routineList);
      setTasks(taskList);
      setTrainings(trainingList);
      setMaterials(materialList);
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

  const handleToggleRoutine = async (routine: Routine) => {
    const progress = routine.progress as RoutineProgress;
    const newStatus = progress.status === 'completed' ? 'pending' : 'completed';

    setTogglingId(routine.id);
    try {
      await routinesService.updateProgress(routine.id, newStatus);
      await loadData();
    } catch {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'routines', label: `Рутина (${routines.length})` },
    { key: 'tasks', label: `Задачи (${tasks.length})` },
    { key: 'trainings', label: `Тренировки (${trainings.length})` },
    { key: 'materials', label: `Материалы (${materials.length})` },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Группа</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {tab === 'routines' && (
  routines.length === 0 ? (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>Тренер пока не назначил рутину</Text>
    </View>
  ) : (
    <FlatList
      data={routines}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      renderItem={({ item }) => (
        <RoutineCardPlayer
          routine={item}
          todayDate={new Date().toLocaleDateString('en-CA')}
          onUpdateStatus={async (routineId, status, note) => {
            await routinesService.updateProgress(routineId, status, note);
            await loadData();
          }}
        />
      )}
    />
  )
)}

      {tab === 'tasks' && (
        tasks.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Пока нет задач</Text></View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={() => router.push(`/(player)/task/${item.id}`)} />
            )}
          />
        )
      )}

      {tab === 'trainings' && (
        trainings.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Пока нет тренировок</Text></View>
        ) : (
          <FlatList
            data={trainings}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => <TrainingCard training={item} />}
          />
        )
      )}

      {tab === 'materials' && (
        materials.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Пока нет материалов</Text></View>
        ) : (
          <FlatList
            data={materials}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => <MaterialCard material={item} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  tabsScroll: { flexGrow: 0, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1d2e', borderWidth: 1, borderColor: '#2a2d3e' },
  tabActive: { borderColor: '#f59e0b', backgroundColor: '#2a1f00' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#f59e0b' },
  list: { paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
});