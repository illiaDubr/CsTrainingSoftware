import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../../types';

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

const PRIORITY_COLORS: Record<string, string> = {
  low: '#666',
  medium: '#f59e0b',
  high: '#ef4444',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

interface Props {
  task: Task;
  onPress: () => void;
}

export function TaskCard({ task, onPress }: Props) {
  const status = task.progress?.status || 'pending';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
      ) : null}

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[status] }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
        <Text style={styles.priorityText}>
          Приоритет: {PRIORITY_LABELS[task.priority]}
        </Text>
      </View>

      {task.due_date ? (
        <Text style={styles.dueDate}>
          До {new Date(task.due_date).toLocaleDateString('ru-RU')}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1d2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2d3e',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  description: { color: '#888', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  priorityText: { color: '#666', fontSize: 12 },
  dueDate: { color: '#666', fontSize: 12, marginTop: 8 },
});