import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { routinesService } from '../../src/services/routinesService';
import { RoutineCardPlayer } from '../../src/components/cards/RoutineCardPlayer';
import { Routine } from '../../src/types';
import { showAlert, showConfirm } from '../../src/utils/alert';

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
                onUpdateStatus={async (routineId, status, note) => {
                  await routinesService.updateProgress(routineId, status, note);
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

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(player)/create-routine')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#555', fontSize: 13, textAlign: 'center' },
  deleteLink: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8, marginTop: -8, marginBottom: 12 },
  deleteLinkText: { color: '#ef4444', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
