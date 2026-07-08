import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { showAlert } from '../../src/utils/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { materialsService } from '../../src/services/materialsService';

const TYPES = [
  { value: 'video', label: '🎥 Видео' },
  { value: 'document', label: '📄 Документ' },
  { value: 'link', label: '🔗 Ссылка' },
  { value: 'image', label: '🖼️ Изображение' },
];

export default function CreateMaterialScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('link');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Ошибка', 'Введи название материала');
      return;
    }

    setLoading(true);
    try {
      await materialsService.createMaterial({
        group_id: Number(groupId),
        title: title.trim(),
        description: description.trim() || undefined,
        external_url: url.trim() || undefined,
        type,
      });
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось добавить материал');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новый материал</Text>

        <TextInput
          style={styles.input}
          placeholder="Название материала"
          placeholderTextColor="#5B677D"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TextInput
          style={styles.input}
          placeholder="Ссылка (https://...)"
          placeholderTextColor="#5B677D"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Тип материала</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.typeBtnText, type === t.value && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Добавить материал</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#242A40', backgroundColor: '#151827',
  },
  typeBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  typeBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  typeBtnTextActive: { color: '#f59e0b' },
  button: {
    backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});