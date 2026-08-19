import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminTrainingItem } from '../../../src/types';
import { showAlert, showConfirm } from '../../../src/utils/alert';
import { colors, radius, shadows } from '../../../src/theme';

export default function AdminTrainingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AdminTrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setItems(await adminService.getTrainings());
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((t) => `${t.title} ${t.group_name} ${t.coach_username ?? ''}`.toLowerCase().includes(q));
  }, [items, query]);

  const handleDelete = (item: AdminTrainingItem) => {
    showConfirm('Удалить тренировку?', item.title, async () => {
      setDeletingId(item.id);
      try {
        await adminService.deleteTraining(item.id);
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      } catch {
        showAlert('Ошибка', 'Не удалось удалить тренировку');
      } finally {
        setDeletingId(null);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🎯 Тренировки</Text>
      <Text style={styles.subtitle}>{filtered.length} из {items.length}</Text>

      <TextInput
        style={styles.search}
        placeholder="Поиск по названию, группе..."
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.listCard}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Ничего не найдено</Text>
        ) : (
          filtered.map((t) => (
            <View key={t.id} style={styles.row}>
              <Text style={styles.rowIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {new Date(t.scheduled_at).toLocaleString('ru-RU')} · {t.group_name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(t)}
                disabled={deletingId === t.id}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {deletingId === t.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Text style={styles.deleteBtnText}>✕</Text>}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 900, alignSelf: 'center' },
  back: { color: colors.primary, fontSize: 15, marginBottom: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: 16 },
  search: {
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14,
  },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.subtle,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: { fontSize: 18 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: colors.danger, fontSize: 16 },
  emptyText: { color: colors.textFaint, fontSize: 13, padding: 20, textAlign: 'center' },
});
