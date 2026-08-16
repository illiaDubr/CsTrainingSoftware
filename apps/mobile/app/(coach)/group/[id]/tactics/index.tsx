import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TacticMapsView } from '../../../../../src/components/tactics/TacticMapsView';
import { useGroupPermission } from '../../../../../src/hooks/useGroupPermission';

export default function GroupTacticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));
  const groupId = Number(id);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🧠 Тактики</Text>
      <Text style={styles.subtitle}>Коллы по картам — выбери карту</Text>

      <TacticMapsView
        groupId={groupId}
        onMapPress={(mapName) => router.push(`${pathPrefix}/group/${id}/tactics/${encodeURIComponent(mapName)}` as any)}
        emptyHint={canManage ? 'Сначала загрузи хотя бы одну раскидку — тогда появится карта' : 'Тренер ещё не загрузил раскидки для команды'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
});
