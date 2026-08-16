import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Tactic, NadeSide } from '../../types';
import { tacticsService } from '../../services/tacticsService';
import { TacticCard } from './TacticCard';
import { SIDE_META } from '../nades/nadeMeta';

interface Props {
  groupId: number;
  mapName: string;
  onTacticPress: (tactic: Tactic) => void;
  onEdit?: (tactic: Tactic) => void;
  onDelete?: (tactic: Tactic, reload: () => void) => void;
  emptyHint: string;
}

export function TacticsListView({ groupId, mapName, onTacticPress, onEdit, onDelete, emptyHint }: Props) {
  const [allTactics, setAllTactics] = useState<Tactic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sideFilter, setSideFilter] = useState<NadeSide | null>(null);

  const loadData = async () => {
    try {
      setAllTactics(await tacticsService.getTacticsByGroup(groupId));
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [groupId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const tactics = allTactics.filter(t => t.map_name === mapName);
  const filtered = tactics.filter(t => !sideFilter || t.side === sideFilter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
    >
      {tactics.length > 0 ? (
        <View style={styles.filterRow}>
          {(Object.keys(SIDE_META) as NadeSide[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sideFilter === s && { borderColor: SIDE_META[s].color, backgroundColor: SIDE_META[s].color + '22' }]}
              onPress={() => setSideFilter(sideFilter === s ? null : s)}
            >
              <Text style={[styles.chipText, sideFilter === s && { color: SIDE_META[s].color }]}>
                {SIDE_META[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧠</Text>
          <Text style={styles.emptyText}>{tactics.length > 0 ? 'Ничего не найдено — сбрось фильтры' : 'Тактик пока нет'}</Text>
          <Text style={styles.emptySubtext}>{emptyHint}</Text>
        </View>
      ) : (
        filtered.map(t => (
          <TacticCard
            key={t.id}
            tactic={t}
            onPress={() => onTacticPress(t)}
            onEdit={onEdit ? () => onEdit(t) : undefined}
            onDelete={onDelete ? () => onDelete(t, loadData) : undefined}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#151827',
  },
  chipActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#f59e0b' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#5B677D', fontSize: 13, textAlign: 'center' },
});
