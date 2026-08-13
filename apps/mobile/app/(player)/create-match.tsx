import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { matchesService } from '../../src/services/matchesService';
import { MatchClass } from '../../src/types';
import { showAlert } from '../../src/utils/alert';
import { CLASS_META } from '../../src/components/matches/matchMeta';

const CLASSES: MatchClass[] = ['esea', 'other'];

export default function CreateMatchScreen() {
  const router = useRouter();
  const { groupId, date } = useLocalSearchParams<{ groupId: string; date?: string }>();

  const initialDate = date ? date.split('-').reverse().join('.') : '';

  const [opponent, setOpponent] = useState('');
  const [matchClass, setMatchClass] = useState<MatchClass>('esea');
  const [dateStr, setDateStr] = useState(initialDate); // ДД.ММ.ГГГГ
  const [timeStr, setTimeStr] = useState(''); // ЧЧ:ММ
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!opponent.trim() || !dateStr.trim() || !timeStr.trim()) {
      showAlert('Ошибка', 'Заполни название, дату и время');
      return;
    }

    const [day, month, year] = dateStr.split('.').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

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

    setLoading(true);
    try {
      await matchesService.createMatch({
        group_id: Number(groupId),
        match_class: matchClass,
        opponent: opponent.trim(),
        scheduled_at: parsed.toISOString(),
        note: note.trim() || undefined,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось добавить матч');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новый матч</Text>

        <Text style={styles.label}>Класс матча</Text>
        <View style={styles.classRow}>
          {CLASSES.map((c) => {
            const meta = CLASS_META[c];
            const active = matchClass === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.classBtn, active && { borderColor: meta.color, backgroundColor: meta.softColor }]}
                onPress={() => setMatchClass(c)}
                disabled={loading}
              >
                <Text style={[styles.classBtnText, active && { color: meta.color }]}>{meta.icon} {meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Соперник или название турнира"
          placeholderTextColor="#5B677D"
          value={opponent}
          onChangeText={setOpponent}
          editable={!loading}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#5B677D"
            value={dateStr}
            onChangeText={setDateStr}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ЧЧ:ММ"
            placeholderTextColor="#5B677D"
            value={timeStr}
            onChangeText={setTimeStr}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Заметка (необязательно)"
          placeholderTextColor="#5B677D"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Добавить матч</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  classRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  classBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: '#242A40', alignItems: 'center', backgroundColor: '#151827',
  },
  classBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
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
