import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { nadesService } from '../../src/services/nadesService';
import { showAlert } from '../../src/utils/alert';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { CATEGORY_META, CATEGORY_ORDER, NADE_TYPE_META, NADE_TYPE_ORDER, SIDE_META } from '../../src/components/nades/nadeMeta';
import { NadeCategory, NadeSide, NadeType } from '../../src/types';

const MAX_IMAGES = 6;

export default function CreateNadeScreen() {
  const router = useRouter();
  const { map } = useLocalSearchParams<{ map?: string }>();

  const [mapName, setMapName] = useState(map ? decodeURIComponent(map) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<NadeSide>('T');
  const [category, setCategory] = useState<NadeCategory>('base');
  const [nadeType, setNadeType] = useState<NadeType>('smoke');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, MAX_IMAGES));
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
        map_name: mapName.trim(),
        side,
        category,
        nade_type: nadeType,
        title: title.trim(),
        description: description.trim() || undefined,
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
        <View style={styles.imagesRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemove}
                onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                disabled={loading}
              >
                <Text style={styles.imageRemoveText}>✕</Text>
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
        <Text style={styles.imagesHint}>Позиция → прицел → результат. Первый скрин — обложка карточки</Text>

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
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  imageWrap: { position: 'relative' },
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
  imagesHint: { color: '#5B677D', fontSize: 11, marginBottom: 20 },
  button: { marginTop: 8 },
});
