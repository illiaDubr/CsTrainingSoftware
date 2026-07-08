import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MonthProgressDay, TaskStatus } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#748099', in_progress: '#3b82f6', completed: '#22c55e',
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

const EDIT_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'completed', label: '✓ Выполнено' },
  { value: 'in_progress', label: '⟳ В процессе' },
  { value: 'pending', label: '✕ Не выполнено' },
];

interface Props {
  visible: boolean;
  day: MonthProgressDay | null;
  routineTitle: string;
  playerName?: string;
  onClose: () => void;
  /** Тренер: смена статуса за этот день */
  onSetStatus?: (status: TaskStatus) => Promise<void>;
}

export function DayDetailModal({ visible, day, routineTitle, playerName, onClose, onSetStatus }: Props) {
  const [saving, setSaving] = useState<TaskStatus | null>(null);

  if (!day) return null;

  const statusColor = STATUS_COLORS[day.status] || '#748099';

  const handleSetStatus = async (status: TaskStatus) => {
    if (!onSetStatus || saving) return;
    setSaving(status);
    try {
      await onSetStatus(status);
      onClose();
    } finally {
      setSaving(null);
    }
  };

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

          {onSetStatus ? (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>✎ Изменить статус за этот день</Text>
              <View style={styles.editRow}>
                {EDIT_OPTIONS.map((opt) => {
                  const active = day.status === opt.value;
                  const color = STATUS_COLORS[opt.value];
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.editBtn, active && { borderColor: color, backgroundColor: color + '22' }]}
                      onPress={() => handleSetStatus(opt.value)}
                      disabled={!!saving}
                    >
                      {saving === opt.value
                        ? <ActivityIndicator size="small" color={color} />
                        : (
                          <Text style={[styles.editBtnText, active && { color }]}>
                            {opt.label}
                          </Text>
                        )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

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
    backgroundColor: '#151827', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#242A40',
  },
  title: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  player: { color: '#f59e0b', fontSize: 13, fontWeight: '600', marginTop: 2 },
  date: { color: '#94A3B8', fontSize: 13, marginTop: 2, marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  value: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  note: {
    color: '#D6DEEB', fontSize: 13, lineHeight: 19,
    backgroundColor: '#10131E', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#242A40',
  },
  emptyNote: { color: '#5B677D', fontSize: 13, fontStyle: 'italic' },
  editRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: {
    flex: 1, borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#10131E',
  },
  editBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    marginTop: 16, borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  closeBtnText: { color: '#94A3B8', fontWeight: '600' },
});
