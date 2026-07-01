import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Training } from '../../types';

interface Props {
  training: Training;
  onDelete?: () => void;
}

export function TrainingCard({ training, onDelete }: Props) {
  const date = new Date(training.scheduled_at);
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.dateBox}>
        <Text style={styles.day}>{date.getDate()}</Text>
        <Text style={styles.month}>{date.toLocaleDateString('ru-RU', { month: 'short' })}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{training.title}</Text>
        {training.description ? (
          <Text style={styles.description} numberOfLines={2}>{training.description}</Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{timeStr}</Text>
          {training.duration_minutes ? (
            <Text style={styles.metaText}> · {training.duration_minutes} мин</Text>
          ) : null}
        </View>
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#1a1d2e', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2d3e', alignItems: 'center',
  },
  dateBox: {
    width: 48, height: 48, borderRadius: 10, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  day: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold' },
  month: { color: '#f59e0b', fontSize: 10, textTransform: 'uppercase' },
  content: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  description: { color: '#888', fontSize: 12, marginBottom: 6 },
  meta: { flexDirection: 'row' },
  metaText: { color: '#666', fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#666', fontSize: 16 },
});