import { Image } from 'expo-image';
import { Music } from 'lucide-react-native';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { documentUri } from '@/lib/usb/saf';
import { useAppStore } from '@/store';

export interface ArtworkProps {
  artworkId?: number;
  size?: number;
  className?: string;
}

/** Album art from the USB's artwork table, with a music-note fallback. */
export function Artwork({ artworkId, size = 48, className }: ArtworkProps) {
  const path = useAppStore((s) =>
    artworkId ? (s.library?.artworkPaths[artworkId] ?? null) : null,
  );
  const root = useAppStore((s) => s.usb.root);

  const uri = path && root ? documentUri(root, path) : null;

  return (
    <View
      className={cn('items-center justify-center overflow-hidden rounded-md bg-elevated', className)}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Music size={size * 0.45} color="#6a6a6a" />
      )}
    </View>
  );
}
