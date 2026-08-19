import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminUserDetail, AdminRole } from '../../../src/types';
import { PLAYER_ROLES } from '../../../src/constants';
import { showAlert, showConfirm } from '../../../src/utils/alert';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { colors, radius, shadows } from '../../../src/theme';

const ROLE_META: Record<AdminRole, { label: string; icon: string; color: string }> = {
  admin: { label: 'Админ', icon: '🛡️', color: '#A78BFA' },
  coach: { label: 'Тренер', icon: '🎯', color: colors.primary },
  player: { label: 'Игрок', icon: '🎮', color: colors.info },
};

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [inGameRole, setInGameRole] = useState<string>('');
  const [bio, setBio] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const load = async () => {
    try {
      const u = await adminService.getUserDetail(Number(userId));
      setUser(u);
      setUsername(u.username);
      setFullName(u.full_name ?? '');
      setInGameRole(u.in_game_role ?? '');
      setBio(u.bio ?? '');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [userId]));

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      showAlert('Ошибка', 'Ник не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      const updated = await adminService.updateUser(user.id, {
        username: username.trim(),
        full_name: fullName.trim() || null,
        in_game_role: inGameRole || null,
        bio: bio.trim() || null,
      });
      setUser({ ...user, ...updated });
      showAlert('Готово', 'Профиль обновлён');
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (role: AdminRole) => {
    if (!user || role === user.role) return;
    showConfirm(
      'Сменить роль?',
      `${user.username}: ${ROLE_META[user.role].label} → ${ROLE_META[role].label}`,
      async () => {
        try {
          const updated = await adminService.updateUser(user.id, { role });
          setUser({ ...user, ...updated });
        } catch {
          showAlert('Ошибка', 'Не удалось сменить роль');
        }
      },
      'Сменить'
    );
  };

  const handleToggleBan = () => {
    if (!user) return;
    const willBan = user.is_active;
    showConfirm(
      willBan ? 'Забанить пользователя?' : 'Разбанить пользователя?',
      user.username,
      async () => {
        try {
          const updated = await adminService.updateUser(user.id, { is_active: !willBan });
          setUser({ ...user, ...updated });
        } catch {
          showAlert('Ошибка', 'Не удалось изменить статус');
        }
      },
      willBan ? 'Забанить' : 'Разбанить'
    );
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (newPassword.length < 6) {
      showAlert('Ошибка', 'Пароль должен быть не короче 6 символов');
      return;
    }
    setResettingPassword(true);
    try {
      await adminService.updateUser(user.id, { password: newPassword });
      setNewPassword('');
      setShowPasswordForm(false);
      showAlert('Готово', 'Пароль изменён');
    } catch {
      showAlert('Ошибка', 'Не удалось сбросить пароль');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notFound || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Пользователь не найден</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = ROLE_META[user.role];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={styles.avatarBig}><Text style={styles.avatarBigText}>{user.username?.[0]?.toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{user.username}</Text>
          <Text style={styles.emailText}>{user.email}</Text>
          <View style={styles.badges}>
            <View style={[styles.roleBadge, { borderColor: meta.color }]}>
              <Text style={[styles.roleBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
            </View>
            {!user.is_active ? <Text style={styles.bannedBadge}>забанен</Text> : null}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Роль</Text>
      <View style={styles.row}>
        {(Object.keys(ROLE_META) as AdminRole[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.optionBtn, user.role === r && { borderColor: ROLE_META[r].color, backgroundColor: ROLE_META[r].color + '22' }]}
            onPress={() => handleRoleChange(r)}
          >
            <Text style={[styles.optionText, user.role === r && { color: ROLE_META[r].color }]}>
              {ROLE_META[r].icon} {ROLE_META[r].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Профиль</Text>
      <TextInput style={styles.input} placeholder="Ник" placeholderTextColor={colors.textFaint} value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Полное имя" placeholderTextColor={colors.textFaint} value={fullName} onChangeText={setFullName} />
      <View style={styles.row}>
        {PLAYER_ROLES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.optionBtn, inGameRole === r.value && styles.optionBtnActive]}
            onPress={() => setInGameRole(inGameRole === r.value ? '' : r.value)}
          >
            <Text style={[styles.optionText, inGameRole === r.value && styles.optionTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="О себе"
        placeholderTextColor={colors.textFaint}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
      />
      <GradientButton title="Сохранить" onPress={handleSave} loading={saving} style={styles.saveBtn} />

      <Text style={styles.sectionTitle}>Доступ</Text>
      <View style={styles.actionsRow}>
        <GradientButton
          title={user.is_active ? '🚫 Забанить' : '✅ Разбанить'}
          onPress={handleToggleBan}
          variant={user.is_active ? 'danger' : 'primary'}
          style={{ flex: 1 }}
        />
        <GradientButton
          title="🔑 Сбросить пароль"
          onPress={() => setShowPasswordForm((v) => !v)}
          variant="ghost"
          style={{ flex: 1 }}
        />
      </View>
      {showPasswordForm ? (
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.input}
            placeholder="Новый пароль (мин. 6 символов)"
            placeholderTextColor={colors.textFaint}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <GradientButton title="Установить пароль" onPress={handleResetPassword} loading={resettingPassword} />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Активность</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{user.contentCounts.nades}</Text><Text style={styles.statChipLabel}>раскидок</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{user.contentCounts.tactics}</Text><Text style={styles.statChipLabel}>тактик</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{user.contentCounts.materials}</Text><Text style={styles.statChipLabel}>материалов</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{user.contentCounts.trainings}</Text><Text style={styles.statChipLabel}>тренировок</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{user.contentCounts.matches}</Text><Text style={styles.statChipLabel}>матчей</Text></View>
      </View>

      {user.coaches.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Тренирует группы</Text>
          <View style={styles.listCard}>
            {user.coaches.map((g) => (
              <TouchableOpacity key={g.id} style={styles.groupRow} onPress={() => router.push(`/(admin)/groups/${g.id}` as any)}>
                <Text style={styles.groupRowText}>👥 {g.name}</Text>
                <Text style={styles.chevronText}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {user.memberOf.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Состоит в группах</Text>
          <View style={styles.listCard}>
            {user.memberOf.map((g) => (
              <TouchableOpacity key={g.id} style={styles.groupRow} onPress={() => router.push(`/(admin)/groups/${g.id}` as any)}>
                <Text style={styles.groupRowText}>👥 {g.name}{g.is_assistant_coach ? ' (помощник тренера)' : ''}</Text>
                <Text style={styles.chevronText}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 700, alignSelf: 'center' },
  back: { color: colors.primary, fontSize: 15, marginBottom: 16 },
  errorText: { color: colors.textSecondary, fontSize: 15, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  avatarBig: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent,
  },
  avatarBigText: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  emailText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  bannedBadge: {
    color: colors.danger, fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: colors.danger,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 22, marginBottom: 10, letterSpacing: -0.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: colors.primary },
  input: {
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 10,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  passwordBox: {
    marginTop: 12, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 10,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 90, ...shadows.subtle,
  },
  statChipValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statChipLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.subtle,
  },
  groupRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  groupRowText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chevronText: { color: colors.textFaint, fontSize: 16 },
});
