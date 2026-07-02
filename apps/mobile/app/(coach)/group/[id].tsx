import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../src/services/groupsService';
import { tasksService } from '../../../src/services/tasksService';
import { trainingsService } from '../../../src/services/trainingsService';
import { materialsService } from '../../../src/services/materialsService';
import { routinesService } from '../../../src/services/routinesService';
import { TaskCard } from '../../../src/components/cards/TaskCard';
import { TrainingCard } from '../../../src/components/cards/TrainingCard';
import { MaterialCard } from '../../../src/components/cards/MaterialCard';
import { Task, Training, Material, Routine, RoutineProgress } from '../../../src/types';
import { RoutineCardCoach } from '../../../src/components/cards/RoutineCardCoach';

interface Member {
  id: number;
  username: string;
  email: string;
}

type Tab = 'routines' | 'tasks' | 'trainings' | 'materials' | 'members';

export default function CoachGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('routines');

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
      setMembers(group.members);
      setTasks(taskList);
      setTrainings(trainingList);
      setMaterials(materialList);
      setRoutines(routineList);
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

  const handleDeleteTraining = (trainingId: number) => {
    Alert.alert('Удалить тренировку?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await trainingsService.deleteTraining(trainingId);
          loadData();
        },
      },
    ]);
  };

  const handleDeleteMaterial = (materialId: number) => {
    Alert.alert('Удалить материал?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await materialsService.deleteMaterial(materialId);
          loadData();
        },
      },
    ]);
  };

  const handleDeactivateRoutine = (routineId: number) => {
    Alert.alert('Удалить рутину?', 'Задание перестанет появляться у игроков', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await routinesService.deactivateRoutine(routineId);
          loadData();
        },
      },
    ]);
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
    { key: 'members', label: `Игроки (${members.length})` },
  ];

  const getFabAction = () => {
    switch (tab) {
      case 'routines': return () => router.push(`/(coach)/create-routine?groupId=${id}`);
      case 'tasks': return () => router.push(`/(coach)/create-task?groupId=${id}`);
      case 'trainings': return () => router.push(`/(coach)/create-training?groupId=${id}`);
      case 'materials': return () => router.push(`/(coach)/create-material?groupId=${id}`);
      case 'members': return () => router.push(`/(coach)/add-member?groupId=${id}`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{groupName}</Text>

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
      <Text style={styles.emptyText}>Пока нет рутинных заданий</Text>
    </View>
  ) : (
    <FlatList
      data={routines}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      renderItem={({ item }) => (
        <RoutineCardCoach
          routine={item}
          todayDate={new Date().toLocaleDateString('en-CA')}
          onDelete={() => handleDeactivateRoutine(item.id)}
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
              <TaskCard task={item} onPress={() => router.push(`/(coach)/task/${item.id}`)} />
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
            renderItem={({ item }) => (
              <TrainingCard training={item} onDelete={() => handleDeleteTraining(item.id)} />
            )}
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
            renderItem={({ item }) => (
              <MaterialCard material={item} onDelete={() => handleDeleteMaterial(item.id)} />
            )}
          />
        )
      )}

      {tab === 'members' && (
        members.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Пока нет игроков в группе</Text></View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberCard}
                onPress={() => router.push(`/(coach)/player/${item.id}?username=${item.username}&email=${item.email}`)}
                activeOpacity={0.7}
             >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
               <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.username}</Text>
      <            Text style={styles.memberEmail}>{item.email}</Text>
                </View>
                <Text style={{ color: '#555', fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            )}
          />
        )
      )}

      <TouchableOpacity style={styles.fab} onPress={getFabAction()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  routineHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2d3e',
  },
  routineTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  routineProgress: { color: '#f59e0b', fontSize: 13, fontWeight: '600', marginRight: 12 },
  deleteText: { color: '#666', fontSize: 16, padding: 4 },
  playerProgressRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#14172a',
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#2a2d3e',
  },
  playerName: { color: '#aaa', fontSize: 13 },
  miniStatus: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  miniStatusText: { fontSize: 11, fontWeight: '600' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2d3e',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  memberAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});