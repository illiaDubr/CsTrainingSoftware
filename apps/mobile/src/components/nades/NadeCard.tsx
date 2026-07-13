import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Nade } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { NADE_TYPE_META, SIDE_META } from './nadeMeta';

interface Props {
  nade: Nade;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function NadeCard({ nade, onPress, onEdit, onDelete }: Props) {
  const typeMeta = NADE_TYPE_META[nade.nade_type];
  const sideMeta = SIDE_META[nade.side];
  const preview = nade.images[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageWrap}>
        {preview ? (
          <Image source={{ uri: nadeImageUrl(preview.image_url) }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>{typeMeta.icon}</Text>
          </View>
        )}

        {/* Бейджи поверх скриншота */}
        <View style={styles.badges}>
          <View style={[styles.sideBadge, { backgroundColor: sideMeta.color }]}>
            <Text style={styles.sideBadgeText}>{sideMeta.label}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeMeta.icon} {typeMeta.label}</Text>
          </View>
        </View>

        {nade.images.length > 1 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>📷 {nade.images.length}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{nade.title}</Text>
        {(onEdit || onDelete) ? (
          <View style={styles.actions}>
            {onEdit ? (
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.editText}>✎</Text>
              </TouchableOpacity>
            ) : null}
            {onDelete ? (
              <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#151827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242A40',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  imageWrap: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#10131E' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 34, opacity: 0.5 },
  badges: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 4 },
  sideBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sideBadgeText: { color: '#0B0D14', fontSize: 10, fontWeight: '900' },
  typeBadge: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { color: '#F8FAFC', fontSize: 10, fontWeight: '600' },
  countBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  countBadgeText: { color: '#F8FAFC', fontSize: 10, fontWeight: '600' },
  body: { padding: 10, flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 17 },
  actions: { flexDirection: 'row', marginLeft: 6 },
  actionBtn: { paddingHorizontal: 4 },
  editText: { color: '#f59e0b', fontSize: 14 },
  deleteText: { color: '#748099', fontSize: 14 },
});
