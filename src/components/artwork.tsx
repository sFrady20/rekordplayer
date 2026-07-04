import { Image } from 'expo-image';
import { Music } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { documentUri } from '@/lib/usb/saf';
import { useAppStore } from '@/store';

/**
 * rekordbox exports small (~80px) covers, and — when "export higher
 * resolution artwork" is enabled — an additional large variant with an `_m`
 * suffix (e.g. a123_m.jpg). Remember which ids have no `_m` file so we only
 * pay the failed load once per session.
 */
const noHighRes = new Set<number>();

function highResPath(path: string): string {
  return path.replace(/\.(\w+)$/, '_m.$1');
}

/** Resolve the best content:// URI for an artwork id (null when absent). */
export function useArtworkUri(artworkId?: number, preferHighRes = false): string | null {
  const path = useAppStore((s) =>
    artworkId ? (s.library?.artworkPaths[artworkId] ?? null) : null,
  );
  const root = useAppStore((s) => s.usb.root);
  const [failedHighRes, setFailedHighRes] = useState(false);

  useEffect(() => setFailedHighRes(false), [artworkId]);

  if (!path || !root) return null;
  const useHighRes = preferHighRes && !failedHighRes && !noHighRes.has(artworkId!);
  return documentUri(root, useHighRes ? highResPath(path) : path);
}

export interface ArtworkProps {
  artworkId?: number;
  size?: number;
  /** Try the `_m` high-res export first (use for large surfaces). */
  preferHighRes?: boolean;
  className?: string;
}

/** Album art from the USB's artwork table, with a music-note fallback. */
export function Artwork({ artworkId, size = 48, preferHighRes = false, className }: ArtworkProps) {
  const path = useAppStore((s) =>
    artworkId ? (s.library?.artworkPaths[artworkId] ?? null) : null,
  );
  const root = useAppStore((s) => s.usb.root);
  const [failedHighRes, setFailedHighRes] = useState(false);

  useEffect(() => setFailedHighRes(false), [artworkId]);

  const wantHighRes =
    preferHighRes && !failedHighRes && artworkId != null && !noHighRes.has(artworkId);
  const uri =
    path && root ? documentUri(root, wantHighRes ? highResPath(path) : path) : null;

  return (
    <View
      className={cn('items-center justify-center overflow-hidden rounded-md bg-elevated', className)}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={preferHighRes ? 180 : 0}
          onError={() => {
            // No _m variant on this stick: remember and fall back to standard.
            if (wantHighRes && artworkId != null) {
              noHighRes.add(artworkId);
              setFailedHighRes(true);
            }
          }}
        />
      ) : (
        <Music size={size * 0.45} color="#6a6a6a" />
      )}
    </View>
  );
}
