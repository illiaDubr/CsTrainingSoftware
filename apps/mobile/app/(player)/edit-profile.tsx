import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { updateProfile } from '../../src/store/slices/authSlice';
import { usersService } from '../../src/services/usersService';
import { PLAYER_ROLES } from '../../src/constants';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [username, setUsername] = useState(user?.username ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [inGameRole, setInGameRole] = useState<string | null>(user?.in_game_role ?? null);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedName = username.trim();
    if (trimmedName.length < 2) {
      setError('Имя должно быть не короче 2 символов');
      return;
    }
    if (bio.length > 500) {
      setError('Описание — максимум 500 символов');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const updated = await usersService.updateMe({
        username: trimmedName,
        full_name: fullName.trim() || null,
        in_game_role: inGameRole,
        bio: bio.trim() || null,
      });
      dispatch(updateProfile(updated));
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Редактировать профиль</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Ник</Text>
        <TextInput
          style={styles.input}
          placeholder="Твой ник"
          placeholderTextColor="#5B677D"
          value={username}
          onChangeText={(v) => { setUsername(v); if (error) setError(null); }}
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.label}>Имя (необязательно)</Text>
        <TextInput
          style={styles.input}
          placeholder="Как тебя зовут"
          placeholderTextColor="#5B677D"
          value={fullName}
          onChangeText={(v) => { setFullName(v); if (error) setError(null); }}
          editable={!saving}
        />

        <Text style={styles.label}>Роль на карте</Text>
        <View style={styles.roleGrid}>
          {PLAYER_ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleBtn, inGameRole === r.value && styles.roleBtnActive]}
              onPress={() => setInGameRole(inGameRole === r.value ? null : r.value)}
              disabled={saving}
            >
              <Text style={[styles.roleBtnText, inGameRole === r.value && styles.roleBtnTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>Повторное нажатие снимает выбор</Text>

        <Text style={styles.label}>О себе</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Коротко расскажи о себе: стиль игры, любимые карты, опыт..."
          placeholderTextColor="#5B677D"
          value={bio}
          onChangeText={(v) => { setBio(v); if (error) setError(null); }}
          multiline
          numberOfLines={4}
          maxLength={500}
          editable={!saving}
        />
        <Text style={styles.counter}>{bio.length}/500</Text>

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
  container: { flex: 1, backgroundColor: '#0B0D14' },
  inner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  errorBox: {
    backgroundColor: '#2a1215', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  input: {
    backgroundColor: '#151827', borderWidth: 1, borderColor: '#242A40', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: '#F8FAFC', fontSize: 15, marginBottom: 20,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top', marginBottom: 6 },
  counter: { color: '#5B677D', fontSize: 11, textAlign: 'right', marginBottom: 20 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  roleBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#242A40', backgroundColor: '#151827',
  },
  roleBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.14)' },
  roleBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  roleBtnTextActive: { color: '#f59e0b' },
  hint: { color: '#5B677D', fontSize: 11, marginBottom: 20 },
  button: {
    backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
