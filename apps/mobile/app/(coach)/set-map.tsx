import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mapsService } from '../../src/services/mapsService';
import { showAlert } from '../../src/utils/alert';
import { colors, radius } from '../../src/theme';

const DURATIONS = [
  { label: 'Сегодня', days: 0 },
  { label: '3 дня', days: 2 },
  { label: 'Неделя', days: 6 },
];

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function SetMapScreen() {
  const router = useRouter();

  const [mapName, setMapName] = useState('');
  const [durationDays, setDurationDays] = useState(0);
  const [customDate, setCustomDate] = useState(''); // ДД.ММ.ГГГГ — приоритетнее чипсов
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!mapName.trim()) {
      showAlert('Ошибка', 'Введи название карты');
      return;
    }

    const today = new Date();
    let endDate: Date;

    if (customDate.trim()) {
      const [day, month, year] = customDate.split('.').map(Number);
      if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
        showAlert('Ошибка', 'Проверь формат даты (ДД.ММ.ГГГГ)');
        return;
      }
      endDate = new Date(year, month - 1, day);
      if (endDate.getDate() !== day || endDate.getMonth() !== month - 1) {
        showAlert('Ошибка', 'Такой даты не существует');
        return;
      }
      if (toDateStr(endDate) < toDateStr(today)) {
        showAlert('Ошибка', 'Дата окончания не может быть в прошлом');
        return;
      }
    } else {
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + durationDays);
    }

    setLoading(true);
    try {
      await mapsService.createMap({
        map_name: mapName.trim(),
        start_date: toDateStr(today),
        end_date: toDateStr(endDate),
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось назначить карту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🗺️ Карта дня</Text>
        <Text style={styles.subtitle}>
          Игроки твоих команд увидят её на главном экране. Новая карта заменяет предыдущую
        </Text>

        <Text style={styles.label}>Название карты</Text>
        <TextInput
          style={styles.input}
          placeholder="Mirage, Inferno, Dust2..."
          placeholderTextColor={colors.textFaint}
          value={mapName}
          onChangeText={setMapName}
          editable={!loading}
        />

        <Text style={styles.label}>Срок</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => {
            const active = !customDate.trim() && durationDays === d.days;
            return (
              <TouchableOpacity
                key={d.days}
                style={[styles.durationBtn, active && styles.durationBtnActive]}
                onPress={() => { setDurationDays(d.days); setCustomDate(''); }}
                disabled={loading}
              >
                <Text style={[styles.durationText, active && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>или укажи дату окончания</Text>
        <TextInput
          style={styles.input}
          placeholder="ДД.ММ.ГГГГ"
          placeholderTextColor={colors.textFaint}
          value={customDate}
          onChangeText={setCustomDate}
          keyboardType="numbers-and-punctuation"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Назначить карту</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: colors.primary, fontSize: 15, marginBottom: 20 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: 28, lineHeight: 18 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 15, marginBottom: 20,
  },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  durationBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface,
  },
  durationBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  durationText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  durationTextActive: { color: colors.primary },
  hint: { color: colors.textFaint, fontSize: 12, marginBottom: 10 },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
