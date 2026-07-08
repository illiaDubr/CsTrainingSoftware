import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MonthProgressDay } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#666', in_progress: '#3b82f6', completed: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не отмечено', in_progress: 'В процессе', completed: 'Выполнено',
};

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
};

interface Props {
  visible: boolean;
  day: MonthProgressDay | null;
  routineTitle: string;
  playerName?: string;
  onClose: () => void;
}

export function DayDetailModal({ visible, day, routineTitle, playerName, onClose }: Props) {
  if (!day) return null;

  const statusColor = STATUS_COLORS[day.status] || '#666';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.content} activeOpacity={1}>
          <Text style={styles.title}>{routineTitle}</Text>
          {playerName ? <Text style={styles.player}>{playerName}</Text> : null}
          <Text style={styles.date}>{formatDate(day.date)}</Text>

          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[day.status] || day.status}
            </Text>
          </View>

          {day.time_spent_minutes != null ? (
            <View style={styles.row}>
              <Text style={styles.label}>⏱ Затрачено времени</Text>
              <Text style={styles.value}>{formatTime(day.time_spent_minutes)}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>💬 Комментарий</Text>
          {day.note ? (
            <Text style={styles.note}>{day.note}</Text>
          ) : (
            <Text style={styles.emptyNote}>Комментария нет</Text>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Закрыть</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  content: {
    backgroundColor: '#1a1d2e', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#2a2d3e',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  player: { color: '#f59e0b', fontSize: 13, fontWeight: '600', marginTop: 2 },
  date: { color: '#888', fontSize: 13, marginTop: 2, marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  value: { color: '#fff', fontSize: 13, fontWeight: '700' },
  note: {
    color: '#ddd', fontSize: 13, lineHeight: 19,
    backgroundColor: '#14172a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#2a2d3e',
  },
  emptyNote: { color: '#555', fontSize: 13, fontStyle: 'italic' },
  closeBtn: {
    marginTop: 16, borderWidth: 1, borderColor: '#2a2d3e', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  closeBtnText: { color: '#888', fontWeight: '600' },
});
