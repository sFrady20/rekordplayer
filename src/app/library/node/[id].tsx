import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Shuffle } from 'lucide-react-native';
import { FlatList, View } from 'react-native';
import { NodeRow } from '@/components/node-row';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { TrackRow } from '@/components/track-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { playQueue, playQueueShuffled } from '@/lib/audio/player';
import { useAppStore } from '@/store';

/** A folder (children) or playlist (ordered tracks) in the tree. */
export default function NodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const library = useAppStore((s) => s.library);
  const currentTrackId = useAppStore(
    (s) => s.player.queue[s.player.queueIndex] ?? null,
  );

  // After eject/unplug the library is gone — bounce home instead of showing
  // a dead page with an empty title.
  if (!library) return <Redirect href="/" />;
  const node = library.playlistNodes[Number(id)];
  if (!node) return <Redirect href="/library" />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: node.name }} />
      {node.isFolder ? (
        <FlatList
          data={node.childIds.map((cid) => library.playlistNodes[cid]).filter(Boolean)}
          keyExtractor={(child) => String(child.id)}
          renderItem={({ item }) => (
            <NodeRow node={item} onPress={() => router.push(`/library/node/${item.id}`)} />
          )}
        />
      ) : (
        <FlatList
          data={node.trackIds.map((tid) => library.tracks[tid]).filter(Boolean)}
          keyExtractor={(track, index) => `${track.id}-${index}`}
          ListHeaderComponent={
            node.trackIds.length > 0 ? (
              <View className="flex-row px-4 pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => playQueueShuffled(node.trackIds, node.name)}
                >
                  <Shuffle size={16} color="#1DB954" />
                  <Text className="text-sm font-semibold">Shuffle</Text>
                </Button>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <TrackRow
              track={item}
              active={item.id === currentTrackId}
              onPress={() => playQueue(node.trackIds, index, node.name)}
            />
          )}
          ListEmptyComponent={
            <Text variant="muted" className="px-4 py-8 text-center">
              This playlist is empty.
            </Text>
          }
        />
      )}
      <NowPlayingBar />
    </View>
  );
}
