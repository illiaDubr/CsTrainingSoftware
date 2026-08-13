import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { trainingsService } from '../../../../src/services/trainingsService';
import { TrainingCard } from '../../../../src/components/cards/TrainingCard';
import { Training } from '../../../../src/types';
import { showAlert, showConfirm } from '../../../../src/utils/alert';
import { FAB } from '../../../../src/components/ui/FAB';
import { useGroupPermission } from '../../../../src/hooks/useGroupPermission';

export default function GroupTrainingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setTrainings(await trainingsService.getTrainingsByGroup(Number(id)));
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

  const handleDelete = (trainingId: number) => {
    showConfirm('Удалить тренировку?', undefined, async () => {
      try {
        await trainingsService.deleteTraining(trainingId);
        loadData();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить тренировку');
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
      <Text style={styles.title}>🎯 Тренировки</Text>

      {trainings.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Пока нет тренировок</Text></View>
      ) : (
        <FlatList
          data={trainings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <TrainingCard
              training={item}
              onEdit={canManage ? () => router.push(`${pathPrefix}/edit-training?groupId=${id}&trainingId=${item.id}` as any) : undefined}
              onDelete={canManage ? () => handleDelete(item.id) : undefined}
            />
          )}
        />
      )}

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/create-training?groupId=${id}` as any)} />
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
