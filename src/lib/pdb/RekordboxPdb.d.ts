// Minimal hand-written types for the Kaitai-generated parser.
// Only the surface we actually touch in parse.ts is typed.

export interface DeviceSqlString {
  body?: { text?: string };
}

export interface PageRef {
  index: number;
  body: Page;
}

export interface RowRef {
  present: boolean;
  body?: unknown;
}

export interface RowGroup {
  rows: RowRef[];
}

export interface Page {
  isDataPage: boolean;
  rowGroups?: RowGroup[];
  nextPage: PageRef;
}

export interface Table {
  type: number;
  firstPage: PageRef;
  lastPage: PageRef;
}

export interface TrackRow {
  id: number;
  artistId: number;
  albumId: number;
  genreId: number;
  keyId: number;
  artworkId: number;
  colorId: number;
  duration: number;
  tempo: number;
  rating: number;
  year: number;
  trackNumber: number;
  discNumber: number;
  bitrate: number;
  sampleRate: number;
  fileSize: number;
  title: DeviceSqlString;
  filePath: DeviceSqlString;
  comment: DeviceSqlString;
  dateAdded: DeviceSqlString;
}

export interface NamedRow {
  id: number;
  name: DeviceSqlString;
}

export interface PlaylistTreeRow {
  id: number;
  parentId: number;
  sortOrder: number;
  isFolder: boolean;
  name: DeviceSqlString;
}

export interface PlaylistEntryRow {
  entryIndex: number;
  trackId: number;
  playlistId: number;
}

export interface ArtworkRow {
  id: number;
  path: DeviceSqlString;
}

export declare class RekordboxPdb {
  constructor(io: unknown, parent?: unknown, root?: unknown, isExt?: boolean);
  tables: Table[];
  static PageType: {
    TRACKS: 0;
    GENRES: 1;
    ARTISTS: 2;
    ALBUMS: 3;
    LABELS: 4;
    KEYS: 5;
    COLORS: 6;
    PLAYLIST_TREE: 7;
    PLAYLIST_ENTRIES: 8;
    HISTORY_PLAYLISTS: 11;
    HISTORY_ENTRIES: 12;
    ARTWORK: 13;
    COLUMNS: 16;
    HISTORY: 19;
  };
}
