import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { NadeMapSummary } from '../../types';
import { nadesService } from '../../services/nadesService';

interface Props {
  onMapPress: (mapName: string) => void;
  emptyHint: string;
}

export function NadeMapsView({ onMapPress, emptyHint }: Props) {
  const [maps, setMaps] = useState<NadeMapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setMaps(await nadesService.getMaps());
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
    }, [])
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
    >
      {maps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💣</Text>
          <Text style={styles.emptyText}>Раскидок пока нет</Text>
          <Text style={styles.emptySubtext}>{emptyHint}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {maps.map((m) => (
            <TouchableOpacity
              key={m.map_name}
              style={styles.tile}
              activeOpacity={0.7}
              onPress={() => onMapPress(m.map_name)}
            >
              <Text style={styles.tileIcon}>🗺️</Text>
              <Text style={styles.tileName} numberOfLines={1}>{m.map_name}</Text>
              <Text style={styles.tileCount}>{m.count} гранат</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: {
    width: '48%',
    backgroundColor: '#151827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242A40',
    padding: 16,
    minHeight: 100,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  tileIcon: { fontSize: 26, marginBottom: 10 },
  tileName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tileCount: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#5B677D', fontSize: 13, textAlign: 'center' },
});
