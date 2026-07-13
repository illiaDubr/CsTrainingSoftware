import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { NadeMapsView } from '../../../src/components/nades/NadeMapsView';
import { FAB } from '../../../src/components/ui/FAB';

export default function CoachNadesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(coach)/dashboard')}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>💣 Раскидки</Text>
      <Text style={styles.subtitle}>Гранаты по картам — база, дефолт LosEspada и имбовые</Text>

      <NadeMapsView
        onMapPress={(mapName) => router.push(`/(coach)/nades/${encodeURIComponent(mapName)}`)}
        emptyHint="Нажми «+», чтобы загрузить первую гранату"
      />

      <FAB onPress={() => router.push('/(coach)/create-nade')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
});
