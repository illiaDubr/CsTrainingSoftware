import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { statsService } from '../../../src/services/statsService';
import { ActivityHeatmap } from '../../../src/components/ui/ActivityHeatmap';

interface PlayerInfo {
  id: number;
  username: string;
  email: string;
}

export default function CoachPlayerProfileScreen() {
  const { id, username, email } = useLocalSearchParams<{ id: string; username: string; email: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const data = await statsService.getPlayerActivity(Number(id));
          setActivity(data.activity);
          setTotal(data.total);
        } catch {
          // тихо
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Профиль игрока</Text>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username?.[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Игрок</Text>
          </View>
        </View>
      </View>

      <ActivityHeatmap activity={activity} total={total} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e',
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#2a2d3e',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#f59e0b', fontSize: 24, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#888', fontSize: 13, marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#2a1f00', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  roleText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
});