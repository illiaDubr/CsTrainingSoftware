import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../../src/services/groupsService';
import { tasksService } from '../../../../src/services/tasksService';
// Разделы «Тренировки» и «Материалы» временно скрыты — см. комментарии ниже
// import { trainingsService } from '../../../../src/services/trainingsService';
// import { materialsService } from '../../../../src/services/materialsService';
import { routinesService } from '../../../../src/services/routinesService';
import { matchesService } from '../../../../src/services/matchesService';
import { nadesService } from '../../../../src/services/nadesService';
import { tacticsService } from '../../../../src/services/tacticsService';
import { mapsService, MapOfDay } from '../../../../src/services/mapsService';
import { MapOfDayBanner } from '../../../../src/components/ui/MapOfDayBanner';
import { showAlert, showConfirm } from '../../../../src/utils/alert';

export default function CoachGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  // trainings / materials временно не используются, но оставлены в стейте под будущее возвращение разделов
  const [counts, setCounts] = useState({ routines: 0, tasks: 0, trainings: 0, materials: 0, members: 0, matches: 0, nades: 0, tactics: 0 });
  const [activeMap, setActiveMap] = useState<MapOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [group, taskList, routineList, matchList, nadeMaps, tacticList, map] = await Promise.all([
        groupsService.getGroupById(Number(id)),
        tasksService.getTasksByGroup(Number(id)),
        // trainingsService.getTrainingsByGroup(Number(id)),
        // materialsService.getMaterialsByGroup(Number(id)),
        routinesService.getRoutinesByGroup(Number(id)),
        matchesService.getMatchesByGroup(Number(id)).catch(() => []),
        nadesService.getMaps(Number(id)).catch(() => []),
        tacticsService.getTacticsByGroup(Number(id)).catch(() => []),
        mapsService.getActiveMap(Number(id)).catch(() => null),
      ]);
      setGroupName(group.name);
      setCounts({
        routines: routineList.length,
        tasks: taskList.length,
        // trainings: trainingList.length,
        // materials: materialList.length,
        trainings: 0,
        materials: 0,
        members: group.members?.length ?? 0,
        matches: matchList.length,
        nades: nadeMaps.length,
        tactics: tacticList.length,
      });
      setActiveMap(map);
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveMap = () => {
    if (!activeMap) return;
    showConfirm('Снять карту дня?', activeMap.map_name, async () => {
      try {
        await mapsService.deleteMap(activeMap.id);
        setActiveMap(null);
      } catch {
        showAlert('Ошибка', 'Не удалось снять карту');
      }
    });
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
    { key: 'matches', label: 'Календарь матчей', icon: '📅', count: counts.matches, hint: 'ESEA и другие игры', route: `/(coach)/group/${id}/matches` },
    { key: 'nades', label: 'Раскидки', icon: '💣', count: counts.nades, hint: 'Гранаты по картам', route: `/(coach)/group/${id}/nades` },
    { key: 'tactics', label: 'Тактики', icon: '🧠', count: counts.tactics, hint: 'Коллы на раунд', route: `/(coach)/group/${id}/tactics` },
    { key: 'routines', label: 'Рутина', icon: '🔁', count: counts.routines, hint: 'Ежедневные задания', route: `/(coach)/group/${id}/routines` },
    { key: 'tasks', label: 'Задачи', icon: '📋', count: counts.tasks, hint: 'Разовые задачи', route: `/(coach)/group/${id}/tasks` },
    // Временно скрыто — вернуть, раскомментировав строки ниже (экраны и API на месте):
    // { key: 'trainings', label: 'Тренировки', icon: '🎯', count: counts.trainings, hint: 'Расписание', route: `/(coach)/group/${id}/trainings` },
    // { key: 'materials', label: 'Материалы', icon: '📚', count: counts.materials, hint: 'Обучение', route: `/(coach)/group/${id}/materials` },
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

      {activeMap ? (
        <MapOfDayBanner
          map={activeMap}
          onPress={() => router.push(`/(coach)/set-map?groupId=${id}` as any)}
          onRemove={handleRemoveMap}
        />
      ) : (
        <TouchableOpacity
          style={styles.setMapTile}
          activeOpacity={0.7}
          onPress={() => router.push(`/(coach)/set-map?groupId=${id}` as any)}
        >
          <Text style={styles.setMapIcon}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.setMapTitle}>Назначить карту дня</Text>
            <Text style={styles.setMapHint}>Игроки этой команды увидят её у себя</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

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
  setMapTile: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#151827',
    borderRadius: 16, borderWidth: 1, borderColor: '#242A40',
    padding: 16, marginBottom: 14,
  },
  setMapIcon: { fontSize: 24, marginRight: 12 },
  setMapTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  setMapHint: { color: '#748099', fontSize: 12 },
  chevron: { color: '#748099', fontSize: 22, marginLeft: 8 },
});
