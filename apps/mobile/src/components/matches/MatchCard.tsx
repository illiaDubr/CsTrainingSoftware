import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Match } from '../../types';
import { CLASS_META } from './matchMeta';

interface Props {
  match: Match;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAuthor?: boolean;
}

export function MatchCard({ match, onPress, onEdit, onDelete, showAuthor }: Props) {
  const date = new Date(match.scheduled_at);
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const meta = CLASS_META[match.match_class];

  const now = new Date();
  const isPast = date.getTime() < now.getTime();

  return (
    <TouchableOpacity
      style={[styles.card, isPast && styles.cardPast]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* У прошедшего матча плашка даты нейтрально-серая, без цвета типа матча */}
      <View style={[
        styles.dateBox,
        isPast
          ? { borderColor: '#2A3145', backgroundColor: '#171A28' }
          : { borderColor: meta.color, backgroundColor: meta.softColor },
      ]}>
        <Text style={[styles.day, { color: isPast ? '#5B677D' : meta.color }, isPast && styles.textPast]}>
          {date.getDate()}
        </Text>
        <Text style={[styles.month, { color: isPast ? '#5B677D' : meta.color }]}>
          {date.toLocaleDateString('ru-RU', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isPast && styles.textPast]} numberOfLines={1}>{match.opponent}</Text>
          {isPast ? (
            <View style={styles.pastBadge}>
              <Text style={styles.pastBadgeText}>ПРОШЁЛ</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <View style={[styles.classBadge, { borderColor: isPast ? '#2A3145' : meta.color }]}>
            <Text style={[styles.classBadgeText, { color: isPast ? '#5B677D' : meta.color }]}>
              {meta.icon} {meta.label}
            </Text>
          </View>
          <Text style={[styles.metaText, isPast && styles.textPast]}>{timeStr}</Text>
        </View>
        {match.note ? (
          <Text style={styles.note} numberOfLines={2}>{match.note}</Text>
        ) : null}
        {showAuthor && match.created_by_username ? (
          <Text style={styles.author}>Добавил: {match.created_by_username}</Text>
        ) : null}
      </View>
      {onEdit ? (
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editText}>✎</Text>
        </TouchableOpacity>
      ) : null}
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#151827', borderRadius: 16, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#242A40', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardPast: { opacity: 0.7, backgroundColor: '#131624' },
  /** Прошедший матч — зачёркиваем, чтобы сразу было видно, что он уже сыгран */
  textPast: { textDecorationLine: 'line-through' },
  pastBadge: {
    borderWidth: 1, borderColor: '#3A4358', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8,
  },
  pastBadgeText: { color: '#748099', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dateBox: {
    width: 50, height: 50, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  day: { fontSize: 19, fontWeight: '800' },
  month: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  classBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  classBadgeText: { fontSize: 11, fontWeight: '700' },
  metaText: { color: '#748099', fontSize: 12 },
  note: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  author: { color: '#5B677D', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  actionBtn: { padding: 8 },
  editText: { color: '#f59e0b', fontSize: 16 },
  deleteText: { color: '#748099', fontSize: 16 },
});
