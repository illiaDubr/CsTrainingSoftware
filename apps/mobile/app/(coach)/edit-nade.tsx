import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { nadesService, nadeImageUrl } from '../../src/services/nadesService';
import { showAlert, showConfirm } from '../../src/utils/alert';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { MapCanvas } from '../../src/components/nades/MapCanvas';
import {
  CATEGORY_META, CATEGORY_ORDER, IMAGE_TYPE_META, IMAGE_TYPE_ORDER,
  NADE_TYPE_META, NADE_TYPE_ORDER, SIDE_META,
} from '../../src/components/nades/nadeMeta';
import { Nade, NadeCategory, NadeImage, NadeImageType, NadeSide, NadeType } from '../../src/types';

const MAX_IMAGES = 6;
const DEFAULT_TYPE_ORDER: NadeImageType[] = ['position', 'aim', 'result', 'other', 'other', 'other'];

interface NewImageItem { uri: string; type: NadeImageType }

export default function EditNadeScreen() {
  const router = useRouter();
  const { groupId, nadeId, map } = useLocalSearchParams<{ groupId: string; nadeId: string; map?: string }>();

  const [mapName, setMapName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [side, setSide] = useState<NadeSide>('T');
  const [category, setCategory] = useState<NadeCategory>('base');
  const [nadeType, setNadeType] = useState<NadeType>('smoke');
  const [existingImages, setExistingImages] = useState<NadeImage[]>([]);
  const [newImages, setNewImages] = useState<NewImageItem[]>([]);
  const [pickStep, setPickStep] = useState<'throw' | 'land'>('throw');
  const [throwPos, setThrowPos] = useState<{ x: number; y: number } | null>(null);
  const [landPos, setLandPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list: Nade[] = await nadesService.getNadesByMap(Number(groupId), decodeURIComponent(map || ''));
        const nade = list.find(n => n.id === Number(nadeId));
        if (!nade) {
          setNotFound(true);
          return;
        }
        setMapName(nade.map_name);
        setTitle(nade.title);
        setDescription(nade.description ?? '');
        setVideoUrl(nade.video_url ?? '');
        setSide(nade.side);
        setCategory(nade.category);
        setNadeType(nade.nade_type);
        setExistingImages(nade.images);
        if (nade.throw_x != null && nade.throw_y != null) setThrowPos({ x: nade.throw_x, y: nade.throw_y });
        if (nade.land_x != null && nade.land_y != null) setLandPos({ x: nade.land_x, y: nade.land_y });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nadeId, map]);

  const bgLoadedOnce = useRef(false);
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
          // Сбрасываем точки, только если фон реально сменился (не при первой загрузке экрана)
          if (bgLoadedOnce.current && next !== prev) {
            setThrowPos(null);
            setLandPos(null);
            setPickStep('throw');
          }
          bgLoadedOnce.current = true;
          return next;
        });
      })
      .catch(() => { if (!cancelled) setBackgroundUrl(null); })
      .finally(() => { if (!cancelled) setBgLoading(false); });
    return () => { cancelled = true; };
  }, [mapName, groupId]);

  const totalImages = existingImages.length + newImages.length;
  const isUploadedVideo = !!videoUrl && videoUrl.startsWith('/uploads/');

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - totalImages,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewImages(prev => {
        const added = result.assets.map((a, i) => ({
          uri: a.uri,
          type: DEFAULT_TYPE_ORDER[Math.min(existingImages.length + prev.length + i, DEFAULT_TYPE_ORDER.length - 1)],
        }));
        return [...prev, ...added].slice(0, MAX_IMAGES - existingImages.length);
      });
    }
  };

  const cycleNewImageType = (index: number) => {
    setNewImages(prev => prev.map((img, i) => {
      if (i !== index) return img;
      const currentIdx = IMAGE_TYPE_ORDER.indexOf(img.type);
      const next = IMAGE_TYPE_ORDER[(currentIdx + 1) % IMAGE_TYPE_ORDER.length];
      return { ...img, type: next };
    }));
  };

  const removeExistingImage = (image: NadeImage) => {
    showConfirm('Удалить скриншот?', undefined, async () => {
      try {
        await nadesService.deleteImage(image.id);
        setExistingImages(prev => prev.filter(i => i.id !== image.id));
      } catch {
        showAlert('Ошибка', 'Не удалось удалить скриншот');
      }
    });
  };

  const handleUploadBackground = async () => {
    if (!mapName.trim()) {
      showAlert('Сначала укажи карту', 'Введи название карты выше');
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

  const handlePick = (step: string, p: { x: number; y: number }) => {
    if (step === 'throw') {
      setThrowPos(p);
      if (!landPos) setPickStep('land');
    } else {
      setLandPos(p);
    }
  };

  const handleUploadVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingVideo(true);
    try {
      const updated = await nadesService.setVideo(Number(nadeId), result.assets[0].uri);
      setVideoUrl(updated.video_url ?? '');
    } catch {
      showAlert('Ошибка', 'Не удалось загрузить видео');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = () => {
    showConfirm('Удалить видео?', undefined, async () => {
      try {
        const updated = await nadesService.deleteVideo(Number(nadeId));
        setVideoUrl(updated.video_url ?? '');
      } catch {
        showAlert('Ошибка', 'Не удалось удалить видео');
      }
    });
  };

  const handleSave = async () => {
    if (!mapName.trim()) {
      showAlert('Ошибка', 'Укажи карту');
      return;
    }
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название раскидки');
      return;
    }

    setSaving(true);
    try {
      await nadesService.updateNade(Number(nadeId), {
        map_name: mapName.trim(),
        side,
        category,
        nade_type: nadeType,
        title: title.trim(),
        description: description.trim() || undefined,
        video_url: isUploadedVideo ? undefined : (videoUrl.trim() || null),
        throw_x: throwPos ? throwPos.x : null,
        throw_y: throwPos ? throwPos.y : null,
        land_x: landPos ? landPos.x : null,
        land_y: landPos ? landPos.y : null,
      });
      if (newImages.length > 0) {
        await nadesService.addImages(Number(nadeId), newImages);
      }
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить раскидку');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Раскидка не найдена</Text>
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

        <Text style={styles.title}>Редактировать раскидку</Text>

        <TextInput
          style={styles.input}
          placeholder="Карта"
          placeholderTextColor="#5B677D"
          value={mapName}
          onChangeText={setMapName}
          editable={!saving}
        />

        <TextInput
          style={styles.input}
          placeholder="Название"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!saving}
        />

        <Text style={styles.label}>Видео-гайд (необязательно)</Text>
        {isUploadedVideo ? (
          <View style={styles.videoChip}>
            <Text style={styles.videoChipText}>🎬 Видео-файл загружен</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <TouchableOpacity onPress={handleUploadVideo} disabled={saving || uploadingVideo}>
                <Text style={styles.videoChipAction}>{uploadingVideo ? '...' : 'Заменить'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteVideo} disabled={saving || uploadingVideo}>
                <Text style={styles.videoChipRemove}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Ссылка на видео (YouTube, клип...)"
              placeholderTextColor="#5B677D"
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!saving}
            />
            <TouchableOpacity style={styles.videoPickBtn} onPress={handleUploadVideo} disabled={saving || uploadingVideo}>
              <Text style={styles.videoPickBtnText}>{uploadingVideo ? 'Загрузка...' : '🎬 или загрузить видеофайл'}</Text>
            </TouchableOpacity>
          </>
        )}

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

        <Text style={styles.label}>Тип гранаты</Text>
        <View style={styles.row}>
          {NADE_TYPE_ORDER.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.optionBtn, nadeType === t && styles.optionBtnActive]}
              onPress={() => setNadeType(t)}
              disabled={saving}
            >
              <Text style={[styles.optionText, nadeType === t && styles.optionTextActive]}>
                {NADE_TYPE_META[t].icon} {NADE_TYPE_META[t].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Категория</Text>
        {CATEGORY_ORDER.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.catBtn, category === c && { borderColor: CATEGORY_META[c].color, backgroundColor: CATEGORY_META[c].color + '15' }]}
            onPress={() => setCategory(c)}
            disabled={saving}
          >
            <Text style={[styles.catTitle, category === c && { color: CATEGORY_META[c].color }]}>
              {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
            </Text>
            <Text style={styles.catHint}>{CATEGORY_META[c].hint}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Скриншоты ({totalImages}/{MAX_IMAGES})</Text>
        <Text style={styles.imagesHint}>Нажми на бейдж нового фото, чтобы поменять тип</Text>
        <View style={styles.imagesRow}>
          {existingImages.map((img) => (
            <View key={img.id} style={styles.imageWrap}>
              <Image source={{ uri: nadeImageUrl(img.image_url) }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemove}
                onPress={() => removeExistingImage(img)}
                disabled={saving}
              >
                <Text style={styles.imageRemoveText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.imageTypeBadge}>
                <Text style={styles.imageTypeBadgeText}>{IMAGE_TYPE_META[img.image_type]?.icon ?? '📷'} {IMAGE_TYPE_META[img.image_type]?.label ?? 'Скрин'}</Text>
              </View>
            </View>
          ))}
          {newImages.map((img, i) => (
            <View key={`new-${i}`} style={[styles.imageWrap, styles.imageWrapNew]}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemove}
                onPress={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                disabled={saving}
              >
                <Text style={styles.imageRemoveText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageTypeBadge} onPress={() => cycleNewImageType(i)} disabled={saving}>
                <Text style={styles.imageTypeBadgeText}>{IMAGE_TYPE_META[img.type].icon} {IMAGE_TYPE_META[img.type].label}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {totalImages < MAX_IMAGES ? (
            <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} disabled={saving}>
              <Text style={styles.addImageIcon}>📷</Text>
              <Text style={styles.addImageText}>Добавить</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Траектория броска на мини-карте (необязательно)</Text>
        {backgroundUrl ? (
          <View style={styles.stepRow}>
            <TouchableOpacity
              style={[styles.stepBtn, pickStep === 'throw' && styles.stepBtnActive]}
              onPress={() => setPickStep('throw')}
              disabled={saving}
            >
              <Text style={[styles.stepBtnText, pickStep === 'throw' && styles.stepBtnTextActive]}>
                🧍 Откуда кидают {throwPos ? '✓' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, pickStep === 'land' && styles.stepBtnActive]}
              onPress={() => setPickStep('land')}
              disabled={saving}
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
            <TouchableOpacity onPress={() => { setThrowPos(null); setLandPos(null); setPickStep('throw'); }} disabled={saving}>
              <Text style={styles.mapActionText}>Сбросить точки</Text>
            </TouchableOpacity>
          ) : <View />}
          <TouchableOpacity onPress={handleUploadBackground} disabled={saving || uploadingBg}>
            {uploadingBg ? (
              <ActivityIndicator size="small" color="#f59e0b" />
            ) : (
              <Text style={styles.mapActionText}>{backgroundUrl ? '🔄 Заменить фон карты' : '📷 Загрузить фон карты'}</Text>
            )}
          </TouchableOpacity>
        </View>

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
  imageWrapNew: { opacity: 0.85 },
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
  videoChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  videoChipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  videoChipAction: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  videoChipRemove: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  videoPickBtn: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 10, backgroundColor: '#151827',
    paddingVertical: 12, alignItems: 'center', marginBottom: 14,
  },
  videoPickBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
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
