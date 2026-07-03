export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  key: string;
  /** Duration in whole seconds. */
  durationSec: number;
  /** Beats per minute (already divided from the pdb's BPM*100). */
  bpm: number;
  rating: number;
  year: number;
  trackNumber: number;
  discNumber: number;
  bitrate: number;
  sampleRate: number;
  fileSize: number;
  /** Device-absolute path as stored in the pdb, e.g. "/Contents/Artist/Album/track.mp3". */
  filePath: string;
  artworkId: number;
  colorId: number;
  comment: string;
  dateAdded: string;
}

export interface PlaylistNode {
  id: number;
  name: string;
  parentId: number;
  sortOrder: number;
  isFolder: boolean;
  /** Child node ids (folders only), sorted. */
  childIds: number[];
  /** Ordered track ids (playlists only). */
  trackIds: number[];
}

export interface Library {
  /** All tracks keyed by pdb track id. */
  tracks: Record<number, Track>;
  /** Every track id, sorted by title. */
  allTrackIds: number[];
  /** Playlist tree nodes keyed by id. Root nodes have parentId 0. */
  playlistNodes: Record<number, PlaylistNode>;
  /** Ids of root-level nodes, sorted. */
  rootNodeIds: number[];
  /** Artwork id -> device-absolute image path. */
  artworkPaths: Record<number, string>;
  /** Color id -> name, from the colors table. */
  colorNames: Record<number, string>;
}
