import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { groupsService } from '../../../src/services/groupsService';
import { tasksService } from '../../../src/services/tasksService';
import { TaskCard } from '../../../src/components/cards/TaskCard';
import { Task } from '../../../src/types';

interface Member {
  id: number;
  username: string;
  email: string;
}

export default function CoachGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'tasks' | 'members'>('tasks');

  const loadData = async () => {
    try {
      const [group, taskList] = await Promise.all([
        groupsService.getGroupById(Number(id)),
        tasksService.getTasksByGroup(Number(id)),
      ]);
      setGroupName(group.name);
      setMembers(group.members);
      setTasks(taskList);
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

      <Text style={styles.title}>{groupName}</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'tasks' && styles.tabActive]}
          onPress={() => setTab('tasks')}
        >
          <Text style={[styles.tabText, tab === 'tasks' && styles.tabTextActive]}>
            Задачи ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'members' && styles.tabActive]}
          onPress={() => setTab('members')}
        >
          <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>
            Игроки ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'tasks' ? (
        tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Пока нет задач</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onPress={() => router.push(`/(coach)/task/${item.id}`)}
              />
            )}
          />
        )
      ) : (
        members.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Пока нет игроков в группе</Text>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.memberName}>{item.username}</Text>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
              </View>
            )}
          />
        )
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          tab === 'tasks'
            ? router.push(`/(coach)/create-task?groupId=${id}`)
            : router.push(`/(coach)/add-member?groupId=${id}`)
        }
      >
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
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1d2e', borderWidth: 1, borderColor: '#2a2d3e' },
  tabActive: { borderColor: '#f59e0b', backgroundColor: '#2a1f00' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#f59e0b' },
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
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '300', marginTop: -2 },
});