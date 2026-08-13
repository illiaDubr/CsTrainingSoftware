import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NadesByMapView } from '../../../../../src/components/nades/NadesByMapView';
import { FAB } from '../../../../../src/components/ui/FAB';
import { nadesService } from '../../../../../src/services/nadesService';
import { showAlert, showConfirm } from '../../../../../src/utils/alert';
import { useGroupPermission } from '../../../../../src/hooks/useGroupPermission';

export default function GroupNadesMapScreen() {
  const { id, map } = useLocalSearchParams<{ id: string; map: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));
  const mapName = decodeURIComponent(map || '');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🗺️ {mapName}</Text>

      <NadesByMapView
        groupId={Number(id)}
        mapName={mapName}
        onEdit={canManage ? (nade) => router.push(`${pathPrefix}/edit-nade?groupId=${id}&nadeId=${nade.id}&map=${encodeURIComponent(mapName)}` as any) : undefined}
        onDelete={canManage ? (nade, reload) => {
          showConfirm('Удалить раскидку?', nade.title, async () => {
            try {
              await nadesService.deleteNade(nade.id);
              reload();
            } catch {
              showAlert('Ошибка', 'Не удалось удалить раскидку');
            }
          });
        } : undefined}
      />

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/create-nade?groupId=${id}&map=${encodeURIComponent(mapName)}` as any)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 14, letterSpacing: -0.5 },
});
