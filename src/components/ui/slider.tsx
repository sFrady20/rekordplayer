import { useRef, useState } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

export interface SliderProps {
  /** 0..1 progress. */
  value: number;
  onSeek?: (fraction: number) => void;
  className?: string;
}

/** Minimal tap/drag seek bar. */
export function Slider({ value, onSeek, className }: SliderProps) {
  const width = useRef(0);
  const [dragging, setDragging] = useState<number | null>(null);

  const fraction = dragging ?? Math.min(1, Math.max(0, value));

  const fractionFromX = (x: number) =>
    width.current > 0 ? Math.min(1, Math.max(0, x / width.current)) : 0;

  return (
    <View
      className={cn('h-8 justify-center', className)}
      onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Don't let a parent (e.g. a scroll view) steal the gesture mid-drag.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => setDragging(fractionFromX(e.nativeEvent.locationX))}
      onResponderMove={(e) => setDragging(fractionFromX(e.nativeEvent.locationX))}
      onResponderRelease={(e) => {
        // Prefer the last dragged fraction; the release event's locationX is
        // unreliable when the finger lifted over a child view.
        onSeek?.(dragging ?? fractionFromX(e.nativeEvent.locationX));
        setDragging(null);
      }}
      onResponderTerminate={() => setDragging(null)}
    >
      {/* pointerEvents="none": children must never become the touch target,
          otherwise locationX is measured inside the child (e.g. the 12px
          thumb) and the computed fraction collapses to ~0. */}
      <View pointerEvents="none" className="h-1 overflow-hidden rounded-full bg-elevated">
        <View className="h-full rounded-full bg-primary" style={{ width: `${fraction * 100}%` }} />
      </View>
      <View
        pointerEvents="none"
        className="absolute h-3 w-3 rounded-full bg-foreground"
        style={{ left: `${fraction * 100}%`, marginLeft: -6 }}
      />
    </View>
  );
}
