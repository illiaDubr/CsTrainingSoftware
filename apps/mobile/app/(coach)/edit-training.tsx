import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trainingsService } from '../../src/services/trainingsService';
import { Training } from '../../src/types';
import { showAlert } from '../../src/utils/alert';

export default function EditTrainingScreen() {
  const router = useRouter();
  const { groupId, trainingId } = useLocalSearchParams<{ groupId: string; trainingId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // ДД.ММ.ГГГГ
  const [time, setTime] = useState(''); // ЧЧ:ММ
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list: Training[] = await trainingsService.getTrainingsByGroup(Number(groupId));
        const training = list.find((t) => t.id === Number(trainingId));
        if (!training) {
          setNotFound(true);
          return;
        }
        const d = new Date(training.scheduled_at);
        setTitle(training.title);
        setDescription(training.description ?? '');
        setDate(d.toLocaleDateString('ru-RU')); // ДД.ММ.ГГГГ
        setTime(d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
        setDuration(training.duration_minutes ? String(training.duration_minutes) : '');
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, trainingId]);

  const handleSave = async () => {
    if (!title.trim() || !date.trim() || !time.trim()) {
      showAlert('Ошибка', 'Заполни название, дату и время');
      return;
    }

    const [day, month, year] = date.split('.').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    if (
      !day || !month || !year || isNaN(hours) || isNaN(minutes) ||
      day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 ||
      hours < 0 || hours > 23 || minutes < 0 || minutes > 59
    ) {
      showAlert('Ошибка', 'Проверь формат даты (ДД.ММ.ГГГГ) и времени (ЧЧ:ММ)');
      return;
    }

    const parsed = new Date(year, month - 1, day, hours, minutes);
    if (parsed.getDate() !== day || parsed.getMonth() !== month - 1) {
      showAlert('Ошибка', 'Такой даты не существует');
      return;
    }

    setSaving(true);
    try {
      await trainingsService.updateTraining(Number(trainingId), {
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: parsed.toISOString(),
        duration_minutes: Number(duration) || undefined,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить тренировку');
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
        <Text style={styles.errorText}>Тренировка не найдена</Text>
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

        <Text style={styles.title}>Редактировать тренировку</Text>

        <TextInput
          style={styles.input}
          placeholder="Название тренировки"
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
          numberOfLines={3}
          editable={!saving}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#5B677D"
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
            editable={!saving}
          />
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ЧЧ:ММ"
            placeholderTextColor="#5B677D"
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
            editable={!saving}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Длительность в минутах"
          placeholderTextColor="#5B677D"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          editable={!saving}
        />

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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  flexInput: { flex: 1 },
  button: {
    backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8,
    shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
