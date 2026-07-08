import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tasksService } from '../../src/services/tasksService';
import { showAlert } from '../../src/utils/alert';

const PRIORITIES = [
  { value: 'low', label: 'Низкий', color: '#748099' },
  { value: 'medium', label: 'Средний', color: '#f59e0b' },
  { value: 'high', label: 'Высокий', color: '#ef4444' },
];

export default function EditTaskScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const task = await tasksService.getTaskById(Number(taskId));
        if (!task) {
          setNotFound(true);
          return;
        }
        setTitle(task.title);
        setDescription(task.description ?? '');
        setPriority(task.priority || 'medium');
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название задачи');
      return;
    }
    setSaving(true);
    try {
      await tasksService.updateTask(Number(taskId), {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить задачу');
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

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Задача не найдена</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Редактировать задачу</Text>

        <TextInput
          style={styles.input}
          placeholder="Название задачи"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!saving}
        />

        <Text style={styles.label}>Приоритет</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.priorityBtn, priority === p.value && { borderColor: p.color, backgroundColor: p.color + '22' }]}
              onPress={() => setPriority(p.value)}
              disabled={saving}
            >
              <Text style={[styles.priorityBtnText, priority === p.value && { color: p.color }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Сохранить</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  errorText: { color: '#94A3B8', fontSize: 15, marginBottom: 16 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  priorityBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: '#242A40', alignItems: 'center', backgroundColor: '#151827',
  },
  priorityBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  button: {
    backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
