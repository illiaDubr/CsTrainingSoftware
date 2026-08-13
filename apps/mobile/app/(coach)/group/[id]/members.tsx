import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../../src/services/groupsService';
import { FAB } from '../../../../src/components/ui/FAB';
import { GroupMember } from '../../../../src/types';
import { showAlert } from '../../../../src/utils/alert';
import { useGroupPermission } from '../../../../src/hooks/useGroupPermission';

export default function GroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, isRealCoach, pathPrefix } = useGroupPermission(Number(id));

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const group = await groupsService.getGroupById(Number(id));
      setMembers(group.members ?? []);
    } catch {
      // тихо
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleAssistant = async (member: GroupMember) => {
    setTogglingId(member.id);
    try {
      await groupsService.setAssistantCoach(Number(id), member.id, !member.is_assistant_coach);
      await loadData();
    } catch {
      showAlert('Ошибка', 'Не удалось изменить роль игрока');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>👥 Игроки</Text>
      {isRealCoach ? (
        <Text style={styles.subtitle}>Можешь назначить игрока помощником тренера — он получит права тренера в этой группе</Text>
      ) : null}

      {members.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Пока нет игроков в группе</Text></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              <TouchableOpacity
                style={styles.memberRow}
                onPress={() => router.push(`${pathPrefix}/player/${item.id}?username=${encodeURIComponent(item.username)}&email=${encodeURIComponent(item.email)}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.username?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{item.username}</Text>
                    {item.is_assistant_coach ? (
                      <View style={styles.assistantBadge}>
                        <Text style={styles.assistantBadgeText}>Помощник тренера</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {isRealCoach ? (
                <TouchableOpacity
                  style={styles.assistantToggle}
                  onPress={() => handleToggleAssistant(item)}
                  disabled={togglingId === item.id}
                >
                  {togglingId === item.id ? (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  ) : (
                    <Text style={[styles.assistantToggleText, item.is_assistant_coach && styles.assistantToggleTextRevoke]}>
                      {item.is_assistant_coach ? 'Снять помощника тренера' : 'Сделать помощником тренера'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/add-member?groupId=${id}` as any)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  memberCard: {
    backgroundColor: '#151827', borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#242A40', overflow: 'hidden',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.14)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  memberAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  chevron: { color: '#5B677D', fontSize: 20 },
  assistantBadge: {
    backgroundColor: 'rgba(245,158,11,0.14)', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  assistantBadgeText: { color: '#f59e0b', fontSize: 10, fontWeight: '800' },
  assistantToggle: {
    borderTopWidth: 1, borderTopColor: '#242A40', paddingVertical: 11, alignItems: 'center',
  },
  assistantToggleText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  assistantToggleTextRevoke: { color: '#94A3B8' },
});
