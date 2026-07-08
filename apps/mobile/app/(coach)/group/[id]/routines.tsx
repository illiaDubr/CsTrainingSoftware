import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { routinesService } from '../../../../src/services/routinesService';
import { RoutineCardCoach } from '../../../../src/components/cards/RoutineCardCoach';
import { Routine } from '../../../../src/types';
import { showAlert, showConfirm } from '../../../../src/utils/alert';
import { FAB } from '../../../../src/components/ui/FAB';

export default function CoachGroupRoutinesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRoutines(await routinesService.getRoutinesByGroup(Number(id)));
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

  const handleDeactivate = (routineId: number) => {
    showConfirm('Удалить рутину?', 'Задание перестанет появляться у игроков', async () => {
      try {
        await routinesService.deactivateRoutine(routineId);
        loadData();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить рутину');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🔁 Рутина</Text>

      {routines.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Пока нет рутинных заданий</Text></View>
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
              onDelete={() => handleDeactivate(item.id)}
              onEdit={() => router.push(`/(coach)/edit-routine?groupId=${id}&routineId=${item.id}`)}
            />
          )}
        />
      )}

      <FAB onPress={() => router.push(`/(coach)/create-routine?groupId=${id}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
