import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { showAlert } from '../../src/utils/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { routinesService } from '../../src/services/routinesService';

const PRIORITIES = [
  { value: 'low', label: 'Низкий', color: '#748099' },
  { value: 'medium', label: 'Средний', color: '#f59e0b' },
  { value: 'high', label: 'Высокий', color: '#ef4444' },
];

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название задания');
      return;
    }
    setLoading(true);
    try {
      await routinesService.createRoutine({
        group_id: Number(groupId),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось создать рутину');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новое ежедневное задание</Text>
        <Text style={styles.subtitle}>Будет появляться у каждого игрока каждый день</Text>

        <TextInput
          style={styles.input}
          placeholder="Название задания"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Приоритет</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.priorityBtn, priority === p.value && { borderColor: p.color, backgroundColor: p.color + '22' }]}
              onPress={() => setPriority(p.value)}
            >
              <Text style={[styles.priorityBtnText, priority === p.value && { color: p.color }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Создать</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 28 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
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
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});