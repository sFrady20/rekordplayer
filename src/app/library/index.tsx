import { Redirect, Stack, useFocusEffect, useRouter } from 'expo-router';
import { Music2, Unplug } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { NodeRow } from '@/components/node-row';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { Text } from '@/components/ui/text';
import { formatTrackCount } from '@/lib/format';
import { verifyUsbAlive } from '@/lib/usb/scan';
import { useEject } from '@/lib/usb/useEject';
import { useAppStore } from '@/store';

export default function LibraryScreen() {
  const router = useRouter();
  const library = useAppStore((s) => s.library);
  const eject = useEject();

  // If the drive was yanked without ejecting, reset back to the connect screen.
  useFocusEffect(
    useCallback(() => {
      verifyUsbAlive();
    }, []),
  );

  if (!library) return <Redirect href="/" />;

  const rootNodes = library.rootNodeIds
    .map((id) => library.playlistNodes[id])
    .filter(Boolean);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable hitSlop={10} onPress={eject} className="p-1">
              <Unplug size={20} color="#e5484d" />
            </Pressable>
          ),
        }}
      />
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
