import { useRef, useState } from 'react';
import {
  View, Image, StyleSheet, PanResponder, TouchableOpacity, Text, ImageSourcePropType,
} from 'react-native';

interface Props {
  source: ImageSourcePropType;
  width: number;
  height: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_DELAY = 280;

const dist = (touches: any[]) => {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

/**
 * Лёгкий zoom-viewer без внешних зависимостей: pinch (2 пальца), драг при увеличении,
 * двойной тап для быстрого зума, плюс кнопки +/− для мыши/веба.
 */
export function ImageZoomView({ source, width, height }: Props) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const gestureState = useRef({
    startScale: 1,
    startDist: 0,
    startTranslate: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    lastTapTime: 0,
    mode: 'none' as 'none' | 'pinch' | 'pan',
  });

  const clampTranslate = (t: { x: number; y: number }, s: number) => {
    const maxX = Math.max(0, (width * s - width) / 2);
    const maxY = Math.max(0, (height * s - height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
    };
  };

  const setZoom = (s: number, center?: { x: number; y: number }) => {
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
    setScale(next);
    if (next <= 1.02) {
      setTranslate({ x: 0, y: 0 });
    } else if (center) {
      setTranslate((prev) => clampTranslate(prev, next));
    }
  };

  const toggleDoubleTapZoom = () => {
    if (scale > 1.05) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_ZOOM);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        const now = Date.now();

        if (touches.length === 2) {
          gestureState.current.mode = 'pinch';
          gestureState.current.startDist = dist(touches);
          gestureState.current.startScale = scale;
        } else {
          // двойной тап
          if (now - gestureState.current.lastTapTime < DOUBLE_TAP_DELAY) {
            toggleDoubleTapZoom();
            gestureState.current.lastTapTime = 0;
            gestureState.current.mode = 'none';
            return;
          }
          gestureState.current.lastTapTime = now;
          gestureState.current.mode = scale > 1.02 ? 'pan' : 'none';
          gestureState.current.startTranslate = translate;
        }
      },

      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          if (gestureState.current.mode !== 'pinch') {
            gestureState.current.mode = 'pinch';
            gestureState.current.startDist = dist(touches);
            gestureState.current.startScale = scale;
          }
          const d = dist(touches);
          const ratio = gestureState.current.startDist > 0 ? d / gestureState.current.startDist : 1;
          setZoom(gestureState.current.startScale * ratio, { x: 0, y: 0 });
        } else if (gestureState.current.mode === 'pan') {
          setTranslate(clampTranslate(
            { x: gestureState.current.startTranslate.x + g.dx, y: gestureState.current.startTranslate.y + g.dy },
            scale,
          ));
        }
      },

      onPanResponderRelease: () => {
        gestureState.current.mode = 'none';
        if (scale < MIN_SCALE + 0.02) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
      },
    })
  ).current;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <View style={{ width, height, overflow: 'hidden' }} {...panResponder.panHandlers}>
        <Image
          source={source}
          style={{
            width, height,
            transform: [{ translateX: translate.x }, { translateY: translate.y }, { scale }],
          }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(scale - 0.6)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.zoomResetText}>{Math.round(scale * 100)}%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(scale + 0.6)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#10131E' },
  controls: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 4,
  },
  zoomBtn: {
    minWidth: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  zoomBtnText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  zoomResetText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
});
