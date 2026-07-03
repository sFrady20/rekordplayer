import { useRouter } from 'expo-router';
import { FolderTree, Music2, RefreshCw, Unplug } from 'lucide-react-native';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { NodeRow } from '@/components/node-row';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { Text } from '@/components/ui/text';
import { formatTrackCount } from '@/lib/format';
import { connectUsb, ejectUsb } from '@/lib/usb/scan';
import { useAppStore } from '@/store';

export default function LibraryScreen() {
  const router = useRouter();
  const library = useAppStore((s) => s.library);

  const confirmEject = () => {
    Alert.alert(
      'Eject USB',
      'Playback will stop and the library will close. Finish by tapping the eject button next to the drive in the Storage settings screen that opens.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Eject',
          style: 'destructive',
          onPress: async () => {
            // Clear state before mounting the connect screen — it auto-reconnects
            // on mount, which would bounce straight back here otherwise.
            await ejectUsb();
            router.replace('/');
          },
        },
      ],
    );
  };

  if (!library) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="muted">No library loaded.</Text>
      </View>
    );
  }

  const rootNodes = library.rootNodeIds
    .map((id) => library.playlistNodes[id])
    .filter(Boolean);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={rootNodes}
        keyExtractor={(node) => String(node.id)}
        ListHeaderComponent={
          <View className="pb-2">
            <Pressable
              onPress={() => router.push('/library/tracks')}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
            >
              <View className="h-12 w-12 items-center justify-center rounded-md bg-primary/15">
                <Music2 size={22} color="#1DB954" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">All Tracks</Text>
                <Text variant="muted">{formatTrackCount(library.allTrackIds.length)}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/library/files')}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
            >
              <View className="h-12 w-12 items-center justify-center rounded-md bg-elevated">
                <FolderTree size={22} color="#b3b3b3" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">Browse Files</Text>
                <Text variant="muted">Full folder tree on the USB</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={connectUsb}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
            >
              <View className="h-12 w-12 items-center justify-center rounded-md bg-elevated">
                <RefreshCw size={22} color="#b3b3b3" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">Change USB</Text>
                <Text variant="muted">Pick a different drive</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={confirmEject}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
            >
              <View className="h-12 w-12 items-center justify-center rounded-md bg-elevated">
                <Unplug size={22} color="#e5484d" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">Eject USB</Text>
                <Text variant="muted">Stop playback and safely remove</Text>
              </View>
            </Pressable>
            <Text variant="heading" className="px-4 pb-1 pt-4">
              Playlists
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <NodeRow node={item} onPress={() => router.push(`/library/node/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Text variant="muted" className="px-4 py-8 text-center">
            No playlists on this USB.
          </Text>
        }
      />
      <NowPlayingBar />
    </View>
  );
}
