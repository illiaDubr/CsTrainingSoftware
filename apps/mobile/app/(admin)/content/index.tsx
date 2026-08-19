import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminOverview } from '../../../src/types';
import { colors, radius, shadows } from '../../../src/theme';

const TILES = [
  { key: 'nades', label: 'Раскидки', icon: '💣', hint: 'Все раскидки по всем группам' },
  { key: 'tactics', label: 'Тактики', icon: '🧠', hint: 'Коллы и векторы движения' },
  { key: 'materials', label: 'Материалы', icon: '📚', hint: 'Обучающие материалы' },
  { key: 'trainings', label: 'Тренировки', icon: '🎯', hint: 'Расписание тренировок' },
  { key: 'matches', label: 'Матчи', icon: '📅', hint: 'Запланированные матчи' },
] as const;

export default function AdminContentHub() {
  const router = useRouter();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setData(await adminService.getOverview());
    } catch {
      // тихо
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const counts: Record<string, number> = {
    nades: data.content.nades,
    tactics: data.content.tactics,
    materials: data.content.materials,
    trainings: data.content.trainings,
    matches: data.content.matches,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🗂️ Контент</Text>
      <Text style={styles.subtitle}>Модерация контента по всем группам — просмотр и удаление</Text>

      <View style={styles.grid}>
        {TILES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tile}
            activeOpacity={0.7}
            onPress={() => router.push(`/(admin)/content/${t.key}` as any)}
          >
            <Text style={styles.tileIcon}>{t.icon}</Text>
            <Text style={styles.tileName}>{t.label}</Text>
            <Text style={styles.tileHint} numberOfLines={2}>{t.hint}</Text>
            <Text style={styles.tileCount}>{counts[t.key]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 900, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: {
    width: 200, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 18, minHeight: 130, ...shadows.subtle,
  },
  tileIcon: { fontSize: 28, marginBottom: 10 },
  tileName: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tileHint: { color: colors.textMuted, fontSize: 11, lineHeight: 15, marginBottom: 10 },
  tileCount: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
