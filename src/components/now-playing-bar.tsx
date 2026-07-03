import { useRouter } from 'expo-router';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { next, toggle } from '@/lib/audio/player';
import { useAppStore, useCurrentTrack } from '@/store';
import { Artwork } from './artwork';
import { Text } from './ui/text';

/** Mini player pinned above the bottom of library screens. */
export function NowPlayingBar() {
  const router = useRouter();
  const track = useCurrentTrack();
  const status = useAppStore((s) => s.player.status);
  const position = useAppStore((s) => s.player.positionSec);
  const duration = useAppStore((s) => s.player.durationSec);

  if (!track) return null;

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <Pressable
      onPress={() => router.push('/player')}
      className="mx-2 mb-2 overflow-hidden rounded-lg bg-elevated"
    >
      <View className="flex-row items-center gap-3 p-2 pr-3">
        <Artwork artworkId={track.artworkId} size={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold">
            {track.title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {track.artist || 'Unknown artist'}
          </Text>
        </View>
        <Pressable hitSlop={8} onPress={toggle} className="p-1">
          {status === 'playing' ? (
            <Pause size={24} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={24} color="#ffffff" fill="#ffffff" />
          )}
        </Pressable>
        <Pressable hitSlop={8} onPress={next} className="p-1">
          <SkipForward size={22} color="#b3b3b3" fill="#b3b3b3" />
        </Pressable>
      </View>
      <View className="h-0.5 bg-surface">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </Pressable>
  );
}
