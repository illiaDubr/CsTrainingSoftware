import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAppSelector } from '../../../../src/hooks/useAppDispatch';
import { matchesService } from '../../../../src/services/matchesService';
import { Match } from '../../../../src/types';
import { MatchesCalendar } from '../../../../src/components/matches/MatchesCalendar';
import { MatchCard } from '../../../../src/components/matches/MatchCard';
import { FAB } from '../../../../src/components/ui/FAB';
import { showAlert, showConfirm } from '../../../../src/utils/alert';

const toLocalDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PlayerGroupMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setMatches(await matchesService.getMatchesByGroup(Number(id)));
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

  const canModify = (m: Match) => m.created_by === user?.id;

  const handleDelete = (match: Match) => {
    showConfirm('Удалить матч?', `vs ${match.opponent}`, async () => {
      try {
        await matchesService.deleteMatch(match.id);
        loadData();
      } catch {
        showAlert('Ошибка', 'Не удалось удалить матч');
      }
    }, 'Удалить');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const dayMatches = matches
    .filter((m) => toLocalDateStr(new Date(m.scheduled_at)) === selectedDate)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const now = Date.now();
  const upcoming = matches
    .filter((m) => new Date(m.scheduled_at).getTime() >= now)
    .slice(0, 5);

  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);
  const selectedLabel = selectedDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📅 Матчи</Text>
        <Text style={styles.subtitle}>ESEA и другие игры команды — добавить может любой участник</Text>

        <MatchesCalendar matches={matches} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        <Text style={styles.sectionTitle}>{selectedLabel}</Text>
        {dayMatches.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>Матчей в этот день нет</Text>
          </View>
        ) : (
          dayMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              showAuthor
              onEdit={canModify(m) ? () => router.push(`/(player)/edit-match?matchId=${m.id}`) : undefined}
              onDelete={canModify(m) ? () => handleDelete(m) : undefined}
            />
          ))
        )}

        {upcoming.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Ближайшие матчи</Text>
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                showAuthor
                onPress={() => setSelectedDate(toLocalDateStr(new Date(m.scheduled_at)))}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <FAB onPress={() => router.push(`/(player)/create-match?groupId=${id}&date=${selectedDate}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0B0D14' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4, letterSpacing: -0.3, textTransform: 'capitalize' },
  emptyDay: { paddingVertical: 24, alignItems: 'center' },
  emptyDayText: { color: '#748099', fontSize: 13 },
});
