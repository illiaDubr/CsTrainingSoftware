import { useEffect, useRef, useState } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Text, ActivityIndicator, GestureResponderEvent,
} from 'react-native';
import { Nade } from '../../types';
import { nadeImageUrl } from '../../services/nadesService';
import { NADE_TYPE_META, SIDE_META } from './nadeMeta';

type Point = { x: number; y: number };
type PickStep = string;

export interface MapArrow {
  id?: string | number;
  from: Point;
  to: Point;
  color?: string;
  label?: string;
}

interface Props {
  backgroundUrl: string | null;
  loadingBackground?: boolean;
  /** Гранаты с проставленными точками — рисуются как маркеры (+ линия броска, если есть обе точки) */
  nades?: Nade[];
  onPinPress?: (nade: Nade) => void;
  /** Произвольные векторы движения (тактики/коллы) — линия + подпись, без привязки к гранате */
  arrows?: MapArrow[];
  /** Режим расстановки: произвольная строка-метка того, что выставляется следующим тапом. undefined/null — только просмотр */
  pickStep?: PickStep | null;
  /** Подсказка снизу под карту в режиме расстановки; если не задана — используется дефолт для 'throw'/'land' */
  pickHint?: string;
  throwPos?: Point | null;
  landPos?: Point | null;
  onPick?: (step: PickStep, pos: Point) => void;
  maxWidth?: number;
  emptyHint?: string;
}

const DEFAULT_RATIO = 1; // большинство радаров CS2 квадратные — до загрузки картинки используем как дефолт
const LINE_WIDTH = 3;

