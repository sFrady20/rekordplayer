import { Pressable } from 'react-native';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import type { Track } from '@/types/library';
import { Artwork } from './artwork';
import { Text } from './ui/text';

export interface TrackRowProps {
  track: Track;
  active?: boolean;
  onPress: () => void;
}

export function TrackRow({ track, active, onPress }: TrackRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-2 active:bg-surface"
    >
      <Artwork artworkId={track.artworkId} size={48} />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className={cn('text-base font-medium', active && 'text-primary')}
        >
          {track.title}
        </Text>
        <Text variant="muted" numberOfLines={1}>
          {track.artist || 'Unknown artist'}
          {track.bpm > 0 ? `  ·  ${track.bpm.toFixed(0)} BPM` : ''}
          {track.key ? `  ·  ${track.key}` : ''}
        </Text>
      </View>
      <Text variant="caption">{formatDuration(track.durationSec)}</Text>
    </Pressable>
  );
}
