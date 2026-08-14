import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Nade, NadeCategory, NadeSide, NadeType } from '../../types';
import { nadesService } from '../../services/nadesService';
import { showAlert, showConfirm } from '../../utils/alert';
import { NadeCard } from './NadeCard';
import { NadeDetailModal } from './NadeDetailModal';
import { MapCanvas } from './MapCanvas';
import { CATEGORY_META, CATEGORY_ORDER, NADE_TYPE_META, NADE_TYPE_ORDER, SIDE_META } from './nadeMeta';

interface Props {
  groupId: number;
  mapName: string;
  canManage?: boolean;
  onEdit?: (nade: Nade) => void;
  onDelete?: (nade: Nade, reload: () => void) => void;
}

type ViewMode = 'list' | 'map';

export function NadesByMapView({ groupId, mapName, canManage, onEdit, onDelete }: Props) {
  const [nades, setNades] = useState<Nade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sideFilter, setSideFilter] = useState<NadeSide | null>(null);
  const [typeFilter, setTypeFilter] = useState<NadeType | null>(null);
  const [selected, setSelected] = useState<Nade | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const loadData = async () => {
    try {
      setNades(await nadesService.getNadesByMap(groupId, mapName));
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBackground = async () => {
    setBgLoading(true);
    try {
      const bg = await nadesService.getBackground(groupId, mapName);
      setBackgroundUrl(bg?.image_url ?? null);
    } catch {
      setBackgroundUrl(null);
    } finally {
      setBgLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadBackground();
    }, [groupId, mapName])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUploadBackground = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingBg(true);
    try {
      const bg = await nadesService.setBackground(groupId, mapName, result.assets[0].uri);
      setBackgroundUrl(bg.image_url);
    } catch {
      showAlert('Ошибка', 'Не удалось загрузить фон карты');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleRemoveBackground = () => {
    showConfirm('Удалить фон карты?', 'Маркеры раскидок останутся, но карта перестанет отображаться', async () => {
      try {
        await nadesService.deleteBackground(groupId, mapName);
        setBackgroundUrl(null);
      } catch {
        showAlert('Ошибка', 'Не удалось удалить фон');
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

  const filtered = nades.filter(n =>
    (!sideFilter || n.side === sideFilter) &&
    (!typeFilter || n.nade_type === typeFilter)
  );

  const byCategory = (cat: NadeCategory) => filtered.filter(n => n.category === cat);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        {/* Переключатель Список / Мини-карта */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'list' && styles.modeBtnTextActive]}>📋 Список</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'map' && styles.modeBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'map' && styles.modeBtnTextActive]}>🗺️ Мини-карта</Text>
          </TouchableOpacity>
        </View>

        {/* Фильтры: сторона */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, !sideFilter && styles.chipActive]}
            onPress={() => setSideFilter(null)}
          >
            <Text style={[styles.chipText, !sideFilter && styles.chipTextActive]}>Все</Text>
          </TouchableOpacity>
          {(Object.keys(SIDE_META) as NadeSide[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sideFilter === s && { borderColor: SIDE_META[s].color, backgroundColor: SIDE_META[s].color + '22' }]}
              onPress={() => setSideFilter(sideFilter === s ? null : s)}
            >
              <Text style={[styles.chipText, sideFilter === s && { color: SIDE_META[s].color }]}>
                {SIDE_META[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Фильтры: тип гранаты */}
        <View style={styles.filterRow}>
          {NADE_TYPE_ORDER.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, typeFilter === t && styles.chipActive]}
              onPress={() => setTypeFilter(typeFilter === t ? null : t)}
            >
              <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
                {NADE_TYPE_META[t].icon} {NADE_TYPE_META[t].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {viewMode === 'list' ? (
          filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Раскидок пока нет</Text>
              <Text style={styles.emptySubtext}>
                {nades.length > 0 ? 'Попробуй сбросить фильтры' : 'Тренер ещё не загрузил гранаты для этой карты'}
              </Text>
            </View>
          ) : (
            CATEGORY_ORDER.map(cat => {
              const items = byCategory(cat);
              if (items.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <View key={cat} style={styles.section}>
                  <View style={[styles.sectionHeader, { borderLeftColor: meta.color }]}>
                    <Text style={styles.sectionTitle}>{meta.icon} {meta.label}</Text>
                    <Text style={styles.sectionHint}>{meta.hint}</Text>
                  </View>
                  <View style={styles.grid}>
                    {items.map(n => (
                      <NadeCard
                        key={n.id}
                        nade={n}
                        onPress={() => setSelected(n)}
                        onEdit={onEdit ? () => onEdit(n) : undefined}
                        onDelete={onDelete ? () => onDelete(n, loadData) : undefined}
                      />
                    ))}
                  </View>
                </View>
              );
            })
          )
        ) : (
          <View>
            <MapCanvas
              backgroundUrl={backgroundUrl}
              loadingBackground={bgLoading}
              nades={filtered}
              onPinPress={setSelected}
              emptyHint={canManage ? 'Загрузи скриншот радара карты, чтобы расставлять точки бросков' : 'Тренер ещё не загрузил карту для этой раскидки'}
            />
            {filtered.filter(n => n.land_x == null).length > 0 ? (
              <Text style={styles.noPosHint}>
                {filtered.filter(n => n.land_x == null).length} раскидок без точки на карте — видны только в списке
              </Text>
            ) : null}
            {canManage ? (
              <View style={styles.bgActions}>
                <TouchableOpacity style={styles.bgBtn} onPress={handleUploadBackground} disabled={uploadingBg}>
                  {uploadingBg ? (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  ) : (
                    <Text style={styles.bgBtnText}>{backgroundUrl ? '🔄 Заменить фон карты' : '📷 Загрузить фон карты'}</Text>
                  )}
                </TouchableOpacity>
                {backgroundUrl ? (
                  <TouchableOpacity style={styles.bgBtnGhost} onPress={handleRemoveBackground}>
                    <Text style={styles.bgBtnGhostText}>Удалить</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <NadeDetailModal
        visible={!!selected}
        nade={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#242A40', backgroundColor: '#151827',
  },
  modeBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  modeBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  modeBtnTextActive: { color: '#f59e0b' },
  noPosHint: { color: '#5B677D', fontSize: 11, textAlign: 'center', marginTop: 8 },
  bgActions: { flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'center' },
  bgBtn: {
    borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(245,158,11,0.1)',
  },
  bgBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  bgBtnGhost: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  bgBtnGhostText: { color: '#748099', fontSize: 13, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#151827',
  },
  chipActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#f59e0b' },
  section: { marginTop: 18 },
  sectionHeader: {
    borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sectionHint: { color: '#748099', fontSize: 12, marginTop: 2, lineHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#5B677D', fontSize: 13, textAlign: 'center' },
});
