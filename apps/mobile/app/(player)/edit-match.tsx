import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { matchesService } from '../../src/services/matchesService';
import { Match, MatchClass } from '../../src/types';
import { showAlert, showConfirm } from '../../src/utils/alert';
import { CLASS_META } from '../../src/components/matches/matchMeta';

const CLASSES: MatchClass[] = ['esea', 'other'];

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function EditMatchScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [opponent, setOpponent] = useState('');
  const [matchClass, setMatchClass] = useState<MatchClass>('esea');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const match: Match = await matchesService.getMatchById(Number(matchId));
        const d = new Date(match.scheduled_at);
        setOpponent(match.opponent);
        setMatchClass(match.match_class);
        setDateStr(`${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`);
        setTimeStr(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
        setNote(match.note ?? '');
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  const handleSave = async () => {
    if (!opponent.trim() || !dateStr.trim() || !timeStr.trim()) {
      showAlert('Ошибка', 'Заполни соперника, дату и время');
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

    setSaving(true);
    try {
      await matchesService.updateMatch(Number(matchId), {
        match_class: matchClass,
        opponent: opponent.trim(),
        scheduled_at: parsed.toISOString(),
        note: note.trim(),
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить матч');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm('Удалить матч?', `vs ${opponent}`, async () => {
      setDeleting(true);
      try {
        await matchesService.deleteMatch(Number(matchId));
        router.back();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить матч');
      } finally {
        setDeleting(false);
      }
    }, 'Удалить');
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
        <Text style={styles.errorText}>Матч не найден</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const busy = saving || deleting;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} disabled={busy}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Редактировать матч</Text>

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
                disabled={busy}
              >
                <Text style={[styles.classBtnText, active && { color: meta.color }]}>{meta.icon} {meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Соперник (название команды)"
          placeholderTextColor="#5B677D"
          value={opponent}
          onChangeText={setOpponent}
          editable={!busy}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#5B677D"
            value={dateStr}
            onChangeText={setDateStr}
            keyboardType="numbers-and-punctuation"
            editable={!busy}
          />
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="ЧЧ:ММ"
            placeholderTextColor="#5B677D"
            value={timeStr}
            onChangeText={setTimeStr}
            keyboardType="numbers-and-punctuation"
            editable={!busy}
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
          editable={!busy}
        />

        <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleSave} disabled={busy}>
          {saving
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Сохранить</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={busy}>
          {deleting
            ? <ActivityIndicator color="#EF4444" />
            : <Text style={styles.deleteText}>Удалить матч</Text>
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
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  errorText: { color: '#94A3B8', fontSize: 15, marginBottom: 16 },
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
  deleteBtn: { alignItems: 'center', marginTop: 16, padding: 10 },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
