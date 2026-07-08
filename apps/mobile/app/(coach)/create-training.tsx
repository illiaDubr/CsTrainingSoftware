import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { showAlert } from '../../src/utils/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trainingsService } from '../../src/services/trainingsService';

export default function CreateTrainingScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // формат ДД.ММ.ГГГГ
  const [time, setTime] = useState(''); // формат ЧЧ:ММ
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !date.trim() || !time.trim()) {
      showAlert('Ошибка', 'Заполни название, дату и время');
      return;
    }

    // Парсим ДД.ММ.ГГГГ и ЧЧ:ММ в ISO
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
    const scheduledAt = parsed.toISOString();

    setLoading(true);
    try {
      await trainingsService.createTraining({
        group_id: Number(groupId),
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledAt,
        duration_minutes: Number(duration) || undefined,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось создать тренировку');
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

        <Text style={styles.title}>Новая тренировка</Text>

        <TextInput
          style={styles.input}
          placeholder="Название тренировки"
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

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#5B677D"
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ЧЧ:ММ"
            placeholderTextColor="#5B677D"
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Длительность в минутах"
          placeholderTextColor="#5B677D"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Создать тренировку</Text>
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
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
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
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});