import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NadesByMapView } from '../../../src/components/nades/NadesByMapView';

export default function PlayerNadesMapScreen() {
  const { map } = useLocalSearchParams<{ map: string }>();
  const router = useRouter();
  const mapName = decodeURIComponent(map || '');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🗺️ {mapName}</Text>

      <NadesByMapView mapName={mapName} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 14, letterSpacing: -0.5 },
});
