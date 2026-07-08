import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { materialsService } from '../../src/services/materialsService';
import { Material } from '../../src/types';
import { showAlert } from '../../src/utils/alert';

const TYPES = [
  { value: 'video', label: '🎥 Видео' },
  { value: 'document', label: '📄 Документ' },
  { value: 'link', label: '🔗 Ссылка' },
  { value: 'image', label: '🖼️ Изображение' },
];

export default function EditMaterialScreen() {
  const router = useRouter();
  const { groupId, materialId } = useLocalSearchParams<{ groupId: string; materialId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('link');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list: Material[] = await materialsService.getMaterialsByGroup(Number(groupId));
        const material = list.find((m) => m.id === Number(materialId));
        if (!material) {
          setNotFound(true);
          return;
        }
        setTitle(material.title);
        setDescription(material.description ?? '');
        setUrl(material.external_url ?? '');
        setType(material.type);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, materialId]);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название материала');
      return;
    }
    setSaving(true);
    try {
      await materialsService.updateMaterial(Number(materialId), {
        title: title.trim(),
        description: description.trim() || undefined,
        external_url: url.trim() || undefined,
        type,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить материал');
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
        <Text style={styles.errorText}>Материал не найден</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Редактировать материал</Text>

        <TextInput
          style={styles.input}
          placeholder="Название материала"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!saving}
        />

        <TextInput
          style={styles.input}
          placeholder="Ссылка (https://...)"
          placeholderTextColor="#555"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          editable={!saving}
        />

        <Text style={styles.label}>Тип материала</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
              onPress={() => setType(t.value)}
              disabled={saving}
            >
              <Text style={[styles.typeBtnText, type === t.value && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Сохранить</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 28 },
  errorText: { color: '#888', fontSize: 15, marginBottom: 16 },
  input: {
    backgroundColor: '#1a1d2e', borderWidth: 1, borderColor: '#2a2d3e', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: '#888', fontSize: 13, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#2a2d3e', backgroundColor: '#1a1d2e',
  },
  typeBtnActive: { borderColor: '#f59e0b', backgroundColor: '#2a1f00' },
  typeBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  typeBtnTextActive: { color: '#f59e0b' },
  button: { backgroundColor: '#f59e0b', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
