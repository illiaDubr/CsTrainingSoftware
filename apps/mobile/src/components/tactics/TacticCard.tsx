import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tactic } from '../../types';
import { SIDE_META } from '../nades/nadeMeta';

interface Props {
  tactic: Tactic;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TacticCard({ tactic, onPress, onEdit, onDelete }: Props) {
  const sideMeta = SIDE_META[tactic.side];
  const nadeCount = tactic.nade_count ?? tactic.nades?.length ?? 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>🧠</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{tactic.title}</Text>
        <View style={styles.meta}>
          <View style={[styles.sideBadge, { backgroundColor: sideMeta.color }]}>
            <Text style={styles.sideBadgeText}>{sideMeta.label}</Text>
          </View>
          <Text style={styles.metaText}>🗺️ {tactic.map_name}</Text>
          <Text style={styles.metaText}>💣 {nadeCount}</Text>
        </View>
        {tactic.description ? (
          <Text style={styles.description} numberOfLines={2}>{tactic.description}</Text>
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
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1, borderColor: '#242A40', justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  sideBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  sideBadgeText: { color: '#0B0D14', fontSize: 10, fontWeight: '900' },
  metaText: { color: '#748099', fontSize: 12 },
  description: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  actionBtn: { padding: 8 },
  editText: { color: '#f59e0b', fontSize: 16 },
  deleteText: { color: '#748099', fontSize: 16 },
});
