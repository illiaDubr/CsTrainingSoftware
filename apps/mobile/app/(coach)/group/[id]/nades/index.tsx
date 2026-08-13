import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NadeMapsView } from '../../../../../src/components/nades/NadeMapsView';
import { FAB } from '../../../../../src/components/ui/FAB';
import { useGroupPermission } from '../../../../../src/hooks/useGroupPermission';

export default function GroupNadesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));
  const groupId = Number(id);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>💣 Раскидки</Text>
      <Text style={styles.subtitle}>Гранаты по картам — база, дефолт LosEspada и имбовые</Text>

      <NadeMapsView
        groupId={groupId}
        onMapPress={(mapName) => router.push(`${pathPrefix}/group/${id}/nades/${encodeURIComponent(mapName)}` as any)}
        emptyHint={canManage ? 'Нажми «+», чтобы загрузить первую гранату' : 'Тренер ещё не загрузил раскидки для команды'}
      />

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/create-nade?groupId=${id}` as any)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
});
