import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { showAlert } from '../../../src/utils/alert';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { tasksService } from '../../../src/services/tasksService';
import { Task, TaskStatus } from '../../../src/types';

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Не начато', color: '#748099' },
  { value: 'in_progress', label: 'В процессе', color: '#3b82f6' },
  { value: 'completed', label: 'Выполнено', color: '#22c55e' },
];

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTask = async () => {
    try {
      const data = await tasksService.getTaskById(Number(id));
      setTask(data);
      setNote(data.progress?.note || '');
    } catch {
      showAlert('Ошибка', 'Не удалось загрузить задачу');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [id])
  );

  const handleStatusChange = async (status: TaskStatus) => {
    setSaving(true);
    try {
      await tasksService.updateProgress(Number(id), status, note);
      await loadTask();
    } catch {
      showAlert('Ошибка', 'Не удалось обновить статус');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await tasksService.updateProgress(Number(id), task.progress.status, note);
      showAlert('Готово', 'Заметка сохранена');
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить заметку');
    } finally {
      setSaving(false);
    }
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

  const currentStatus = task.progress?.status || 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{task.title}</Text>

      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Приоритет:</Text>
        <Text style={styles.metaValue}>{PRIORITY_LABELS[task.priority]}</Text>
      </View>

      {task.due_date ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Дедлайн:</Text>
          <Text style={styles.metaValue}>
            {new Date(task.due_date).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Статус выполнения</Text>
      <View style={styles.statusRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[
              styles.statusBtn,
              currentStatus === s.value && { borderColor: s.color, backgroundColor: s.color + '22' },
            ]}
            onPress={() => handleStatusChange(s.value)}
            disabled={saving}
          >
            <Text style={[styles.statusBtnText, currentStatus === s.value && { color: s.color }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Заметка</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="Добавь заметку о выполнении..."
        placeholderTextColor="#5B677D"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.saveBtnText}>Сохранить заметку</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  description: { color: '#94A3B8', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaLabel: { color: '#748099', fontSize: 14, marginRight: 8 },
  metaValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '500' },
  sectionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242A40',
    backgroundColor: '#151827',
  },
  statusBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  noteInput: {
    backgroundColor: '#151827',
    borderWidth: 1,
    borderColor: '#242A40',
    borderRadius: 10,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#94A3B8', fontSize: 15 },
});