import { Folder, ListMusic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { formatTrackCount } from '@/lib/format';
import type { PlaylistNode } from '@/types/library';
import { Text } from './ui/text';

export interface NodeRowProps {
  node: PlaylistNode;
  onPress: () => void;
}

/** A folder or playlist row in the library tree. */
export function NodeRow({ node, onPress }: NodeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
    >
      <View className="h-12 w-12 items-center justify-center rounded-md bg-elevated">
        {node.isFolder ? (
          <Folder size={22} color="#b3b3b3" />
        ) : (
          <ListMusic size={22} color="#1DB954" />
        )}
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-medium">
          {node.name}
        </Text>
        <Text variant="muted">
          {node.isFolder
            ? `${node.childIds.length} items`
            : formatTrackCount(node.trackIds.length)}
        </Text>
      </View>
    </Pressable>
  );
}
