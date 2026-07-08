import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { showAlert, showConfirm } from '../../../src/utils/alert';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { tasksService } from '../../../src/services/tasksService';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не начато',
  in_progress: 'В процессе',
  completed: 'Выполнено',
  overdue: 'Просрочено',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#666',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  overdue: '#ef4444',
};

interface PlayerProgress {
  player_id: number;
  username: string;
  status: string;
  note?: string;
}

export default function CoachTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTask = async () => {
    try {
      const data = await tasksService.getTaskById(Number(id));
      setTask(data);
    } catch {
      // тихо
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [id])
  );

  const handleDelete = () => {
    showConfirm('Удалить задачу?', 'Это действие нельзя отменить', async () => {
      try {
        await tasksService.deleteTask(Number(id));
        router.back();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить задачу');
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

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Задача не найдена</Text>
      </View>
    );
  }

  const progress: PlayerProgress[] = task.progress || [];
  const completed = progress.filter(p => p.status === 'completed').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{task.title}</Text>

      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}

      <Text style={styles.progressSummary}>
        Выполнили {completed} из {progress.length}
      </Text>

      <Text style={styles.sectionTitle}>Прогресс игроков</Text>

      {progress.length === 0 ? (
        <Text style={styles.emptyText}>В группе пока нет игроков</Text>
      ) : (
        progress.map((p) => (
          <View key={p.player_id} style={styles.playerCard}>
            <View>
              <Text style={styles.playerName}>{p.username}</Text>
              {p.note ? <Text style={styles.playerNote}>{p.note}</Text> : null}
            </View>
            <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[p.status] }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] }]}>
                {STATUS_LABELS[p.status]}
              </Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(coach)/edit-task?taskId=${id}`)}>
        <Text style={styles.editBtnText}>Редактировать задачу</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Удалить задачу</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  description: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  progressSummary: { color: '#f59e0b', fontSize: 14, fontWeight: '600', marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14 },
  playerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1d2e', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#2a2d3e',
  },
  playerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  playerNote: { color: '#888', fontSize: 12, marginTop: 4, maxWidth: 200 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  editBtn: {
    borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 30,
  },
  editBtnText: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    borderWidth: 1, borderColor: '#ef4444', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#888', fontSize: 15 },
});