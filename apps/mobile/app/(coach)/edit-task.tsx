import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tasksService } from '../../src/services/tasksService';
import { showAlert } from '../../src/utils/alert';

const PRIORITIES = [
  { value: 'low', label: 'Низкий', color: '#666' },
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
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#555"
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
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 28 },
  errorText: { color: '#888', fontSize: 15, marginBottom: 16 },
  input: {
    backgroundColor: '#1a1d2e', borderWidth: 1, borderColor: '#2a2d3e', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  label: { color: '#888', fontSize: 13, marginBottom: 10 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  priorityBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: '#2a2d3e', alignItems: 'center', backgroundColor: '#1a1d2e',
  },
  priorityBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  button: { backgroundColor: '#f59e0b', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
