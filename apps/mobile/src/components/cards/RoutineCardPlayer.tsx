import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Routine, TaskStatus } from '../../types';
import { MonthGrid } from '../ui/MonthGrid';

const STATUS_CONFIG = [
  { value: 'completed' as TaskStatus, label: '✓ Выполнено', color: '#22c55e', bg: '#0a2a0a' },
  { value: 'in_progress' as TaskStatus, label: '⟳ В процессе', color: '#3b82f6', bg: '#0a1a3a' },
  { value: 'pending' as TaskStatus, label: '✕ Не выполнено', color: '#666', bg: '#1e2235' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#666', medium: '#f59e0b', high: '#ef4444',
};

interface Props {
  routine: Routine;
  todayDate: string;
  onUpdateStatus: (routineId: number, status: TaskStatus, note: string) => Promise<void>;
}

export function RoutineCardPlayer({ routine, todayDate, onUpdateStatus }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(routine.todayStatus || 'pending');
  const [note, setNote] = useState(routine.todayNote || '');
  const [saving, setSaving] = useState(false);

  const todayStatus = routine.todayStatus || 'pending';
  const currentConfig = STATUS_CONFIG.find(s => s.value === todayStatus) || STATUS_CONFIG[2];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStatus(routine.id, selectedStatus, note);
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[routine.priority] }]} />
          <Text style={styles.title}>{routine.title}</Text>
        </View>
        <Text style={styles.rate}>{routine.completionRate}%</Text>
      </View>

      {routine.description ? (
        <Text style={styles.description}>{routine.description}</Text>
      ) : null}

      {/* Сетка месяца */}
      <MonthGrid
        monthProgress={routine.monthProgress || []}
        todayDate={todayDate}
      />

      {/* Легенда */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Выполнено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>В процессе</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2a2d3e' }]} />
          <Text style={styles.legendText}>Не отмечено</Text>
        </View>
      </View>

      {/* Кнопка отметить сегодня */}
      <TouchableOpacity
        style={[styles.markBtn, { backgroundColor: currentConfig.bg, borderColor: currentConfig.color }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.markBtnText, { color: currentConfig.color }]}>
          Сегодня: {currentConfig.label}
        </Text>
        <Text style={[styles.markBtnEdit, { color: currentConfig.color }]}>Изменить</Text>
      </TouchableOpacity>

      {/* Модальное окно */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{routine.title}</Text>
            <Text style={styles.modalSubtitle}>Отметь выполнение за сегодня</Text>

            {STATUS_CONFIG.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.statusOption,
                  { borderColor: selectedStatus === s.value ? s.color : '#2a2d3e' },
                  selectedStatus === s.value && { backgroundColor: s.bg },
                ]}
                onPress={() => setSelectedStatus(s.value)}
              >
                <Text style={[styles.statusOptionText, { color: selectedStatus === s.value ? s.color : '#888' }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.noteInput}
              placeholder="Заметка (необязательно)..."
              placeholderTextColor="#555"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.saveBtnText}>Сохранить</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1d2e', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#2a2d3e',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  rate: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
  description: { color: '#888', fontSize: 12, marginBottom: 4 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { color: '#666', fontSize: 10 },
  markBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  markBtnText: { fontSize: 13, fontWeight: '600' },
  markBtnEdit: { fontSize: 11, opacity: 0.7 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1d2e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  statusOption: {
    borderWidth: 1, borderRadius: 10, padding: 14,
    marginBottom: 10,
  },
  statusOptionText: { fontSize: 14, fontWeight: '600' },
  noteInput: {
    backgroundColor: '#14172a', borderWidth: 1, borderColor: '#2a2d3e',
    borderRadius: 10, padding: 12, color: '#fff', fontSize: 13,
    minHeight: 80, textAlignVertical: 'top', marginTop: 8, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: '#2a2d3e', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: '#888', fontWeight: '600' },
  saveBtn: {
    flex: 2, backgroundColor: '#f59e0b', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});