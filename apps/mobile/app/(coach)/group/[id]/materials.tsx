import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { materialsService } from '../../../../src/services/materialsService';
import { MaterialCard } from '../../../../src/components/cards/MaterialCard';
import { Material } from '../../../../src/types';
import { showAlert, showConfirm } from '../../../../src/utils/alert';
import { FAB } from '../../../../src/components/ui/FAB';
import { useGroupPermission } from '../../../../src/hooks/useGroupPermission';

export default function GroupMaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));

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
              onDelete={canManage ? () => handleDelete(item.id) : undefined}
              onEdit={canManage ? () => router.push(`${pathPrefix}/edit-material?groupId=${id}&materialId=${item.id}` as any) : undefined}
            />
          )}
        />
      )}

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/create-material?groupId=${id}` as any)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
});
