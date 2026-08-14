import { useState } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, ActivityIndicator,
} from 'react-native';
import { Nade } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { NADE_TYPE_META, SIDE_META } from './nadeMeta';

interface Props {
  backgroundUrl: string | null;
  loadingBackground?: boolean;
  /** Гранаты с проставленной позицией — рисуются как маркеры */
  nades?: Nade[];
  onPinPress?: (nade: Nade) => void;
  /** Режим расстановки: тап по карте задаёт новую точку */
  pickable?: boolean;
  pendingPos?: { x: number; y: number } | null;
  onPick?: (pos: { x: number; y: number }) => void;
  maxWidth?: number;
  emptyHint?: string;
}

const DEFAULT_RATIO = 1; // большинство радаров CS2 квадратные — до загрузки картинки используем как дефолт

export function MapCanvas({
  backgroundUrl, loadingBackground, nades = [], onPinPress,
  pickable, pendingPos, onPick, maxWidth = 700, emptyHint,
}: Props) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [containerWidth, setContainerWidth] = useState(maxWidth);

  const handleTap = (e: GestureResponderEvent) => {
    if (!pickable || !onPick) return;
    const { locationX, locationY } = e.nativeEvent;
    const height = containerWidth / ratio;
    const x = Math.max(0, Math.min(1, locationX / containerWidth));
    const y = Math.max(0, Math.min(1, locationY / height));
    onPick({ x, y });
  };

  if (loadingBackground) {
    return (
      <View style={[styles.empty, { width: '100%', maxWidth }]}>
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  if (!backgroundUrl) {
    return (
      <View style={[styles.empty, { width: '100%', maxWidth }]}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyText}>{emptyHint || 'Фон карты ещё не загружен'}</Text>
      </View>
    );
  }

  const height = containerWidth / ratio;

  return (
    <View
      style={[styles.container, { maxWidth }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <TouchableOpacity
        activeOpacity={pickable ? 0.9 : 1}
        onPress={handleTap}
        disabled={!pickable}
        style={{ width: '100%', height }}
      >
        <Image
          source={{ uri: nadeImageUrl(backgroundUrl) }}
          style={{ width: '100%', height }}
          resizeMode="contain"
          onLoad={(e) => {
            const { width: w, height: h } = e.nativeEvent.source;
            if (w > 0 && h > 0) setRatio(w / h);
          }}
        />

        {nades.filter(n => n.pos_x != null && n.pos_y != null).map((n) => {
          const sideMeta = SIDE_META[n.side];
          const typeMeta = NADE_TYPE_META[n.nade_type];
          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.pin,
                { left: `${(n.pos_x! * 100)}%`, top: `${(n.pos_y! * 100)}%`, borderColor: sideMeta.color },
              ]}
              onPress={() => onPinPress?.(n)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.pinIcon}>{typeMeta.icon}</Text>
            </TouchableOpacity>
          );
        })}

        {pendingPos ? (
          <View
            pointerEvents="none"
            style={[styles.pendingPin, { left: `${pendingPos.x * 100}%`, top: `${pendingPos.y * 100}%` }]}
          >
            <View style={styles.pendingPinDot} />
          </View>
        ) : null}
      </TouchableOpacity>

      {pickable ? (
        <Text style={styles.pickHint}>Нажми на карту, чтобы поставить точку броска</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'center' },
  empty: {
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, backgroundColor: '#151827', borderRadius: 16,
    borderWidth: 1, borderColor: '#242A40', borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 32, marginBottom: 8, opacity: 0.6 },
  emptyText: { color: '#748099', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  pin: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    marginLeft: -13, marginTop: -13,
    backgroundColor: 'rgba(11,13,20,0.9)', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 3, elevation: 4,
  },
  pinIcon: { fontSize: 12 },
  pendingPin: {
    position: 'absolute', width: 30, height: 30, marginLeft: -15, marginTop: -15,
    justifyContent: 'center', alignItems: 'center',
  },
  pendingPinDot: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#f59e0b',
    borderWidth: 3, borderColor: '#0B0D14',
  },
  pickHint: { color: '#748099', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
