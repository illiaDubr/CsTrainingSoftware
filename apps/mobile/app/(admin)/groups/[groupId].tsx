import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { adminService } from '../../../src/services/adminService';
import { AdminGroupDetail } from '../../../src/types';
import { showAlert, showConfirm } from '../../../src/utils/alert';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { colors, radius, shadows } from '../../../src/theme';

export default function AdminGroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<AdminGroupDetail | null>(null);
  const [coaches, setCoaches] = useState<{ id: number; username: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCoachPicker, setShowCoachPicker] = useState(false);

  const load = async () => {
    try {
      const [g, c] = await Promise.all([
        adminService.getGroupDetail(Number(groupId)),
        adminService.getCoaches(),
      ]);
      setGroup(g);
      setCoaches(c);
      setName(g.name);
      setDescription(g.description ?? '');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [groupId]));

  const handleSave = async () => {
    if (!group) return;
    if (!name.trim()) {
      showAlert('Ошибка', 'Название не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      const updated = await adminService.updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setGroup({ ...group, ...updated });
      showAlert('Готово', 'Группа обновлена');
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleReassignCoach = (coachId: number, coachUsername: string) => {
    if (!group || coachId === group.coach_id) {
      setShowCoachPicker(false);
      return;
    }
    showConfirm(
      'Сменить тренера группы?',
      `${group.name}: → ${coachUsername}`,
      async () => {
        try {
          const updated = await adminService.updateGroup(group.id, { coach_id: coachId });
          setGroup({ ...group, ...updated });
          setShowCoachPicker(false);
        } catch {
          showAlert('Ошибка', 'Не удалось сменить тренера');
        }
      },
      'Сменить'
    );
  };

  const handleRemoveMember = (playerId: number, username: string) => {
    if (!group) return;
    showConfirm('Удалить игрока из группы?', username, async () => {
      try {
        await adminService.removeMember(group.id, playerId);
        setGroup({ ...group, members: group.members.filter((m) => m.id !== playerId) });
      } catch {
        showAlert('Ошибка', 'Не удалось удалить игрока');
      }
    });
  };

  const handleToggleAssistant = async (playerId: number, current: boolean) => {
    if (!group) return;
    try {
      await adminService.setAssistantCoach(group.id, playerId, !current);
      setGroup({
        ...group,
        members: group.members.map((m) => (m.id === playerId ? { ...m, is_assistant_coach: !current } : m)),
      });
    } catch {
      showAlert('Ошибка', 'Не удалось изменить роль помощника');
    }
  };

  const handleDelete = () => {
    if (!group) return;
    showConfirm(
      'Удалить группу целиком?',
      `${group.name} — вместе с ней удалятся все раскидки, тактики, матчи, тренировки и материалы группы. Это необратимо.`,
      async () => {
        setDeleting(true);
        try {
          await adminService.deleteGroup(group.id);
          router.replace('/(admin)/groups' as any);
        } catch {
          showAlert('Ошибка', 'Не удалось удалить группу');
          setDeleting(false);
        }
      },
      'Удалить'
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notFound || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Группа не найдена</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>👥 {group.name}</Text>
      <Text style={styles.subtitle}>Создана {new Date(group.created_at).toLocaleDateString('ru-RU')}</Text>

      <Text style={styles.sectionTitle}>Основное</Text>
      <TextInput style={styles.input} placeholder="Название" placeholderTextColor={colors.textFaint} value={name} onChangeText={setName} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Описание"
        placeholderTextColor={colors.textFaint}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      <GradientButton title="Сохранить" onPress={handleSave} loading={saving} style={styles.saveBtn} />

      <Text style={styles.sectionTitle}>Тренер</Text>
      <TouchableOpacity style={styles.coachRow} onPress={() => setShowCoachPicker((v) => !v)} activeOpacity={0.7}>
        <Text style={styles.coachRowText}>🎯 {group.coach_username} · {group.coach_email}</Text>
        <Text style={styles.chevronText}>{showCoachPicker ? '⌄' : '›'}</Text>
      </TouchableOpacity>
      {showCoachPicker ? (
        <View style={styles.row}>
          {coaches.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.optionBtn, c.id === group.coach_id && styles.optionBtnActive]}
              onPress={() => handleReassignCoach(c.id, c.username)}
            >
              <Text style={[styles.optionText, c.id === group.coach_id && styles.optionTextActive]}>{c.username}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Контент группы</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.nades}</Text><Text style={styles.statChipLabel}>раскидок</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.tactics}</Text><Text style={styles.statChipLabel}>тактик</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.materials}</Text><Text style={styles.statChipLabel}>материалов</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.trainings}</Text><Text style={styles.statChipLabel}>тренировок</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.matches}</Text><Text style={styles.statChipLabel}>матчей</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.tasks}</Text><Text style={styles.statChipLabel}>задач</Text></View>
        <View style={styles.statChip}><Text style={styles.statChipValue}>{group.contentCounts.routines}</Text><Text style={styles.statChipLabel}>рутин</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Состав ({group.members.length})</Text>
      <View style={styles.listCard}>
        {group.members.length === 0 ? (
          <Text style={styles.emptyText}>Игроков пока нет</Text>
        ) : (
          group.members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/(admin)/users/${m.id}` as any)}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.username}{m.is_assistant_coach ? ' 🌟' : ''}{!m.is_active ? ' 🚫' : ''}
                </Text>
                <Text style={styles.memberEmail} numberOfLines={1}>{m.email}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => handleToggleAssistant(m.id, m.is_assistant_coach)}
              >
                <Text style={styles.smallBtnText}>{m.is_assistant_coach ? 'Снять помощника' : 'В помощники'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtnDanger}
                onPress={() => handleRemoveMember(m.id, m.username)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.smallBtnDangerText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Опасная зона</Text>
      <GradientButton title="🗑️ Удалить группу" onPress={handleDelete} loading={deleting} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, width: '100%', maxWidth: 700, alignSelf: 'center' },
  back: { color: colors.primary, fontSize: 15, marginBottom: 16 },
  errorText: { color: colors.textSecondary, fontSize: 15, marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 8 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 22, marginBottom: 10, letterSpacing: -0.2 },
  input: {
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 10,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { marginTop: 4 },
  coachRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, ...shadows.subtle,
  },
  coachRowText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chevronText: { color: colors.textFaint, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  optionBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: colors.primary },
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
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  memberName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  memberEmail: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  smallBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
  },
  smallBtnText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  smallBtnDanger: { padding: 6 },
  smallBtnDangerText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.textFaint, fontSize: 13, padding: 16, textAlign: 'center' },
});
