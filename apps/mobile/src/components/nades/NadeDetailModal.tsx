import { useEffect, useRef, useState } from 'react';
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

const MAX_MODAL_WIDTH = 1100;

export function NadeDetailModal({ visible, nade, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Сброс на первый слайд при открытии новой гранаты
  useEffect(() => {
    setPage(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [nade?.id, visible]);

  if (!nade) return null;

  const typeMeta = NADE_TYPE_META[nade.nade_type];
  const sideMeta = SIDE_META[nade.side];
  const catMeta = CATEGORY_META[nade.category];
  const imgWidth = Math.min(width * 0.96, MAX_MODAL_WIDTH);
  const total = nade.images.length;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(i, total - 1));
    setPage(next);
    scrollRef.current?.scrollTo({ x: next * imgWidth, animated: true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Клик по затемнению закрывает модалку */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.contentWrap}>
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
            <View style={{ width: imgWidth }}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
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
                {total === 0 ? (
                  <View style={[styles.noImage, { width: imgWidth }]}>
                    <Text style={styles.noImageText}>{typeMeta.icon}</Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* Стрелки по бокам */}
              {total > 1 && page > 0 ? (
                <TouchableOpacity
                  style={[styles.arrow, styles.arrowLeft]}
                  onPress={() => goTo(page - 1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.arrowText}>‹</Text>
                </TouchableOpacity>
              ) : null}
              {total > 1 && page < total - 1 ? (
                <TouchableOpacity
                  style={[styles.arrow, styles.arrowRight]}
                  onPress={() => goTo(page + 1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ) : null}

              {/* Счётчик 1/4 */}
              {total > 1 ? (
                <View style={styles.counter}>
                  <Text style={styles.counterText}>{page + 1} / {total}</Text>
                </View>
              ) : null}
            </View>

            {/* Точки-пагинация (кликабельные) */}
            {total > 1 ? (
              <View style={styles.dots}>
                {nade.images.map((img, i) => (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => goTo(i)}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <View style={[styles.dot, i === page && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {nade.description ? (
              <ScrollView style={styles.descWrap}>
                <Text style={styles.description}>{nade.description}</Text>
              </ScrollView>
            ) : null}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center',
  },
  contentWrap: {
    width: '96%', maxWidth: MAX_MODAL_WIDTH,
  },
  content: {
    width: '100%', maxHeight: '96%',
    backgroundColor: '#151827', borderRadius: 16,
    borderWidth: 1, borderColor: '#242A40', overflow: 'hidden',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sideBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sideBadgeText: { color: '#0B0D14', fontSize: 11, fontWeight: '900' },
  metaBadge: {
    borderWidth: 1, borderColor: '#242A40', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#10131E',
  },
  metaBadgeText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 6, marginLeft: 8 },
  closeText: { color: '#94A3B8', fontSize: 20 },
  noImage: { aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10131E' },
  noImageText: { fontSize: 48, opacity: 0.4 },
  arrow: {
    position: 'absolute', top: '50%', marginTop: -28,
    width: 48, height: 56, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  arrowText: { color: '#F8FAFC', fontSize: 34, fontWeight: '300', marginTop: -4 },
  counter: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  counterText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3A4358' },
  dotActive: { backgroundColor: '#f59e0b' },
  descWrap: { maxHeight: 160, paddingHorizontal: 16, paddingBottom: 16 },
  description: { color: '#D6DEEB', fontSize: 14, lineHeight: 20 },
});
