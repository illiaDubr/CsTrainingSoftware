import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { NadeMapsView } from '../../../src/components/nades/NadeMapsView';

export default function PlayerNadesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(player)/dashboard')}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>💣 Раскидки</Text>
      <Text style={styles.subtitle}>Гранаты от тренера — учи базу, дефолт и имбы</Text>

      <NadeMapsView
        onMapPress={(mapName) => router.push(`/(player)/nades/${encodeURIComponent(mapName)}`)}
        emptyHint="Тренер ещё не загрузил раскидки"
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
