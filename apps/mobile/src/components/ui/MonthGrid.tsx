import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MonthProgressDay, TaskStatus } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#1e2235',
  in_progress: '#1a3a6a',
  completed: '#1a4a1a',
};

const STATUS_BORDER: Record<string, string> = {
  pending: '#2a2d3e',
  in_progress: '#3b82f6',
  completed: '#22c55e',
};

interface Props {
  monthProgress: MonthProgressDay[];
  todayDate: string;
  onDayPress?: (day: MonthProgressDay) => void;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function MonthGrid({ monthProgress, todayDate, onDayPress }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Первый день месяца — какой день недели (0=вс, 1=пн...)
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // сдвиг к понедельнику

  const progressMap = new Map<string, MonthProgressDay>();
  for (const p of monthProgress) {
    progressMap.set(p.date, p);
  }

  // Строим массив ячеек: пустые + дни месяца
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Дополняем до кратного 7
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Заголовки дней */}
      <View style={styles.row}>
        {DAY_LABELS.map(d => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Сетка */}
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} style={styles.row}>
          {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
            if (!day) return <View key={di} style={styles.emptyCell} />;

            const dateStr = toDateStr(day);
            const dayProgress = progressMap.get(dateStr);
            const status = dayProgress?.status || 'pending';
            const isToday = dateStr === todayDate;
            const isFuture = dateStr > todayDate;
            const pressable = !isFuture && !!onDayPress;

            return (
              <TouchableOpacity
                key={di}
                disabled={!pressable}
                activeOpacity={0.6}
                onPress={() => onDayPress?.(dayProgress || { date: dateStr, status: 'pending' })}
                style={[
                  styles.cell,
                  { backgroundColor: isFuture ? 'transparent' : STATUS_COLORS[status] },
                  { borderColor: isToday ? '#f59e0b' : isFuture ? '#2a2d3e' : STATUS_BORDER[status] },
                  isToday && styles.cellToday,
                ]}
              >
                <Text style={[
                  styles.dayNum,
                  isToday && styles.dayNumToday,
                  isFuture && styles.dayNumFuture,
                ]}>
                  {day}
                </Text>
                {!isFuture && (dayProgress?.note || dayProgress?.time_spent_minutes != null) ? (
                  <View style={styles.noteDot} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: {
    width: CELL_SIZE, textAlign: 'center',
    color: '#666', fontSize: 10, fontWeight: '600', marginBottom: 4,
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: 8,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    marginRight: 2,
  },
  emptyCell: { width: CELL_SIZE, height: CELL_SIZE, marginRight: 2 },
  cellToday: { borderWidth: 2 },
  dayNum: { color: '#fff', fontSize: 11, fontWeight: '500' },
  noteDot: {
    position: 'absolute', top: 3, right: 3,
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#f59e0b',
  },
  dayNumToday: { color: '#f59e0b', fontWeight: 'bold' },
  dayNumFuture: { color: '#333' },
});