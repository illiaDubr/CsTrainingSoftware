import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { nadesService } from '../../src/services/nadesService';
import { showAlert } from '../../src/utils/alert';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { MapCanvas } from '../../src/components/nades/MapCanvas';
import {
  CATEGORY_META, CATEGORY_ORDER, IMAGE_TYPE_META, IMAGE_TYPE_ORDER,
  NADE_TYPE_META, NADE_TYPE_ORDER, SIDE_META,
} from '../../src/components/nades/nadeMeta';
import { NadeCategory, NadeImageType, NadeSide, NadeType } from '../../src/types';

const MAX_IMAGES = 6;
const DEFAULT_TYPE_ORDER: NadeImageType[] = ['position', 'aim', 'result', 'other', 'other', 'other'];

interface ImageItem { uri: string; type: NadeImageType }

export default function CreateNadeScreen() {
  const router = useRouter();
  const { groupId, map } = useLocalSearchParams<{ groupId: string; map?: string }>();

  const [mapName, setMapName] = useState(map ? decodeURIComponent(map) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoMode, setVideoMode] = useState<'link' | 'file'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [side, setSide] = useState<NadeSide>('T');
  const [category, setCategory] = useState<NadeCategory>('base');
  const [nadeType, setNadeType] = useState<NadeType>('smoke');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pickStep, setPickStep] = useState<'throw' | 'land'>('throw');
  const [throwPos, setThrowPos] = useState<{ x: number; y: number } | null>(null);
  const [landPos, setLandPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    const trimmed = mapName.trim();
    if (!trimmed || !groupId) {
      setBackgroundUrl(null);
      return;
    }
    let cancelled = false;
    setBgLoading(true);
    nadesService.getBackground(Number(groupId), trimmed)
      .then((bg) => {
        if (cancelled) return;
        setBackgroundUrl((prev) => {
          const next = bg?.image_url ?? null;
          // Карта реально сменилась — старые точки броска относились к другому фону, сбрасываем
          if (prev !== null && next !== prev) {
            setThrowPos(null);
            setLandPos(null);
            setPickStep('throw');
          }
          return next;
        });
      })
      .catch(() => { if (!cancelled) setBackgroundUrl(null); })
      .finally(() => { if (!cancelled) setBgLoading(false); });
    return () => { cancelled = true; };
  }, [mapName, groupId]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => {
        const added = result.assets.map((a, i) => ({
          uri: a.uri,
          type: DEFAULT_TYPE_ORDER[Math.min(prev.length + i, DEFAULT_TYPE_ORDER.length - 1)],
        }));
        return [...prev, ...added].slice(0, MAX_IMAGES);
      });
    }
  };

  const cycleImageType = (index: number) => {
    setImages(prev => prev.map((img, i) => {
      if (i !== index) return img;
      const currentIdx = IMAGE_TYPE_ORDER.indexOf(img.type);
      const next = IMAGE_TYPE_ORDER[(currentIdx + 1) % IMAGE_TYPE_ORDER.length];
      return { ...img, type: next };
    }));
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setVideoUri(asset.uri);
    setVideoName(asset.fileName || asset.uri.split('/').pop() || 'video.mp4');
  };

  const handlePick = (step: 'throw' | 'land', p: { x: number; y: number }) => {
    if (step === 'throw') {
      setThrowPos(p);
      if (!landPos) setPickStep('land');
    } else {
      setLandPos(p);
    }
  };

  const handleUploadBackground = async () => {
    if (!mapName.trim()) {
      showAlert('Сначала укажи карту', 'Введи название карты выше, потом можно будет загрузить радар');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingBg(true);
    try {
      const bg = await nadesService.setBackground(Number(groupId), mapName.trim(), result.assets[0].uri);
      setBackgroundUrl(bg.image_url);
    } catch {
      showAlert('Ошибка', 'Не удалось загрузить фон карты');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleCreate = async () => {
    if (!mapName.trim()) {
      showAlert('Ошибка', 'Укажи карту');
      return;
    }
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название раскидки');
      return;
    }
    if (images.length === 0) {
      showAlert('Ошибка', 'Добавь хотя бы один скриншот');
      return;
    }

    setLoading(true);
    try {
      await nadesService.createNade({
        group_id: Number(groupId),
        map_name: mapName.trim(),
        side,
        category,
        nade_type: nadeType,
        title: title.trim(),
        description: description.trim() || undefined,
        video_url: videoMode === 'link' ? (videoUrl.trim() || undefined) : undefined,
        videoUri: videoMode === 'file' ? (videoUri || undefined) : undefined,
        throw_x: throwPos?.x,
        throw_y: throwPos?.y,
        land_x: landPos?.x,
        land_y: landPos?.y,
      }, images);
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось загрузить раскидку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новая раскидка</Text>

        <TextInput
          style={styles.input}
          placeholder="Карта (Mirage, Inferno...)"
          placeholderTextColor="#5B677D"
          value={mapName}
          onChangeText={setMapName}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Название (например: Смоук на окно с Т-рампы)"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание: позиция, прицел, тайминг... (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <Text style={styles.label}>Видео-гайд (необязательно)</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.optionBtn, videoMode === 'link' && styles.optionBtnActive]}
            onPress={() => setVideoMode('link')}
            disabled={loading}
          >
            <Text style={[styles.optionText, videoMode === 'link' && styles.optionTextActive]}>🔗 Ссылка</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionBtn, videoMode === 'file' && styles.optionBtnActive]}
            onPress={() => setVideoMode('file')}
            disabled={loading}
          >
            <Text style={[styles.optionText, videoMode === 'file' && styles.optionTextActive]}>🎬 Загрузить файл</Text>
          </TouchableOpacity>
        </View>
        {videoMode === 'link' ? (
          <TextInput
            style={styles.input}
            placeholder="Ссылка на видео (YouTube, клип...)"
            placeholderTextColor="#5B677D"
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={!loading}
          />
        ) : (
          <View style={styles.videoFileRow}>
            <TouchableOpacity style={styles.videoPickBtn} onPress={pickVideo} disabled={loading}>
              <Text style={styles.videoPickBtnText}>{videoUri ? '🔄 Заменить видео' : '📹 Выбрать видео из галереи'}</Text>
            </TouchableOpacity>
            {videoUri ? (
              <View style={styles.videoChip}>
                <Text style={styles.videoChipText} numberOfLines={1}>🎬 {videoName}</Text>
                <TouchableOpacity onPress={() => { setVideoUri(null); setVideoName(''); }} disabled={loading}>
                  <Text style={styles.videoChipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Сторона */}
        <Text style={styles.label}>Сторона</Text>
        <View style={styles.row}>
          {(Object.keys(SIDE_META) as NadeSide[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionBtn, side === s && { borderColor: SIDE_META[s].color, backgroundColor: SIDE_META[s].color + '22' }]}
              onPress={() => setSide(s)}
              disabled={loading}
            >
              <Text style={[styles.optionText, side === s && { color: SIDE_META[s].color }]}>{SIDE_META[s].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Тип гранаты */}
        <Text style={styles.label}>Тип гранаты</Text>
        <View style={styles.row}>
          {NADE_TYPE_ORDER.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.optionBtn, nadeType === t && styles.optionBtnActive]}
              onPress={() => setNadeType(t)}
              disabled={loading}
            >
              <Text style={[styles.optionText, nadeType === t && styles.optionTextActive]}>
                {NADE_TYPE_META[t].icon} {NADE_TYPE_META[t].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Категория */}
        <Text style={styles.label}>Категория</Text>
        {CATEGORY_ORDER.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.catBtn, category === c && { borderColor: CATEGORY_META[c].color, backgroundColor: CATEGORY_META[c].color + '15' }]}
            onPress={() => setCategory(c)}
            disabled={loading}
          >
            <Text style={[styles.catTitle, category === c && { color: CATEGORY_META[c].color }]}>
              {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
            </Text>
            <Text style={styles.catHint}>{CATEGORY_META[c].hint}</Text>
          </TouchableOpacity>
        ))}

        {/* Скриншоты */}
        <Text style={styles.label}>Скриншоты ({images.length}/{MAX_IMAGES})</Text>
        <Text style={styles.imagesHint}>Нажми на бейдж под фото, чтобы поменять тип: позиция → прицел → результат → другое</Text>
        <View style={styles.imagesRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageWrap}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemove}
                onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                disabled={loading}
              >
                <Text style={styles.imageRemoveText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageTypeBadge} onPress={() => cycleImageType(i)} disabled={loading}>
                <Text style={styles.imageTypeBadgeText}>{IMAGE_TYPE_META[img.type].icon} {IMAGE_TYPE_META[img.type].label}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES ? (
            <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} disabled={loading}>
              <Text style={styles.addImageIcon}>📷</Text>
              <Text style={styles.addImageText}>Добавить</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Точки на мини-карте: откуда кидают → куда прилетает */}
        <Text style={styles.label}>Траектория броска на мини-карте (необязательно)</Text>
        {backgroundUrl ? (
          <View style={styles.stepRow}>
            <TouchableOpacity
              style={[styles.stepBtn, pickStep === 'throw' && styles.stepBtnActive]}
              onPress={() => setPickStep('throw')}
              disabled={loading}
            >
              <Text style={[styles.stepBtnText, pickStep === 'throw' && styles.stepBtnTextActive]}>
                🧍 Откуда кидают {throwPos ? '✓' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, pickStep === 'land' && styles.stepBtnActive]}
              onPress={() => setPickStep('land')}
              disabled={loading}
            >
              <Text style={[styles.stepBtnText, pickStep === 'land' && styles.stepBtnTextActive]}>
                💨 Куда прилетает {landPos ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <MapCanvas
          backgroundUrl={backgroundUrl}
          loadingBackground={bgLoading}
          pickStep={backgroundUrl ? pickStep : null}
          throwPos={throwPos}
          landPos={landPos}
          onPick={handlePick}
          emptyHint={mapName.trim() ? 'Для этой карты ещё нет загруженного фона (радара)' : 'Сначала укажи карту выше'}
        />
        <View style={styles.mapActionsRow}>
          {throwPos || landPos ? (
            <TouchableOpacity onPress={() => { setThrowPos(null); setLandPos(null); setPickStep('throw'); }} disabled={loading}>
              <Text style={styles.mapActionText}>Сбросить точки</Text>
            </TouchableOpacity>
          ) : <View />}
          <TouchableOpacity onPress={handleUploadBackground} disabled={loading || uploadingBg}>
            {uploadingBg ? (
              <ActivityIndicator size="small" color="#f59e0b" />
            ) : (
              <Text style={styles.mapActionText}>{backgroundUrl ? '🔄 Заменить фон карты' : '📷 Загрузить фон карты'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <GradientButton
          title="Загрузить раскидку"
          onPress={handleCreate}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
    borderColor: '#242A40', backgroundColor: '#151827',
  },
  optionBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  optionText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: '#f59e0b' },
  catBtn: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 12,
    padding: 14, marginBottom: 10, backgroundColor: '#151827',
  },
  catTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  catHint: { color: '#748099', fontSize: 12, lineHeight: 16 },
  imagesHint: { color: '#5B677D', fontSize: 11, marginBottom: 10 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  imageWrap: { position: 'relative' },
  imagePreview: { width: 104, height: 66, borderRadius: 8, backgroundColor: '#10131E' },
  imageRemove: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageTypeBadge: {
    position: 'absolute', bottom: 3, left: 3, right: 3,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 5, paddingVertical: 2, alignItems: 'center',
  },
  imageTypeBadgeText: { color: '#f59e0b', fontSize: 9, fontWeight: '700' },
  addImageBtn: {
    width: 104, height: 66, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#3A4358', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10131E',
  },
  addImageIcon: { fontSize: 16 },
  addImageText: { color: '#748099', fontSize: 10, marginTop: 2 },
  mapActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 24 },
  mapActionText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  videoFileRow: { marginBottom: 14 },
  videoPickBtn: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 10, backgroundColor: '#151827',
    paddingVertical: 12, alignItems: 'center',
  },
  videoPickBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  videoChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8,
  },
  videoChipText: { color: '#F8FAFC', fontSize: 12, flex: 1, marginRight: 8 },
  videoChipRemove: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stepBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#242A40', backgroundColor: '#151827',
  },
  stepBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  stepBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  stepBtnTextActive: { color: '#f59e0b' },
  button: { marginTop: 8 },
});
