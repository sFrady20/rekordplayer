import { Redirect } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { TrackRow } from '@/components/track-row';
import { Text } from '@/components/ui/text';
import { playQueue } from '@/lib/audio/player';
import { useAppStore } from '@/store';

export default function AllTracksScreen() {
  const library = useAppStore((s) => s.library);
  const currentTrackId = useAppStore(
    (s) => s.player.queue[s.player.queueIndex] ?? null,
  );
  const [query, setQuery] = useState('');

  const trackIds = useMemo(() => {
    if (!library) return [];
    const q = query.trim().toLowerCase();
    if (!q) return library.allTrackIds;
    return library.allTrackIds.filter((id) => {
      const t = library.tracks[id];
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    });
  }, [library, query]);

  if (!library) return <Redirect href="/" />;

  return (
    <View className="flex-1 bg-background">
      <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-lg bg-surface px-3">
        <Search size={18} color="#6a6a6a" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, artist, album"
          placeholderTextColor="#6a6a6a"
          className="h-11 flex-1 text-base text-foreground"
        />
        {query.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <X size={18} color="#6a6a6a" />
          </Pressable>
        )}
      </View>
      <FlatList
        data={trackIds}
        keyExtractor={(id) => String(id)}
        renderItem={({ item: id, index }) => (
          <TrackRow
            track={library.tracks[id]}
            active={id === currentTrackId}
            onPress={() => playQueue(trackIds, index, query ? 'Search' : 'All Tracks')}
          />
        )}
        ListEmptyComponent={
          <Text variant="muted" className="px-4 py-8 text-center">
            No tracks match.
          </Text>
        }
        keyboardShouldPersistTaps="handled"
      />
      <NowPlayingBar />
    </View>
  );
}
