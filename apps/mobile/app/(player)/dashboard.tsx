import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useAppDispatch';
import { logout } from '../../src/store/slices/authSlice';
import { authService } from '../../src/services/authService';
import { groupsService } from '../../src/services/groupsService';
import { GroupCard } from '../../src/components/cards/GroupCard';
import { Group } from '../../src/types';

export default function PlayerDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getMyGroups();
      setGroups(data);
    } catch {
      // тихо игнорируем — покажем пустое состояние
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    router.replace('/(auth)/login');
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
     <View style={styles.header}>
      <View>
          <Text style={styles.greeting}>Привет, {user?.username} 👋</Text>
          <Text style={styles.subtitle}>Твои группы</Text>
      </View>
        <TouchableOpacity onPress={() => router.push('/(player)/profile')} style={styles.profileBtn}>
          <Text style={styles.profileBtnText}>{user?.username[0].toUpperCase()}</Text>
        </TouchableOpacity>
    </View>
  


      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Ты пока не состоишь ни в одной группе</Text>
          <Text style={styles.emptySubtext}>Попроси тренера добавить тебя</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
          renderItem={({ item }) => (
            <GroupCard
              name={item.name}
              description={item.description}
              onPress={() => router.push(`/(player)/group/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14 },
  list: { paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { color: '#555', fontSize: 13, textAlign: 'center' },
  headerButtons: { alignItems: 'flex-end', gap: 8 },
profileBtn: {
  width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a1f00',
  justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b',
},
profileBtnText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 15 },
});