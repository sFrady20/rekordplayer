import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface BlobSpec {
  id: string;
  color: string;
  opacity: number;
  /** Diameter as a fraction of screen width. */
  size: number;
  /** Center start position as fractions of the screen. */
  x: number;
  y: number;
  /** Drift amplitude in px. */
  dx: number;
  dy: number;
  /** One back-and-forth cycle, ms. */
  duration: number;
}

const BLOBS: BlobSpec[] = [
  { id: 'a', color: '#1DB954', opacity: 0.32, size: 1.5, x: 0.12, y: 0.16, dx: 55, dy: 70, duration: 11000 },
  { id: 'b', color: '#14b8a6', opacity: 0.2, size: 1.15, x: 0.92, y: 0.34, dx: -65, dy: 45, duration: 14000 },
  { id: 'c', color: '#0a8a43', opacity: 0.26, size: 1.7, x: 0.5, y: 0.98, dx: 40, dy: -60, duration: 17000 },
  { id: 'd', color: '#4ade80', opacity: 0.12, size: 0.9, x: 0.78, y: 0.04, dx: -40, dy: 55, duration: 12500 },
];

/** A soft radial-gradient circle — the building block of the aurora. */
export function GradientBlob({
  id,
  color,
  opacity,
  sizePx,
}: {
  id: string;
  color: string;
  opacity: number;
  sizePx: number;
}) {
  return (
    <Svg width={sizePx} height={sizePx}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.45} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={sizePx / 2} cy={sizePx / 2} r={sizePx / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

function DriftingBlob({ spec, screenW, screenH }: { spec: BlobSpec; screenW: number; screenH: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true, // reverse: drift out and back forever
    );
  }, [spec.duration, t]);

  const sizePx = spec.size * screenW;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: spec.x * screenW - sizePx / 2 + t.value * spec.dx },
      { translateY: spec.y * screenH - sizePx / 2 + t.value * spec.dy },
      { scale: 1 + t.value * 0.12 },
    ],
  }));

  return (
    <Animated.View style={[styles.blob, style]}>
      <GradientBlob id={spec.id} color={spec.color} opacity={spec.opacity} sizePx={sizePx} />
    </Animated.View>
  );
}

/**
 * Slowly drifting mesh-gradient aurora. Pure transforms on four SVG radial
 * gradients, so it stays on the UI thread and costs almost nothing.
 */
export function AuroraBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={styles.container}>
      {BLOBS.map((spec) => (
        <DriftingBlob key={spec.id} spec={spec} screenW={width} screenH={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
