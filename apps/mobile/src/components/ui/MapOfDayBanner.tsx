import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapOfDay } from '../../services/mapsService';
import { colors, radius } from '../../theme';

const formatShort = (dateStr: string) => {
  const [, m, d] = dateStr.split('-');
  return `${d}.${m}`;
};

interface Props {
  map: MapOfDay;
  /** Показывать ник тренера (для игрока) */
  showCoach?: boolean;
  /** Тренер: тап по баннеру (сменить карту) */
  onPress?: () => void;
  /** Тренер: снять карту */
  onRemove?: () => void;
}

export function MapOfDayBanner({ map, showCoach, onPress, onRemove }: Props) {
  const period = map.start_date === map.end_date
    ? 'сегодня'
    : `до ${formatShort(map.end_date)}`;

  const inner = (
    <View style={styles.banner}>
      <Text style={styles.icon}>🗺️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>КАРТА ДНЯ · {period.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>{map.map_name}</Text>
        {showCoach && map.coach_username ? (
          <Text style={styles.coach}>тренер {map.coach_username}</Text>
        ) : null}
      </View>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 14,
  },
  icon: { fontSize: 24, marginRight: 12 },
  label: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  coach: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 6, marginLeft: 8 },
  removeText: { color: colors.textFaint, fontSize: 16 },
});
