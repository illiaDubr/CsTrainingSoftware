import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../../src/services/groupsService';

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

      <TouchableOpacity style={styles.fab} onPress={() => router.push(`/(coach)/add-member?groupId=${id}`)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  list: { paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2d3e',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  memberAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  chevron: { color: '#555', fontSize: 20 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
