import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../../src/services/groupsService';
import { FAB } from '../../../../src/components/ui/FAB';

interface Member {
  id: number;
  username: string;
  email: string;
}

export default function CoachGroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      {members.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Пока нет игроков в группе</Text></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() => router.push(`/(coach)/player/${item.id}?username=${encodeURIComponent(item.username)}&email=${encodeURIComponent(item.email)}`)}
              activeOpacity={0.7}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{item.username?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.username}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FAB onPress={() => router.push(`/(coach)/add-member?groupId=${id}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#151827',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#242A40',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.14)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  memberAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
  memberName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  chevron: { color: '#5B677D', fontSize: 20 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