export function MapCanvas({
  backgroundUrl, loadingBackground, nades = [], onPinPress, arrows = [],
  pickStep, pickHint, throwPos, landPos, onPick, maxWidth = 700, emptyHint,
}: Props) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [containerWidth, setContainerWidth] = useState(maxWidth);
  // Фактические размеры поверхности карты. И тап, и маркеры считаются по ним —
  // иначе точка сохраняется в одной системе координат, а рисуется в другой
  const [surface, setSurface] = useState({ w: maxWidth, h: maxWidth });
  const surfaceRef = useRef<View>(null);

  const height = containerWidth / ratio;

  // Фактические размеры поверхности
  const boxW = surface.w || containerWidth;
  const boxH = surface.h || height;

  // Прямоугольник самой картинки внутри поверхности (resizeMode="contain").
  // Все координаты считаем относительно картинки, а не контейнера: тогда точки
  // не смещаются, даже если высота контейнера пересчитается после загрузки пропорций.
  const boxRatio = boxH > 0 ? boxW / boxH : 1;
  const imgW = boxRatio > ratio ? boxH * ratio : boxW;
  const imgH = boxRatio > ratio ? boxH : boxW / ratio;
  const offsetX = (boxW - imgW) / 2;
  const offsetY = (boxH - imgH) / 2;

  /** Относительная координата (0..1 по картинке) → пиксели внутри поверхности */
  const px = (x: number) => offsetX + x * imgW;
  const py = (y: number) => offsetY + y * imgH;

  // Реальные пропорции картинки. onLoad на вебе часто не отдаёт размеры,
  // поэтому берём их через Image.getSize — иначе контейнер получает неверную
  // высоту, картинка вписывается с полями и точки уезжают.
  useEffect(() => {
    if (!backgroundUrl) return;
    let cancelled = false;
    Image.getSize(
      nadeImageUrl(backgroundUrl),
      (w, h) => { if (!cancelled && w > 0 && h > 0) setRatio(w / h); },
      () => { /* не удалось — остаёмся на текущем соотношении */ },
    );
    return () => { cancelled = true; };
  }, [backgroundUrl]);

  const handleTap = (e: GestureResponderEvent) => {
    if (!pickStep || !onPick) return;

    // pageX/pageY + измерение самой поверхности: locationX на вебе считается
    // относительно элемента под курсором (картинки, маркера), а не контейнера,
    // из-за чего сохранённая точка не совпадала с отрисованной
    const { pageX, pageY, locationX, locationY } = e.nativeEvent;
    const node = surfaceRef.current as any;

    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((mx: number, my: number) => {
        // Начало координат — из измерения, размеры — прямоугольник картинки:
        // ровно то же, по чему рисуются маркеры
        if (!imgW || !imgH) return;
        const x = Math.max(0, Math.min(1, (pageX - mx - offsetX) / imgW));
        const y = Math.max(0, Math.min(1, (pageY - my - offsetY) / imgH));
        onPick(pickStep, { x, y });
      });
      return;
    }

    const x = Math.max(0, Math.min(1, (locationX - offsetX) / imgW));
    const y = Math.max(0, Math.min(1, (locationY - offsetY) / imgH));
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

  const renderLine = (from: Point, to: Point, color: string, label?: string) => {
    const dx = (to.x - from.x) * imgW;
    const dy = (to.y - from.y) * imgH;
    const length = Math.hypot(dx, dy);
    if (length < 1) return null;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const midX = px((from.x + to.x) / 2);
    const midY = py((from.y + to.y) / 2);
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
        {label ? (
          <View pointerEvents="none" style={[styles.arrowLabel, { left: midX, top: midY, borderColor: color }]}>
            <Text style={styles.arrowLabelText}>{label}</Text>
          </View>
        ) : null}
        <View
          pointerEvents="none"
          style={[
            styles.arrowHead,
            {
              left: px(to.x) - 6,
              top: py(to.y) - 6,
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
          // На вебе source может отсутствовать — тогда пропорции уже взяты через Image.getSize
          const source = (e?.nativeEvent as any)?.source;
          const w = source?.width;
          const h = source?.height;
          if (w > 0 && h > 0) setRatio(w / h);
        }}
      />

      {/* Произвольные векторы движения (тактики/коллы) */}
      {arrows.map((a, i) => {
        const color = a.color || '#3B82F6';
        return (
          <View key={a.id ?? i} pointerEvents="none" style={StyleSheet.absoluteFill}>
            {renderLine(a.from, a.to, color, a.label)}
            <View style={[styles.arrowStartDot, { left: px(a.from.x) - 6, top: py(a.from.y) - 6, backgroundColor: color }]} />
          </View>
        );
      })}

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
              // Точка броска кликабельна так же, как точка приземления — открывает ту же раскидку
              <TouchableOpacity
                style={[
                  styles.throwDot,
                  { left: px(n.throw_x!) - 10, top: py(n.throw_y!) - 10, borderColor: sideMeta.color },
                ]}
                onPress={() => onPinPress?.(n)}
                disabled={!onPinPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Text style={styles.throwDotIcon}>🧍</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.pin,
                { left: px(n.land_x) - 13, top: py(n.land_y) - 13, borderColor: sideMeta.color },
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
          style={[styles.throwDot, styles.pendingDot, { left: px(throwPos.x) - 12, top: py(throwPos.y) - 12 }]}
        >
          <Text style={styles.throwDotIcon}>🧍</Text>
        </View>
      ) : null}
      {landPos ? (
        <View
          pointerEvents="none"
          style={[styles.landDot, { left: px(landPos.x) - 9, top: py(landPos.y) - 9 }]}
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
          ref={surfaceRef}
          collapsable={false}
          style={{ width: '100%', height }}
          onLayout={(e) => {
            const { width, height: h } = e.nativeEvent.layout;
            setSurface((prev) => (prev.w === width && prev.h === h ? prev : { w: width, h }));
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTap}
        >
          {renderContent()}
        </View>
      ) : (
        <View
          ref={surfaceRef}
          collapsable={false}
          style={{ width: '100%', height }}
          onLayout={(e) => {
            const { width, height: h } = e.nativeEvent.layout;
            setSurface((prev) => (prev.w === width && prev.h === h ? prev : { w: width, h }));
          }}
        >
          {renderContent()}
        </View>
      )}

      {pickStep ? (
        <Text style={styles.pickHint}>
          {pickHint
            ?? (pickStep === 'throw'
              ? 'Нажми на карту — отметь, откуда кидают 🧍'
              : pickStep === 'land'
                ? 'Нажми на карту — отметь, куда прилетает 💨'
                : 'Нажми на карту, чтобы поставить точку')}
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
    backgroundColor: 'rgba(11,13,20,0.92)', borderWidth: 2, borderColor: '#0B0D14',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 3, elevation: 4,
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
  arrowStartDot: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#0B0D14',
  },
  arrowLabel: {
    position: 'absolute', marginLeft: -40, marginTop: -10, width: 80,
    backgroundColor: 'rgba(11,13,20,0.85)', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  arrowLabelText: { color: '#F8FAFC', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  pickHint: { color: '#748099', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
