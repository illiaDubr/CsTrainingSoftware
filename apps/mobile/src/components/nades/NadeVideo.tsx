import { createElement } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';

/**
 * Встроенный плеер видео-гайда раскидки.
 *
 * web    — нативный <video> (react-native-web рендерит через react-dom, поэтому DOM-тег работает)
 * native — expo-video, если пакет установлен; иначе кнопка «Открыть видео» как фолбэк,
 *          чтобы сборка не падала, пока пакет не добавлен (`npx expo install expo-video`).
 */

let ExpoVideo: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ExpoVideo = require('expo-video');
  } catch {
    ExpoVideo = null;
  }
}

/** Нативный плеер на expo-video. Создаётся один раз, поэтому хуки внутри безопасны. */
const NativeExpoVideo = ExpoVideo
  ? ({ uri, height }: { uri: string; height: number }) => {
      const player = ExpoVideo.useVideoPlayer(uri, (p: any) => {
        p.loop = true;
        p.muted = true;
      });
      return (
        <ExpoVideo.VideoView
          player={player}
          style={{ width: '100%', height, backgroundColor: '#000' }}
          contentFit="contain"
          nativeControls
          allowsFullscreen
        />
      );
    }
  : null;

interface Props {
  uri: string;
  height: number;
  /** Постер — первый скриншот, показывается до старта воспроизведения (только web) */
  poster?: string;
}

export function NadeVideo({ uri, height, poster }: Props) {
  if (Platform.OS === 'web') {
    return createElement('video', {
      src: uri,
      poster,
      controls: true,
      loop: true,
      playsInline: true,
      preload: 'metadata',
      style: {
        width: '100%',
        height,
        backgroundColor: '#000',
        objectFit: 'contain',
        display: 'block',
      },
    });
  }

  if (NativeExpoVideo) {
    return <NativeExpoVideo uri={uri} height={height} />;
  }

  // Фолбэк: expo-video ещё не установлен в нативной сборке
  return (
    <View style={[styles.fallback, { height }]}>
      <Text style={styles.fallbackIcon}>▶</Text>
      <Text style={styles.fallbackText}>Видео-гайд</Text>
      <TouchableOpacity style={styles.fallbackBtn} onPress={() => Linking.openURL(uri)} activeOpacity={0.85}>
        <Text style={styles.fallbackBtnText}>Открыть видео</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    width: '100%', backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  fallbackIcon: { color: '#F8FAFC', fontSize: 34 },
  fallbackText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  fallbackBtn: {
    marginTop: 4, borderWidth: 1, borderColor: '#F59E0B', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  fallbackBtnText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },
});
