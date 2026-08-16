import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tacticsService } from '../../src/services/tacticsService';
import { nadesService, nadeImageUrl } from '../../src/services/nadesService';
import { showAlert } from '../../src/utils/alert';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { MapCanvas } from '../../src/components/nades/MapCanvas';
import { NADE_TYPE_META, SIDE_META } from '../../src/components/nades/nadeMeta';
import { Nade, NadeMapSummary, NadeSide, TacticArrow, Tactic } from '../../src/types';

type Point = { x: number; y: number };
const ARROW_COLORS = ['#3B82F6', '#22C55E', '#A78BFA', '#F59E0B', '#EC4899'];

export default function EditTacticScreen() {
  const router = useRouter();
  const { groupId, tacticId } = useLocalSearchParams<{ groupId: string; tacticId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<NadeSide>('T');
  const [mapName, setMapName] = useState('');
  const [availableMaps, setAvailableMaps] = useState<NadeMapSummary[]>([]);
  const [mapsLoading, setMapsLoading] = useState(true);

  const [mapNades, setMapNades] = useState<Nade[]>([]);
  const [nadesLoading, setNadesLoading] = useState(false);
  const [selectedNadeIds, setSelectedNadeIds] = useState<number[]>([]);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);

  const [arrows, setArrows] = useState<TacticArrow[]>([]);
  const [addingArrow, setAddingArrow] = useState(false);
  const [arrowDraftFrom, setArrowDraftFrom] = useState<Point | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    nadesService.getMaps(Number(groupId))
      .then(setAvailableMaps)
      .catch(() => setAvailableMaps([]))
      .finally(() => setMapsLoading(false));
  }, [groupId]);

  useEffect(() => {
    const load = async () => {
      try {
        const t: Tactic = await tacticsService.getTacticById(Number(tacticId));
        setTitle(t.title);
        setDescription(t.description ?? '');
        setSide(t.side);
        setMapName(t.map_name);
        setSelectedNadeIds(t.nades.map(n => n.id));
        setArrows(t.movement_arrows || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    load();
  }, [tacticId]);

  // Подгружаем гранаты и фон карты при смене карты. При первой загрузке (из данных тактики)
  // выбор гранат/векторов не сбрасываем — только при ручной смене карты пользователем.
  useEffect(() => {
    if (!mapName || !groupId) {
      setMapNades([]);
      setBackgroundUrl(null);
      return;
    }
    let cancelled = false;
    setNadesLoading(true);
    setBgLoading(true);
    nadesService.getNadesByMap(Number(groupId), mapName)
      .then((list) => { if (!cancelled) setMapNades(list); })
      .catch(() => { if (!cancelled) setMapNades([]); })
      .finally(() => { if (!cancelled) setNadesLoading(false); });
    nadesService.getBackground(Number(groupId), mapName)
      .then((bg) => { if (!cancelled) setBackgroundUrl(bg?.image_url ?? null); })
      .catch(() => { if (!cancelled) setBackgroundUrl(null); })
      .finally(() => { if (!cancelled) setBgLoading(false); });
    return () => { cancelled = true; };
  }, [mapName, groupId]);

  const handleMapChange = (next: string) => {
    if (next === mapName) return;
    setMapName(next);
    setSelectedNadeIds([]);
    setArrows([]);
    setAddingArrow(false);
    setArrowDraftFrom(null);
  };

  const toggleNade = (nadeId: number) => {
    setSelectedNadeIds(prev => prev.includes(nadeId) ? prev.filter(id => id !== nadeId) : [...prev, nadeId]);
  };

  const handleArrowPick = (step: string, pos: Point) => {
    if (step === 'arrow-from') {
      setArrowDraftFrom(pos);
    } else if (step === 'arrow-to' && arrowDraftFrom) {
      const color = ARROW_COLORS[arrows.length % ARROW_COLORS.length];
      setArrows(prev => [...prev, { from: arrowDraftFrom, to: pos, color, label: '' }]);
      setArrowDraftFrom(null);
      setAddingArrow(false);
    }
  };

  const updateArrowLabel = (index: number, label: string) => {
    setArrows(prev => prev.map((a, i) => (i === index ? { ...a, label } : a)));
  };

  const removeArrow = (index: number) => {
    setArrows(prev => prev.filter((_, i) => i !== index));
  };

  const relevantNades = mapNades.filter(n => n.side === side);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название раунда');
      return;
    }
    if (!mapName) {
      showAlert('Ошибка', 'Выбери карту');
      return;
    }

    setSaving(true);
    try {
      await tacticsService.updateTactic(Number(tacticId), {
        title: title.trim(),
        map_name: mapName,
        side,
        description: description.trim(),
        movement_arrows: arrows,
        nade_ids: selectedNadeIds,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить тактику');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Тактика не найдена</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Редактировать тактику</Text>

        <TextInput
          style={styles.input}
          placeholder="Название раунда"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание раунда (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!saving}
        />

        <Text style={styles.label}>Сторона</Text>
        <View style={styles.row}>
          {(Object.keys(SIDE_META) as NadeSide[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionBtn, side === s && { borderColor: SIDE_META[s].color, backgroundColor: SIDE_META[s].color + '22' }]}
              onPress={() => setSide(s)}
              disabled={saving}
            >
              <Text style={[styles.optionText, side === s && { color: SIDE_META[s].color }]}>{SIDE_META[s].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Карта</Text>
        {mapsLoading ? (
          <ActivityIndicator color="#f59e0b" style={{ marginBottom: 16 }} />
        ) : (
          <View style={styles.row}>
            {availableMaps.map(m => (
              <TouchableOpacity
                key={m.map_name}
                style={[styles.optionBtn, mapName === m.map_name && styles.optionBtnActive]}
                onPress={() => handleMapChange(m.map_name)}
                disabled={saving}
              >
                <Text style={[styles.optionText, mapName === m.map_name && styles.optionTextActive]}>
                  🗺️ {m.map_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {mapName ? (
          <>
            <Text style={styles.label}>Гранаты для этого раунда</Text>
            {nadesLoading ? (
              <ActivityIndicator color="#f59e0b" style={{ marginBottom: 16 }} />
            ) : relevantNades.length === 0 ? (
              <Text style={styles.hintText}>Нет раскидок для стороны {SIDE_META[side].label} на этой карте</Text>
            ) : (
              <View style={styles.nadesList}>
                {relevantNades.map(n => {
                  const selected = selectedNadeIds.includes(n.id);
                  const typeMeta = NADE_TYPE_META[n.nade_type];
                  const preview = n.images[0];
                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.nadeItem, selected && styles.nadeItemSelected]}
                      onPress={() => toggleNade(n.id)}
                      disabled={saving}
                    >
                      {preview ? (
                        <Image source={{ uri: nadeImageUrl(preview.image_url) }} style={styles.nadeThumb} />
                      ) : (
                        <View style={[styles.nadeThumb, styles.nadeThumbPlaceholder]}>
                          <Text>{typeMeta.icon}</Text>
                        </View>
                      )}
                      <Text style={styles.nadeItemTitle} numberOfLines={2}>{typeMeta.icon} {n.title}</Text>
                      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                        {selected ? <Text style={styles.checkboxText}>✓</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>Векторы движения на мини-карте</Text>
            <MapCanvas
              backgroundUrl={backgroundUrl}
              loadingBackground={bgLoading}
              arrows={arrows}
              pickStep={addingArrow ? (arrowDraftFrom ? 'arrow-to' : 'arrow-from') : null}
              landPos={arrowDraftFrom}
              pickHint={addingArrow ? (arrowDraftFrom ? 'Нажми на карту — куда движемся' : 'Нажми на карту — откуда начинаем') : undefined}
              onPick={handleArrowPick}
              emptyHint="Для этой карты ещё нет фона — загрузи его в разделе «Раскидки»"
            />
            {arrows.length > 0 ? (
              <View style={styles.arrowsList}>
                {arrows.map((a, i) => (
                  <View key={i} style={styles.arrowRow}>
                    <View style={[styles.arrowColorDot, { backgroundColor: a.color }]} />
                    <TextInput
                      style={styles.arrowLabelInput}
                      placeholder={`Вектор ${i + 1} (например: AWPer, entry)`}
                      placeholderTextColor="#5B677D"
                      value={a.label}
                      onChangeText={(v) => updateArrowLabel(i, v)}
                      editable={!saving}
                    />
                    <TouchableOpacity onPress={() => removeArrow(i)} disabled={saving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.arrowRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            {backgroundUrl ? (
              <TouchableOpacity
                style={styles.addArrowBtn}
                onPress={() => { setAddingArrow(true); setArrowDraftFrom(null); }}
                disabled={saving || addingArrow}
              >
                <Text style={styles.addArrowBtnText}>{addingArrow ? 'Ставь точки на карте…' : '+ Добавить вектор движения'}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        <GradientButton
          title="Сохранить"
          onPress={handleSave}
          loading={saving}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  errorText: { color: '#94A3B8', fontSize: 15, marginBottom: 16 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },
  hintText: { color: '#5B677D', fontSize: 12, marginBottom: 16, lineHeight: 17 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
    borderColor: '#242A40', backgroundColor: '#151827',
  },
  optionBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  optionText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: '#f59e0b' },
  nadesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  nadeItem: {
    width: 104, borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    backgroundColor: '#151827', padding: 6, position: 'relative',
  },
  nadeItemSelected: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  nadeThumb: { width: '100%', height: 56, borderRadius: 6, backgroundColor: '#10131E', marginBottom: 4 },
  nadeThumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  nadeItemTitle: { color: '#F8FAFC', fontSize: 10, fontWeight: '600', lineHeight: 13 },
  checkbox: {
    position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#5B677D', backgroundColor: 'rgba(11,13,20,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { borderColor: '#f59e0b', backgroundColor: '#f59e0b' },
  checkboxText: { color: '#0B0D14', fontSize: 10, fontWeight: '900' },
  arrowsList: { marginTop: 12, gap: 8 },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowColorDot: { width: 10, height: 10, borderRadius: 5 },
  arrowLabelInput: {
    flex: 1, backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, color: '#F8FAFC', fontSize: 12,
  },
  arrowRemove: { color: '#748099', fontSize: 14, paddingHorizontal: 4 },
  addArrowBtn: {
    marginTop: 12, marginBottom: 24, borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    backgroundColor: '#151827', paddingVertical: 12, alignItems: 'center',
  },
  addArrowBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  button: { marginTop: 8 },
});
