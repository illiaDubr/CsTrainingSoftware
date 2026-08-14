import { useRef, useState } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Text, ActivityIndicator, GestureResponderEvent,
} from 'react-native';
import { Nade } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { NADE_TYPE_META, SIDE_META } from './nadeMeta';

type Point = { x: number; y: number };
type PickStep = 'throw' | 'land';

interface Props {
  backgroundUrl: string | null;
  loadingBackground?: boolean;
  /** Гранаты с проставленными точками — рисуются как маркеры (+ линия броска, если есть обе точки) */
  nades?: Nade[];
  onPinPress?: (nade: Nade) => void;
  /** Режим расстановки: какая точка выставляется следующим тапом. undefined/null — только просмотр */
  pickStep?: PickStep | null;
  throwPos?: Point | null;
  landPos?: Point | null;
  onPick?: (step: PickStep, pos: Point) => void;
  maxWidth?: number;
  emptyHint?: string;
}

const DEFAULT_RATIO = 1; // большинство радаров CS2 квадратные — до загрузки картинки используем как дефолт
const LINE_WIDTH = 3;

export function MapCanvas({
  backgroundUrl, loadingBackground, nades = [], onPinPress,
  pickStep, throwPos, landPos, onPick, maxWidth = 700, emptyHint,
}: Props) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [containerWidth, setContainerWidth] = useState(maxWidth);
  const layoutRef = useRef({ width: maxWidth, height: maxWidth });

  const height = containerWidth / ratio;
  layoutRef.current = { width: containerWidth, height };

  const handleTap = (e: GestureResponderEvent) => {
    if (!pickStep || !onPick) return;
    const { locationX, locationY } = e.nativeEvent;
    const { width: w, height: h } = layoutRef.current;
    const x = Math.max(0, Math.min(1, locationX / w));
    const y = Math.max(0, Math.min(1, locationY / h));
    onPick(pickStep, { x, y });
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

  const renderLine = (from: Point, to: Point, color: string) => {
    const dx = (to.x - from.x) * containerWidth;
    const dy = (to.y - from.y) * height;
    const length = Math.hypot(dx, dy);
    if (length < 1) return null;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const midX = ((from.x + to.x) / 2) * containerWidth;
    const midY = ((from.y + to.y) / 2) * height;
    const arrowAngle = angle + 90;

    return (
      <>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: midX - length / 2,
            top: midY - LINE_WIDTH / 2,
            width: length,
            height: LINE_WIDTH,
            backgroundColor: color,
            opacity: 0.85,
            borderRadius: LINE_WIDTH / 2,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
        <View
          pointerEvents="none"
          style={[
            styles.arrowHead,
            {
              left: to.x * containerWidth - 6,
              top: to.y * height - 6,
              borderBottomColor: color,
              transform: [{ rotate: `${arrowAngle}deg` }],
            },
          ]}
        />
      </>
    );
  };

  const renderContent = () => (
    <>
      <Image
        source={{ uri: nadeImageUrl(backgroundUrl) }}
        style={{ width: '100%', height }}
        resizeMode="contain"
        onLoad={(e) => {
          const { width: w, height: h } = e.nativeEvent.source;
          if (w > 0 && h > 0) setRatio(w / h);
        }}
      />

      {/* Маркеры существующих раскидок (режим просмотра) */}
      {nades.map((n) => {
        if (n.land_x == null || n.land_y == null) return null;
        const sideMeta = SIDE_META[n.side];
        const typeMeta = NADE_TYPE_META[n.nade_type];
        const hasThrow = n.throw_x != null && n.throw_y != null;
        return (
          <View key={n.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {hasThrow ? renderLine({ x: n.throw_x!, y: n.throw_y! }, { x: n.land_x, y: n.land_y }, sideMeta.color) : null}
            {hasThrow ? (
              <View
                pointerEvents="none"
                style={[styles.throwDot, { left: n.throw_x! * containerWidth - 6, top: n.throw_y! * height - 6 }]}
              >
                <Text style={styles.throwDotIcon}>🧍</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[
                styles.pin,
                { left: n.land_x * containerWidth - 13, top: n.land_y * height - 13, borderColor: sideMeta.color },
              ]}
              onPress={() => onPinPress?.(n)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.pinIcon}>{typeMeta.icon}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Точки, которые сейчас расставляет тренер */}
      {throwPos && landPos ? renderLine(throwPos, landPos, '#f59e0b') : null}
      {throwPos ? (
        <View
          pointerEvents="none"
          style={[styles.throwDot, styles.pendingDot, { left: throwPos.x * containerWidth - 8, top: throwPos.y * height - 8 }]}
        >
          <Text style={styles.throwDotIcon}>🧍</Text>
        </View>
      ) : null}
      {landPos ? (
        <View
          pointerEvents="none"
          style={[styles.landDot, { left: landPos.x * containerWidth - 9, top: landPos.y * height - 9 }]}
        />
      ) : null}
    </>
  );

  return (
    <View
      style={[styles.container, { maxWidth }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {pickStep ? (
        <View
          style={{ width: '100%', height }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTap}
        >
          {renderContent()}
        </View>
      ) : (
        <View style={{ width: '100%', height }}>
          {renderContent()}
        </View>
      )}

      {pickStep ? (
        <Text style={styles.pickHint}>
          {pickStep === 'throw' ? 'Нажми на карту — отметь, откуда кидают 🧍' : 'Нажми на карту — отметь, куда прилетает 💨'}
        </Text>
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
    backgroundColor: 'rgba(11,13,20,0.92)', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 3, elevation: 4,
  },
  pinIcon: { fontSize: 12 },
  throwDot: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.9)', borderWidth: 2, borderColor: '#0B0D14',
    justifyContent: 'center', alignItems: 'center',
  },
  throwDotIcon: { fontSize: 10 },
  pendingDot: { width: 24, height: 24, borderRadius: 12 },
  landDot: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#f59e0b', borderWidth: 3, borderColor: '#0B0D14',
  },
  arrowHead: {
    position: 'absolute', width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  pickHint: { color: '#748099', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
