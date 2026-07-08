import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MonthProgressDay, Routine, TaskStatus } from '../../types';
import { MonthGrid } from '../ui/MonthGrid';
import { DayDetailModal } from '../ui/DayDetailModal';
import { routineAccent } from '../../utils/routineColors';

const STATUS_COLORS: Record<string, string> = {
  pending: '#748099', in_progress: '#3b82f6', completed: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Не отмечено', in_progress: 'В процессе', completed: 'Выполнено',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#748099', medium: '#f59e0b', high: '#ef4444',
};

interface Props {
  routine: Routine;
  todayDate: string;
  onDelete: () => void;
  onEdit?: () => void;
  /** Тренер: проставить статус игроку за конкретный день */
  onOverrideStatus?: (playerId: number, date: string, status: TaskStatus) => Promise<void>;
}

export function RoutineCardCoach({ routine, todayDate, onDelete, onEdit, onOverrideStatus }: Props) {
  const playerStats = routine.playerStats || [];
  const accent = routineAccent(routine.id);
  const [selectedDay, setSelectedDay] = useState<{ day: MonthProgressDay; playerName: string; playerId: number } | null>(null);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} мин`;
    return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
  };

  return (
    <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: accent }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[routine.priority] }]} />
          <Text style={[styles.title, { color: accent }]}>{routine.title}</Text>
        </View>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity>
        ) : null}
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
              {player.todayTimeSpent != null ? (
                <Text style={styles.playerTime}>⏱ Сегодня: {formatTime(player.todayTimeSpent)}</Text>
              ) : null}
              {player.todayNote ? (
                <Text style={styles.playerNote}>💬 {player.todayNote}</Text>
              ) : null}
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
            onDayPress={(day) => setSelectedDay({ day, playerName: player.username, playerId: player.playerId })}
          />
        </View>
      ))}

      {playerStats.length === 0 && (
        <Text style={styles.emptyText}>В группе пока нет игроков</Text>
      )}

      <DayDetailModal
        visible={!!selectedDay}
        day={selectedDay?.day || null}
        routineTitle={routine.title}
        playerName={selectedDay?.playerName}
        onClose={() => setSelectedDay(null)}
        onSetStatus={
          onOverrideStatus && selectedDay
            ? (status) => onOverrideStatus(selectedDay.playerId, selectedDay.day.date, status)
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151827', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#242A40',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', flex: 1 },
  description: { color: '#94A3B8', fontSize: 12, marginBottom: 12 },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#5B677D', fontSize: 18 },
  editBtn: { padding: 6, marginRight: 2 },
  editText: { color: '#f59e0b', fontSize: 16 },
  playerSection: {
    borderTopWidth: 1, borderTopColor: '#242A40',
    marginTop: 14, paddingTop: 14,
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.14)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  playerAvatarText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 13 },
  playerName: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  playerRate: { color: '#94A3B8', fontSize: 11 },
  todayBadge: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyText: { color: '#748099', fontSize: 13, textAlign: 'center', marginTop: 8 },
  playerNote: { color: '#94A3B8', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  playerTime: { color: '#f59e0b', fontSize: 11, marginTop: 2 },
});
