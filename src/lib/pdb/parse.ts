import KaitaiStream from 'kaitai-struct/KaitaiStream';
import type { Library, PlaylistNode, Track } from '@/types/library';
import type {
  ArtworkRow,
  DeviceSqlString,
  NamedRow,
  PlaylistEntryRow,
  PlaylistTreeRow,
  Table,
  TrackRow,
} from './RekordboxPdb';

// The generated parser is UMD; require keeps Metro happy without type friction.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RekordboxPdb } = require('./RekordboxPdb.js');

// ---------------------------------------------------------------------------
// Hermes has no TextDecoder, and the Kaitai runtime falls back to iconv-lite
// (Node-only) for non-ASCII encodings. Replace bytesToStr with a pure-JS
// decoder covering the three encodings a pdb can contain.
// ---------------------------------------------------------------------------
function decodeUtf16le(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  }
  return out;
}

function decodeUtf8(bytes: Uint8Array): string {
  // Decode UTF-8; on malformed input fall back to latin1 so we never throw.
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    try {
      if (b < 0x80) {
        out += String.fromCharCode(b);
        i += 1;
      } else if (b < 0xe0) {
        out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
        i += 2;
      } else if (b < 0xf0) {
        out += String.fromCharCode(
          ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f),
        );
        i += 3;
      } else {
        const cp =
          ((b & 0x07) << 18) |
          ((bytes[i + 1] & 0x3f) << 12) |
          ((bytes[i + 2] & 0x3f) << 6) |
          (bytes[i + 3] & 0x3f);
        out += String.fromCodePoint(cp);
        i += 4;
      }
    } catch {
      out += String.fromCharCode(b);
      i += 1;
    }
  }
  return out;
}

(KaitaiStream as any).bytesToStr = function (arr: Uint8Array, encoding?: string): string {
  const enc = (encoding ?? 'ascii').toLowerCase();
  if (enc === 'utf-16le' || enc === 'utf16le') return decodeUtf16le(arr);
  // rekordbox writes UTF-8 into the "ASCII" short strings, so decode as UTF-8.
  return decodeUtf8(arr);
};

// ---------------------------------------------------------------------------
// Table walking
// ---------------------------------------------------------------------------
function text(s: DeviceSqlString | undefined): string {
  try {
    return s?.body?.text ?? '';
  } catch {
    return '';
  }
}

function* tableRows<T>(pdb: { tables: Table[] }, type: number): Generator<T> {
  const table = pdb.tables.find((t) => t.type === type);
  if (!table) return;
  const lastIndex = table.lastPage.index;
  const visited = new Set<number>();
  let ref = table.firstPage;
  for (;;) {
    if (visited.has(ref.index)) break; // corrupt linkage guard
    visited.add(ref.index);
    let page;
    try {
      page = ref.body;
    } catch {
      break;
    }
    if (page.isDataPage) {
      for (const group of page.rowGroups ?? []) {
        for (const rowRef of group.rows) {
          try {
            if (rowRef.present && rowRef.body != null) yield rowRef.body as T;
          } catch {
            // Skip individual malformed rows rather than failing the parse.
          }
        }
      }
    }
    if (ref.index === lastIndex) break;
    ref = page.nextPage;
  }
}

function nameMap(pdb: { tables: Table[] }, type: number): Record<number, string> {
  const map: Record<number, string> = {};
  for (const row of tableRows<NamedRow>(pdb, type)) {
    map[row.id] = text(row.name);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function parsePdb(bytes: Uint8Array): Library {
  const copy = new Uint8Array(bytes); // ensures a plain, tightly-sized ArrayBuffer
  const stream = new KaitaiStream(copy.buffer as ArrayBuffer);
  const pdb = new RekordboxPdb(stream, undefined, undefined, false);
  const T = RekordboxPdb.PageType;

  const artists = nameMap(pdb, T.ARTISTS);
  const albums = nameMap(pdb, T.ALBUMS);
  const genres = nameMap(pdb, T.GENRES);
  const keys = nameMap(pdb, T.KEYS);
  const colorNames = nameMap(pdb, T.COLORS);

  const artworkPaths: Record<number, string> = {};
  for (const row of tableRows<ArtworkRow>(pdb, T.ARTWORK)) {
    artworkPaths[row.id] = text(row.path);
  }

  const tracks: Record<number, Track> = {};
  for (const row of tableRows<TrackRow>(pdb, T.TRACKS)) {
    tracks[row.id] = {
      id: row.id,
      title: text(row.title) || text(row.filePath).split('/').pop() || `Track ${row.id}`,
      artist: artists[row.artistId] ?? '',
      album: albums[row.albumId] ?? '',
      genre: genres[row.genreId] ?? '',
      key: keys[row.keyId] ?? '',
      durationSec: row.duration,
      bpm: row.tempo / 100,
      rating: row.rating,
      year: row.year,
      trackNumber: row.trackNumber,
      discNumber: row.discNumber,
      bitrate: row.bitrate,
      sampleRate: row.sampleRate,
      fileSize: row.fileSize,
      filePath: text(row.filePath),
      artworkId: row.artworkId,
      colorId: row.colorId,
      comment: text(row.comment),
      dateAdded: text(row.dateAdded),
    };
  }

  // Playlist tree: folders + playlists, then attach ordered entries.
  const playlistNodes: Record<number, PlaylistNode> = {};
  for (const row of tableRows<PlaylistTreeRow>(pdb, T.PLAYLIST_TREE)) {
    playlistNodes[row.id] = {
      id: row.id,
      name: text(row.name),
      parentId: row.parentId,
      sortOrder: row.sortOrder,
      isFolder: row.isFolder,
      childIds: [],
      trackIds: [],
    };
  }

  const entriesByPlaylist: Record<number, PlaylistEntryRow[]> = {};
  for (const row of tableRows<PlaylistEntryRow>(pdb, T.PLAYLIST_ENTRIES)) {
    (entriesByPlaylist[row.playlistId] ??= []).push(row);
  }
  for (const [playlistId, entries] of Object.entries(entriesByPlaylist)) {
    const node = playlistNodes[Number(playlistId)];
    if (!node) continue;
    entries.sort((a, b) => a.entryIndex - b.entryIndex);
    node.trackIds = entries.map((e) => e.trackId).filter((id) => tracks[id] != null);
  }

  const rootNodeIds: number[] = [];
  const byOrder = (a: number, b: number) =>
    (playlistNodes[a].sortOrder - playlistNodes[b].sortOrder) ||
    playlistNodes[a].name.localeCompare(playlistNodes[b].name);
  for (const node of Object.values(playlistNodes)) {
    if (node.parentId === 0) rootNodeIds.push(node.id);
    else playlistNodes[node.parentId]?.childIds.push(node.id);
  }
  rootNodeIds.sort(byOrder);
  for (const node of Object.values(playlistNodes)) node.childIds.sort(byOrder);

  const allTrackIds = Object.values(tracks)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((t) => t.id);

  return { tracks, allTrackIds, playlistNodes, rootNodeIds, artworkPaths, colorNames };
}
