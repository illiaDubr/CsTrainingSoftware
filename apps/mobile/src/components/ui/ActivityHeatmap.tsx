import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMemo } from 'react';

interface ActivityDay {
  date: string;
  count: number;
}

interface Props {
  activity: ActivityDay[];
  total: number;
}

const CELL = 13;
const GAP = 3;
const WEEKS = 53;
const getColor = (count: number) => {
  if (count === 0) return '#1A1F32';
  if (count === 1) return 'rgba(34,197,94,0.28)';
  if (count <= 3) return '#2d7a2d';
  if (count <= 6) return '#3dab3d';
  return '#4ccd4c';
};

const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const DAY_NAMES = ['Пн','','Ср','','Пт','',''];

export function ActivityHeatmap({ activity, total }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activity) map.set(a.date, a.count);

    const toLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

        const today = new Date();
        const todayStr = toLocalDate(today);

        // Считаем сколько дней показывать: 53 недели = 371 день
        // Начинаем с понедельника той недели что была 371 день назад
        const totalDays = WEEKS * 7;
        const start = new Date(today);
        start.setDate(today.getDate() - totalDays);
        // Выравниваем на понедельник
        const dow = start.getDay(); // 0=вс, 1=пн...
        start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

    const weeks: { date: string; count: number; isToday: boolean; isFuture: boolean }[][] = [];
const monthLabels: { label: string; col: number }[] = [];
let lastMonth = -1;
let w = 0;

while (true) {
  const week = [];
  let hasValidDate = false;

  for (let d = 0; d < 7; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + w * 7 + d);
    const dateStr = toLocalDate(date);
    const month = date.getMonth();

    if (d === 0 && month !== lastMonth) {
      monthLabels.push({ label: MONTH_NAMES[month], col: w });
      lastMonth = month;
    }

    if (dateStr <= todayStr) hasValidDate = true;

    week.push({
      date: dateStr,
      count: map.get(dateStr) || 0,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  weeks.push(week);
  w++;

  // Останавливаемся когда последний день недели >= сегодня
  const lastDayOfWeek = week[6].date;
  if (lastDayOfWeek >= todayStr) break;
  if (w > 55) break; // защита от бесконечного цикла
}
// const found = weeks.flat().find(d => d.date === '2026-06-29');
// console.log('Found cell:', found);
// const allDates = weeks.flat().map(d => d.date);
// console.log('Last 3 dates:', allDates.slice(-3));
// console.log('Today:', todayStr);
    return { weeks, monthLabels };
  }, [activity]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Активность</Text>
        <Text style={styles.total}>{total} выполнено за год</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Метки месяцев */}
          <View style={styles.monthRow}>
            {monthLabels.map((ml, i) => (
              <Text
                key={i}
                style={[styles.monthLabel, { left: 28 + ml.col * (CELL + GAP) }]}
              >
                {ml.label}
              </Text>
            ))}
          </View>

          <View style={styles.gridRow}>
            {/* Метки дней */}
            <View style={styles.dayLabelsCol}>
              {DAY_NAMES.map((d, i) => (
                <View key={i} style={styles.dayLabelBox}>
                  <Text style={styles.dayLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Недели */}
            <View style={styles.weeksRow}>
              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekCol}>
                  {week.map((day, di) => (
                    <View
                      key={di}
                      style={[
                        styles.cell,
                        { backgroundColor: day.isFuture ? 'transparent' : getColor(day.count) },
                        day.isToday && styles.cellToday,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Легенда */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>Меньше</Text>
            {[0, 1, 3, 5, 8].map((c, i) => (
              <View key={i} style={[styles.cell, { backgroundColor: getColor(c), marginLeft: 3 }]} />
            ))}
            <Text style={[styles.legendText, { marginLeft: 3 }]}>Больше</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A40',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  total: { color: '#94A3B8', fontSize: 12 },
  monthRow: {
    position: 'relative',
    height: 14,
    marginBottom: 4,
    width: 28 + WEEKS * (CELL + GAP),
  },
  monthLabel: {
    position: 'absolute',
    color: '#748099',
    fontSize: 9,
    top: 0,
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayLabelsCol: {
    width: 24,
    marginRight: 4,
    flexDirection: 'column',
  },
  dayLabelBox: {
    height: CELL + GAP,
    justifyContent: 'center',
  },
  dayLabel: {
    color: '#748099',
    fontSize: 8,
    textAlign: 'right',
  },
  weeksRow: {
    flexDirection: 'row',
  },
  weekCol: {
    flexDirection: 'column',
    marginRight: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 2,
    marginBottom: GAP,
  },
  cellToday: {
    borderWidth: 0.5,
    borderColor: '#f59e0b',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  legendText: { color: '#748099', fontSize: 9 },
});