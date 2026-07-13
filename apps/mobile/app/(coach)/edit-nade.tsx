import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { nadesService, nadeImageUrl } from '../../src/services/nadesService';
import { showAlert, showConfirm } from '../../src/utils/alert';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { CATEGORY_META, CATEGORY_ORDER, NADE_TYPE_META, NADE_TYPE_ORDER, SIDE_META } from '../../src/components/nades/nadeMeta';
import { Nade, NadeCategory, NadeImage, NadeSide, NadeType } from '../../src/types';

const MAX_IMAGES = 6;

export default function EditNadeScreen() {
  const router = useRouter();
  const { nadeId, map } = useLocalSearchParams<{ nadeId: string; map?: string }>();

  const [mapName, setMapName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<NadeSide>('T');
  const [category, setCategory] = useState<NadeCategory>('base');
  const [nadeType, setNadeType] = useState<NadeType>('smoke');
  const [existingImages, setExistingImages] = useState<NadeImage[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list: Nade[] = await nadesService.getNadesByMap(decodeURIComponent(map || ''));
        const nade = list.find(n => n.id === Number(nadeId));
        if (!nade) {
          setNotFound(true);
          return;
        }
        setMapName(nade.map_name);
        setTitle(nade.title);
        setDescription(nade.description ?? '');
        setSide(nade.side);
        setCategory(nade.category);
        setNadeType(nade.nade_type);
        setExistingImages(nade.images);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nadeId, map]);

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - totalImages,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setNewImages(prev => [...prev, ...uris].slice(0, MAX_IMAGES - existingImages.length));
    }
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
            </View>
          ))}
          {newImages.map((uri, i) => (
            <View key={`new-${i}`} style={[styles.imageWrap, styles.imageWrapNew]}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemove}
                onPress={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                disabled={saving}
              >
                <Text style={styles.imageRemoveText}>✕</Text>
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
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  imageWrap: { position: 'relative' },
  imageWrapNew: { opacity: 0.85 },
  imagePreview: { width: 96, height: 60, borderRadius: 8, backgroundColor: '#10131E' },
  imageRemove: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addImageBtn: {
    width: 96, height: 60, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#3A4358', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10131E',
  },
  addImageIcon: { fontSize: 16 },
  addImageText: { color: '#748099', fontSize: 10, marginTop: 2 },
  button: { marginTop: 8 },
});
