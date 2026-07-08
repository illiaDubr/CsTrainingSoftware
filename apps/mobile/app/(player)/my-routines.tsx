import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { routinesService } from '../../src/services/routinesService';
import { RoutineCardPlayer } from '../../src/components/cards/RoutineCardPlayer';
import { Routine } from '../../src/types';
import { showAlert, showConfirm } from '../../src/utils/alert';
import { FAB } from '../../src/components/ui/FAB';

export default function MyRoutinesScreen() {
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRoutines(await routinesService.getMyPersonalRoutines());
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
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (routineId: number) => {
    showConfirm('Удалить рутину?', 'История прогресса тоже удалится из списка', async () => {
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
      <Text style={styles.title}>🔁 Моя рутина</Text>
      <Text style={styles.subtitle}>Личные ежедневные задания — виден только тебе и тренеру</Text>

      {routines.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Пока нет личных заданий</Text>
          <Text style={styles.emptySubtext}>Создай первое — например, «100 фрагов в DM» или «30 минут aim_botz»</Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <View>
              <RoutineCardPlayer
                routine={item}
                todayDate={new Date().toLocaleDateString('en-CA')}
                onUpdateStatus={async (routineId, status, note, timeSpent) => {
                  await routinesService.updateProgress(routineId, status, note, timeSpent);
                  await loadData();
                }}
              />
              <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteLinkText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <FAB onPress={() => router.push('/(player)/create-routine')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#5B677D', fontSize: 13, textAlign: 'center' },
  deleteLink: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8, marginTop: -8, marginBottom: 12 },
  deleteLinkText: { color: '#ef4444', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
