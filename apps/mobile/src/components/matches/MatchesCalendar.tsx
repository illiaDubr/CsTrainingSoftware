import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Match } from '../../types';
import { CLASS_META } from './matchMeta';

interface Props {
  matches: Match[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const toLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function MatchesCalendar({ matches, selectedDate, onSelectDate }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const todayStr = toLocalDate(new Date());

  const matchesByDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const dateStr = toLocalDate(new Date(m.scheduled_at));
      const arr = map.get(dateStr) || [];
      arr.push(m);
      map.set(dateStr, arr);
    }
    return map;
  }, [matches]);

  const { year, month } = cursor;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const goPrevMonth = () => setCursor((c) => {
    const m = c.month === 0 ? 11 : c.month - 1;
    const y = c.month === 0 ? c.year - 1 : c.year;
    return { year: y, month: m };
  });

  const goNextMonth = () => setCursor((c) => {
    const m = c.month === 11 ? 0 : c.month + 1;
    const y = c.month === 11 ? c.year + 1 : c.year;
    return { year: y, month: m };
  });

  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    onSelectDate(todayStr);
  };

  const isCurrentMonthShown = year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
          {!isCurrentMonthShown ? <Text style={styles.todayHint}>Сегодня</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={goNextMonth} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} style={styles.row}>
          {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
            if (!day) return <View key={di} style={styles.emptyCell} />;

            const dateStr = toDateStr(day);
            const dayMatches = matchesByDate.get(dateStr) || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasMatch = dayMatches.length > 0;
            const primaryMeta = hasMatch ? CLASS_META[dayMatches[0].match_class] : null;
            const labelColor = isSelected ? '#171000' : primaryMeta?.color;

            return (
              <TouchableOpacity
                key={di}
                activeOpacity={0.7}
                onPress={() => onSelectDate(dateStr)}
                style={[
                  styles.cell,
                  hasMatch && !isSelected && { backgroundColor: primaryMeta!.softColor, borderColor: primaryMeta!.color },
                  isToday && !isSelected && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
              >
                <Text style={[
                  styles.dayNum,
                  isToday && !isSelected && styles.dayNumToday,
                  isSelected && styles.dayNumSelected,
                ]}>
                  {day}
                </Text>
                {hasMatch ? (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.matchLabel, { color: labelColor }]}
                  >
                    {dayMatches.length > 1
                      ? `${dayMatches.length} матча`
                      : new Date(dayMatches[0].scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: CLASS_META.esea.color }]} />
          <Text style={styles.legendText}>ESEA</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: CLASS_META.other.color }]} />
          <Text style={styles.legendText}>Другое</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151827', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#242A40', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  navBtn: { padding: 6 },
  navText: { color: '#f59e0b', fontSize: 22, fontWeight: '600' },
  monthTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  todayHint: { color: '#f59e0b', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', color: '#748099', fontSize: 11, fontWeight: '600' },
  cell: {
    flex: 1, minHeight: 46, marginHorizontal: 2, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 2,
    justifyContent: 'flex-start', alignItems: 'center', borderWidth: 1, borderColor: 'transparent', overflow: 'hidden',
  },
  emptyCell: { flex: 1, minHeight: 46, marginHorizontal: 2 },
  cellToday: { borderColor: '#f59e0b' },
  cellSelected: { backgroundColor: '#f59e0b' },
  dayNum: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  dayNumToday: { color: '#f59e0b', fontWeight: '800' },
  dayNumSelected: { color: '#171000', fontWeight: '800' },
  matchLabel: { fontSize: 9, fontWeight: '800', marginTop: 3, maxWidth: '100%', textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { color: '#748099', fontSize: 11 },
});
