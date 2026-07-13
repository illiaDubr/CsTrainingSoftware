import { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { Nade } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { CATEGORY_META, NADE_TYPE_META, SIDE_META } from './nadeMeta';

interface Props {
  visible: boolean;
  nade: Nade | null;
  onClose: () => void;
}

export function NadeDetailModal({ visible, nade, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  if (!nade) return null;

  const typeMeta = NADE_TYPE_META[nade.nade_type];
  const sideMeta = SIDE_META[nade.side];
  const catMeta = CATEGORY_META[nade.category];
  const imgWidth = Math.min(width, 700);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Шапка */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{nade.title}</Text>
              <View style={styles.badges}>
                <View style={[styles.sideBadge, { backgroundColor: sideMeta.color }]}>
                  <Text style={styles.sideBadgeText}>{sideMeta.label}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{typeMeta.icon} {typeMeta.label}</Text>
                </View>
                <View style={[styles.metaBadge, { borderColor: catMeta.color }]}>
                  <Text style={[styles.metaBadgeText, { color: catMeta.color }]}>{catMeta.icon} {catMeta.label}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Галерея */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: imgWidth }}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / imgWidth))}
          >
            {nade.images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: nadeImageUrl(img.image_url) }}
                style={{ width: imgWidth, aspectRatio: 16 / 9, backgroundColor: '#10131E' }}
                resizeMode="contain"
              />
            ))}
            {nade.images.length === 0 ? (
              <View style={[styles.noImage, { width: imgWidth }]}>
                <Text style={styles.noImageText}>{typeMeta.icon}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Точки-пагинация */}
          {nade.images.length > 1 ? (
            <View style={styles.dots}>
              {nade.images.map((img, i) => (
                <View key={img.id} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          ) : null}

          {nade.description ? (
            <ScrollView style={styles.descWrap}>
              <Text style={styles.description}>{nade.description}</Text>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: {
    width: '100%', maxWidth: 700, maxHeight: '92%',
    backgroundColor: '#151827', borderRadius: 16,
    borderWidth: 1, borderColor: '#242A40', overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sideBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sideBadgeText: { color: '#0B0D14', fontSize: 11, fontWeight: '900' },
  metaBadge: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#10131E',
  },
  metaBadgeText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 6, marginLeft: 8 },
  closeText: { color: '#94A3B8', fontSize: 18 },
  noImage: { aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10131E' },
  noImageText: { fontSize: 48, opacity: 0.4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3A4358' },
  dotActive: { backgroundColor: '#f59e0b' },
  descWrap: { maxHeight: 140, paddingHorizontal: 16, paddingBottom: 16 },
  description: { color: '#D6DEEB', fontSize: 13, lineHeight: 19 },
});
