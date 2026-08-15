import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { Nade, NadeImage } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { ImageZoomView } from './ImageZoomView';
import { NadeVideo } from './NadeVideo';
import { CATEGORY_META, IMAGE_TYPE_META, NADE_TYPE_META, SIDE_META } from './nadeMeta';

interface Props {
  visible: boolean;
  nade: Nade | null;
  onClose: () => void;
}

const MAX_MODAL_WIDTH = 1240;
/** С этой ширины раскладываем в две колонки: медиа слева, скриншоты справа */
const TWO_COLUMN_BREAKPOINT = 900;

export function NadeDetailModal({ visible, nade, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [lightbox, setLightbox] = useState<NadeImage | null>(null);

  // Сброс лайтбокса при смене гранаты / закрытии
  useEffect(() => {
    setLightbox(null);
  }, [nade?.id, visible]);

  if (!nade) return null;

  const typeMeta = NADE_TYPE_META[nade.nade_type];
  const sideMeta = SIDE_META[nade.side];
  const catMeta = CATEGORY_META[nade.category];

  const twoColumns = width >= TWO_COLUMN_BREAKPOINT;
  const modalWidth = Math.min(width * 0.96, MAX_MODAL_WIDTH);
  const modalMaxHeight = height * 0.92;

  // Ширина колонок: в две колонки делим пополам с отступом, иначе — вся ширина
  const columnWidth = twoColumns ? (modalWidth - 1) / 2 : modalWidth;
  const mediaHeight = Math.round(columnWidth * (9 / 16));

  const images = nade.images ?? [];
  const posterImage = images[0];
  const poster = posterImage ? nadeImageUrl(posterImage.image_url) : undefined;

  /** Левая колонка: видео (или крупный первый скрин) + панель с данными */
  const renderMedia = () => (
    <View style={[styles.mediaColumn, twoColumns && { width: columnWidth }]}>
      {nade.video_url ? (
        <NadeVideo uri={nadeImageUrl(nade.video_url)} height={mediaHeight} poster={poster} />
      ) : posterImage ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setLightbox(posterImage)}>
          <Image
            source={{ uri: nadeImageUrl(posterImage.image_url) }}
            style={{ width: '100%', height: mediaHeight, backgroundColor: '#000' }}
            resizeMode="contain"
          />
          <View style={styles.zoomHint}>
            <Text style={styles.zoomHintText}>Нажми, чтобы увеличить</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.noMedia, { height: mediaHeight }]}>
          <Text style={styles.noMediaIcon}>{typeMeta.icon}</Text>
          <Text style={styles.noMediaText}>Материалов пока нет</Text>
        </View>
      )}

      {/* Панель с данными раскидки */}
      <ScrollView style={styles.infoPanel} contentContainerStyle={styles.infoPanelInner}>
        <Text style={styles.title}>{nade.title}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Сторона</Text>
            <Text style={[styles.infoValue, { color: sideMeta.color }]}>
              {nade.side === 'T' ? 'Terrorists' : 'Counter-Terrorists'}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Тип гранаты</Text>
            <Text style={styles.infoValue}>{typeMeta.icon} {typeMeta.label}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Карта</Text>
            <Text style={styles.infoValue}>{nade.map_name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Категория</Text>
            <Text style={[styles.infoValue, { color: catMeta.color }]}>
              {catMeta.icon} {catMeta.label}
            </Text>
          </View>
        </View>

        {nade.description ? (
          <>
            <Text style={styles.sectionLabel}>КАК КИДАТЬ</Text>
            <Text style={styles.description}>{nade.description}</Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );

  /** Правая колонка: лента скриншотов с подписями */
  const renderShots = () => (
    <View style={[styles.shotsColumn, twoColumns && { width: columnWidth }]}>
      {images.length === 0 ? (
        <View style={styles.shotsEmpty}>
          <Text style={styles.shotsEmptyText}>Скриншотов нет</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.shotsScroll}
          contentContainerStyle={styles.shotsInner}
          showsVerticalScrollIndicator={false}
        >
          {images.map((img) => {
            const meta = IMAGE_TYPE_META[img.image_type] ?? IMAGE_TYPE_META.other;
            return (
              <TouchableOpacity
                key={img.id}
                activeOpacity={0.9}
                onPress={() => setLightbox(img)}
                style={styles.shotWrap}
              >
                <Image
                  source={{ uri: nadeImageUrl(img.image_url) }}
                  style={{ width: '100%', height: mediaHeight, backgroundColor: '#000' }}
                  resizeMode="cover"
                />
                <View style={styles.shotLabel}>
                  <Text style={styles.shotLabelText}>{meta.icon} {meta.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Клик по фону закрывает */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.content, { width: modalWidth, maxHeight: modalMaxHeight }]}>
          {twoColumns ? (
            <View style={styles.columns}>
              {renderMedia()}
              <View style={styles.divider} />
              {renderShots()}
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              {renderMedia()}
              {renderShots()}
            </ScrollView>
          )}
        </View>

        {/* Крестик поверх модалки, как на референсе */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Лайтбокс: скриншот на весь экран с зумом */}
      <Modal visible={!!lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setLightbox(null)} />
          {lightbox ? (
            <>
              <ImageZoomView
                source={{ uri: nadeImageUrl(lightbox.image_url) }}
                width={Math.min(width * 0.94, 1400)}
                height={Math.min(height * 0.8, Math.min(width * 0.94, 1400) * (9 / 16))}
              />
              <View style={styles.lightboxLabel}>
                <Text style={styles.shotLabelText}>
                  {(IMAGE_TYPE_META[lightbox.image_type] ?? IMAGE_TYPE_META.other).label}
                </Text>
              </View>
            </>
          ) : null}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setLightbox(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: {
    backgroundColor: '#151827', borderRadius: 14,
    borderWidth: 1, borderColor: '#242A40', overflow: 'hidden',
  },
  columns: { flexDirection: 'row', alignItems: 'stretch' },
  divider: { width: 1, backgroundColor: '#242A40' },

  // Левая колонка
  mediaColumn: { backgroundColor: '#101320' },
  noMedia: {
    width: '100%', backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  noMediaIcon: { fontSize: 44, opacity: 0.35 },
  noMediaText: { color: '#5B677D', fontSize: 13 },
  zoomHint: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  zoomHintText: { color: '#CBD5E1', fontSize: 11 },

  infoPanel: { backgroundColor: '#151827' },
  infoPanelInner: { padding: 18 },
  title: { color: '#F8FAFC', fontSize: 19, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  infoCell: { width: '50%', paddingRight: 12 },
  infoLabel: {
    color: '#748099', fontSize: 11, fontWeight: '700',
    letterSpacing: 0.6, marginBottom: 4, textTransform: 'uppercase',
  },
  infoValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  sectionLabel: {
    color: '#748099', fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    marginTop: 20, marginBottom: 8, textTransform: 'uppercase',
  },
  description: { color: '#D6DEEB', fontSize: 14, lineHeight: 21 },

  // Правая колонка
  shotsColumn: { backgroundColor: '#101320' },
  shotsScroll: { flexGrow: 0 },
  shotsInner: { padding: 10, gap: 10 },
  shotWrap: {
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#242A40',
  },
  shotLabel: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  shotLabelText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  shotsEmpty: { padding: 40, alignItems: 'center' },
  shotsEmptyText: { color: '#5B677D', fontSize: 13 },

  // Крестик
  closeBtn: {
    position: 'absolute', top: 24, right: 24,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(20,24,39,0.9)',
    borderWidth: 1, borderColor: '#303752',
    justifyContent: 'center', alignItems: 'center',
  },
  closeText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },

  // Лайтбокс
  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxLabel: {
    marginTop: 14, backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5,
  },
});
