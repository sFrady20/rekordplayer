import { useRouter } from 'expo-router';
import { ChevronDown, Pause, Play, Shuffle, SkipBack, SkipForward, Unplug } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Artwork } from '@/components/artwork';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { next, previous, seekTo, toggle, toggleShuffle } from '@/lib/audio/player';
import { formatDuration } from '@/lib/format';
import { useEject } from '@/lib/usb/useEject';
import { useAppStore, useCurrentTrack } from '@/store';

export default function PlayerScreen() {
  const router = useRouter();
  const eject = useEject();
  const track = useCurrentTrack();
  const status = useAppStore((s) => s.player.status);
  const position = useAppStore((s) => s.player.positionSec);
  const duration = useAppStore((s) => s.player.durationSec);
  const queueSource = useAppStore((s) => s.player.queueSource);
  const shuffle = useAppStore((s) => s.player.shuffle);

  if (!track) {
    router.back();
    return null;
  }

  const effectiveDuration = duration > 0 ? duration : track.durationSec;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between py-3">
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ChevronDown size={26} color="#ffffff" />
          </Pressable>
          <Text variant="caption" className="uppercase tracking-widest">
            {queueSource || 'Now playing'}
          </Text>
          <Pressable hitSlop={8} onPress={eject}>
            <Unplug size={24} color="#e5484d" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center py-6">
          <Artwork artworkId={track.artworkId} size={320} className="rounded-xl" />
        </View>

        <View className="gap-1 pb-2">
          <Text variant="title" numberOfLines={2}>
            {track.title}
          </Text>
          <Text variant="muted" numberOfLines={1}>
            {track.artist || 'Unknown artist'}
            {track.album ? ` — ${track.album}` : ''}
          </Text>
          <View className="flex-row gap-2 pt-2">
            {track.bpm > 0 && <Badge variant="primary" label={`${track.bpm.toFixed(0)} BPM`} />}
            {track.key !== '' && <Badge label={track.key} />}
            {track.year > 0 && <Badge label={String(track.year)} />}
          </View>
        </View>

        <View className="pb-2">
          <Slider
            value={effectiveDuration > 0 ? position / effectiveDuration : 0}
            onSeek={(fraction) => seekTo(fraction * effectiveDuration)}
          />
          <View className="flex-row justify-between">
            <Text variant="caption">{formatDuration(position)}</Text>
            <Text variant="caption">{formatDuration(effectiveDuration)}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-8 pb-8 pt-2">
          <Pressable hitSlop={12} onPress={toggleShuffle} className="items-center">
            <Shuffle size={24} color={shuffle ? '#1DB954' : '#6a6a6a'} />
            {shuffle && <View className="mt-1 h-1 w-1 rounded-full bg-primary" />}
          </Pressable>
          <Pressable hitSlop={12} onPress={previous}>
            <SkipBack size={34} color="#ffffff" fill="#ffffff" />
          </Pressable>
          <Pressable
            onPress={toggle}
            className="h-18 w-18 items-center justify-center rounded-full bg-foreground"
            style={{ width: 72, height: 72 }}
          >
            {status === 'playing' ? (
              <Pause size={32} color="#121212" fill="#121212" />
            ) : (
              <Play size={32} color="#121212" fill="#121212" style={{ marginLeft: 3 }} />
            )}
          </Pressable>
          <Pressable hitSlop={12} onPress={next}>
            <SkipForward size={34} color="#ffffff" fill="#ffffff" />
          </Pressable>
          {/* spacer mirroring the shuffle button, keeps play centered */}
          <View style={{ width: 24 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}
