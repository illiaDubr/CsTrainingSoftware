import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { materialsService } from '../../../../src/services/materialsService';
import { MaterialCard } from '../../../../src/components/cards/MaterialCard';
import { Material } from '../../../../src/types';
import { showAlert, showConfirm } from '../../../../src/utils/alert';

export default function CoachGroupMaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setMaterials(await materialsService.getMaterialsByGroup(Number(id)));
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
    }, [id])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (materialId: number) => {
    showConfirm('Удалить материал?', undefined, async () => {
      try {
        await materialsService.deleteMaterial(materialId);
        loadData();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить материал');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>📚 Материалы</Text>

      {materials.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Пока нет материалов</Text></View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <MaterialCard
              material={item}
              onDelete={() => handleDelete(item.id)}
              onEdit={() => router.push(`/(coach)/edit-material?groupId=${id}&materialId=${item.id}`)}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push(`/(coach)/create-material?groupId=${id}`)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
