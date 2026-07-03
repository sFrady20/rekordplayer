import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FileMusic, File as FileIcon, Folder } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { Text } from '@/components/ui/text';
import { playQueue } from '@/lib/audio/player';
import { listDirectory, TreeEntry } from '@/lib/usb/saf';
import { useAppStore } from '@/store';

const AUDIO_EXT = /\.(mp3|m4a|aac|wav|aiff?|flac|ogg)$/i;

/** Raw folder-tree browser over the granted USB root. */
export default function FilesScreen() {
  const { uri, name } = useLocalSearchParams<{ uri?: string; name?: string }>();
  const router = useRouter();
  const root = useAppStore((s) => s.usb.root);
  const library = useAppStore((s) => s.library);
  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirUri = uri ?? root?.treeUri;

  useEffect(() => {
    if (!dirUri) return;
    setEntries(null);
    listDirectory(dirUri)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [dirUri]);

  const playFile = (entry: TreeEntry) => {
    // Find the library track whose pdb path matches this file, so playback
    // flows through the normal queue with metadata.
    const track = Object.values(library?.tracks ?? {}).find((t) =>
      decodeURIComponent(entry.uri).endsWith(t.filePath),
    );
    if (track) playQueue([track.id], 0, 'Files');
    else Alert.alert('Not in library', 'This file is not part of the rekordbox library.');
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: name ?? 'Files' }} />
      {error ? (
        <Text variant="muted" className="px-4 py-8 text-center">
          {error}
        </Text>
      ) : entries == null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => entry.uri}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                item.isDirectory
                  ? router.push({
                      pathname: '/library/files',
                      params: { uri: item.uri, name: item.name },
                    })
                  : AUDIO_EXT.test(item.name)
                    ? playFile(item)
                    : undefined
              }
              className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
            >
              {item.isDirectory ? (
                <Folder size={20} color="#b3b3b3" />
              ) : AUDIO_EXT.test(item.name) ? (
                <FileMusic size={20} color="#1DB954" />
              ) : (
                <FileIcon size={20} color="#6a6a6a" />
              )}
              <Text numberOfLines={1} className="flex-1 text-base">
                {item.name}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text variant="muted" className="px-4 py-8 text-center">
              Empty folder.
            </Text>
          }
        />
      )}
      <NowPlayingBar />
    </View>
  );
}
