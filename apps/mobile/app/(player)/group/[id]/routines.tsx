import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { routinesService } from '../../../../src/services/routinesService';
import { RoutineCardPlayer } from '../../../../src/components/cards/RoutineCardPlayer';
import { Routine } from '../../../../src/types';
import { FAB } from '../../../../src/components/ui/FAB';
import { showAlert, showConfirm } from '../../../../src/utils/alert';
import { useGroupPermission } from '../../../../src/hooks/useGroupPermission';

export default function PlayerGroupRoutinesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage } = useGroupPermission(Number(id));

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

  const handleDelete = (routineId: number) => {
    showConfirm('Удалить рутину?', undefined, async () => {
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
        <View style={styles.empty}><Text style={styles.emptyText}>Тренер пока не назначил рутину</Text></View>
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
              onUpdateStatus={async (routineId, status, note, timeSpent) => {
                await routinesService.updateProgress(routineId, status, note, timeSpent);
                await loadData();
              }}
              onEdit={canManage ? () => router.push(`/(player)/edit-routine?groupId=${id}&routineId=${item.id}` as any) : undefined}
              onDelete={canManage ? () => handleDelete(item.id) : undefined}
            />
          )}
        />
      )}

      {canManage ? (
        <FAB onPress={() => router.push(`/(player)/create-routine?groupId=${id}` as any)} />
      ) : null}
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
});
