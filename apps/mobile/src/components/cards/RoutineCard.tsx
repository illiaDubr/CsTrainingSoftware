import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TaskStatus } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#748099',
  in_progress: '#3b82f6',
  completed: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не начато',
  in_progress: 'В процессе',
  completed: 'Выполнено',
};

interface Props {
  title: string;
  description?: string;
  status: TaskStatus;
  onToggle: () => void;
  loading?: boolean;
}

export function RoutineCard({ title, description, status, onToggle, loading }: Props) {
  const isCompleted = status === 'completed';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
        onPress={onToggle}
        disabled={loading}
      >
        {isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[status] }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242A40',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3d4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#0B0D14', fontWeight: 'bold', fontSize: 14 },
  content: { flex: 1, marginRight: 8 },
  title: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  titleCompleted: { color: '#748099', textDecorationLine: 'line-through' },
  description: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
});