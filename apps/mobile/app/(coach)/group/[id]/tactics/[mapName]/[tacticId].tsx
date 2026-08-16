import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MapCanvas } from '../../../../../../src/components/nades/MapCanvas';
import { NadeCard } from '../../../../../../src/components/nades/NadeCard';
import { NadeDetailModal } from '../../../../../../src/components/nades/NadeDetailModal';
import { SIDE_META } from '../../../../../../src/components/nades/nadeMeta';
import { useGroupPermission } from '../../../../../../src/hooks/useGroupPermission';
import { tacticsService } from '../../../../../../src/services/tacticsService';
import { nadesService } from '../../../../../../src/services/nadesService';
import { showAlert, showConfirm } from '../../../../../../src/utils/alert';
import { Tactic, Nade } from '../../../../../../src/types';

export default function TacticDetailScreen() {
  const { id, tacticId } = useLocalSearchParams<{ id: string; tacticId: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));

  const [tactic, setTactic] = useState<Tactic | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedNade, setSelectedNade] = useState<Nade | null>(null);

  const loadData = async () => {
    try {
      const t: Tactic = await tacticsService.getTacticById(Number(tacticId));
      setTactic(t);
      const bg = await nadesService.getBackground(Number(id), t.map_name).catch(() => null);
      setBackgroundUrl(bg?.image_url ?? null);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [tacticId])
  );

  const handleDelete = () => {
    if (!tactic) return;
    showConfirm('Удалить тактику?', tactic.title, async () => {
      try {
        await tacticsService.deleteTactic(tactic.id);
        router.back();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить тактику');
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

  if (notFound || !tactic) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Тактика не найдена</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sideMeta = SIDE_META[tactic.side];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{tactic.title}</Text>
            <View style={styles.badges}>
              <View style={[styles.sideBadge, { backgroundColor: sideMeta.color }]}>
                <Text style={styles.sideBadgeText}>{sideMeta.label}</Text>
              </View>
              <Text style={styles.mapText}>🗺️ {tactic.map_name}</Text>
            </View>
          </View>
          {canManage ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => router.push(`${pathPrefix}/edit-tactic?groupId=${id}&tacticId=${tactic.id}` as any)}
                style={styles.headerActionBtn}
              >
                <Text style={styles.headerActionText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerActionBtn}>
                <Text style={styles.headerActionTextDelete}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {tactic.description ? (
          <Text style={styles.description}>{tactic.description}</Text>
        ) : null}

        <MapCanvas
          backgroundUrl={backgroundUrl}
          nades={tactic.nades}
          arrows={tactic.movement_arrows}
          onPinPress={setSelectedNade}
          emptyHint="Фон карты не загружен"
        />

        <Text style={styles.sectionTitle}>💣 Гранаты раунда ({tactic.nades.length})</Text>
        {tactic.nades.length === 0 ? (
          <Text style={styles.emptyText}>Гранаты не выбраны</Text>
        ) : (
          <View style={styles.grid}>
            {tactic.nades.map(n => (
              <NadeCard key={n.id} nade={n} onPress={() => setSelectedNade(n)} />
            ))}
          </View>
        )}
      </ScrollView>

      <NadeDetailModal
        visible={!!selectedNade}
        nade={selectedNade}
        onClose={() => setSelectedNade(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  errorText: { color: '#94A3B8', fontSize: 15, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: -0.4 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sideBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sideBadgeText: { color: '#0B0D14', fontSize: 11, fontWeight: '900' },
  mapText: { color: '#94A3B8', fontSize: 13 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerActionBtn: { padding: 8 },
  headerActionText: { color: '#f59e0b', fontSize: 18 },
  headerActionTextDelete: { color: '#748099', fontSize: 18 },
  description: { color: '#D6DEEB', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 12, letterSpacing: -0.3 },
  emptyText: { color: '#5B677D', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
});
