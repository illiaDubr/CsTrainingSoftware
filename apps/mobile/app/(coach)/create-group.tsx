import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { showAlert } from '../../src/utils/alert';
import { useRouter } from 'expo-router';
import { groupsService } from '../../src/services/groupsService';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert('Ошибка', 'Введи название группы');
      return;
    }

    setLoading(true);
    try {
      await groupsService.createGroup(name.trim(), description.trim() || undefined);
      router.back();
    } catch {
      showAlert('Ошибка', 'Не удалось создать группу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новая группа</Text>

        <TextInput
          style={styles.input}
          placeholder="Название группы"
          placeholderTextColor="#5B677D"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#5B677D"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Создать группу</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  input: {
    backgroundColor: '#151827',
    borderWidth: 1,
    borderColor: '#242A40',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
    marginBottom: 14,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});