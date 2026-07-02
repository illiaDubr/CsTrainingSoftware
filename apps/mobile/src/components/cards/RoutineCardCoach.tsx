import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Routine } from '../../types';
import { MonthGrid } from '../ui/MonthGrid';

const STATUS_COLORS: Record<string, string> = {
  pending: '#666', in_progress: '#3b82f6', completed: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не отмечено', in_progress: 'В процессе', completed: 'Выполнено',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#666', medium: '#f59e0b', high: '#ef4444',
};

interface Props {
  routine: Routine;
  todayDate: string;
  onDelete: () => void;
}

export function RoutineCardCoach({ routine, todayDate, onDelete }: Props) {
  const playerStats = routine.playerStats || [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[routine.priority] }]} />
          <Text style={styles.title}>{routine.title}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>

      {routine.description ? (
        <Text style={styles.description}>{routine.description}</Text>
      ) : null}

      {/* Игроки */}
      {playerStats.map(player => (
        <View key={player.playerId} style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>{player.username[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{player.username}</Text>
              <Text style={styles.playerRate}>Выполнение: {player.completionRate}%</Text>
            </View>
            <View style={[styles.todayBadge, { borderColor: STATUS_COLORS[player.todayStatus] }]}>
              <Text style={[styles.todayBadgeText, { color: STATUS_COLORS[player.todayStatus] }]}>
                {STATUS_LABELS[player.todayStatus]}
              </Text>
            </View>
          </View>

          <MonthGrid
            monthProgress={player.monthProgress}
            todayDate={todayDate}
          />
        </View>
      ))}

      {playerStats.length === 0 && (
        <Text style={styles.emptyText}>В группе пока нет игроков</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1d2e', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#2a2d3e',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  description: { color: '#888', fontSize: 12, marginBottom: 12 },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#555', fontSize: 18 },
  playerSection: {
    borderTopWidth: 1, borderTopColor: '#2a2d3e',
    marginTop: 14, paddingTop: 14,
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  playerAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 13 },
  playerName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  playerRate: { color: '#888', fontSize: 11 },
  todayBadge: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyText: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 8 },
});