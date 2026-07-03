/**
 * Storage Access Framework helpers for reading a rekordbox-exported USB.
 *
 * The user grants access to the USB root once via ACTION_OPEN_DOCUMENT_TREE.
 * SAF document ids for the external-storage provider are "<volumeId>:<path>",
 * so children of the granted tree can be addressed directly by constructing
 * their document URI from the tree URI + a relative path — no tree walking.
 */
import * as FileSystem from 'expo-file-system/legacy';

const { StorageAccessFramework: SAF } = FileSystem;

const PDB_PATH = 'PIONEER/rekordbox/export.pdb';
const STATE_FILE = `${FileSystem.documentDirectory}usb-root.json`;

export interface UsbRoot {
  /** SAF tree URI, e.g. content://com.android.externalstorage.documents/tree/1234-5678%3A */
  treeUri: string;
  /** Root document id, e.g. "1234-5678:" */
  rootDocId: string;
}

/** Extract the root document id from a SAF tree URI. */
function rootDocIdFromTreeUri(treeUri: string): string {
  const match = treeUri.match(/\/tree\/([^/]+)/);
  if (!match) throw new Error(`Unexpected SAF tree URI: ${treeUri}`);
  return decodeURIComponent(match[1]);
}

/** Build a content:// document URI for a path relative to the granted root. */
export function documentUri(root: UsbRoot, relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, '');
  const docId = root.rootDocId.endsWith(':')
    ? root.rootDocId + rel
    : `${root.rootDocId}/${rel}`;
  return `${root.treeUri}/document/${encodeURIComponent(docId)}`;
}

/** Ask the user to pick the USB drive root. Returns null if they cancel. */
export async function requestUsbRoot(): Promise<UsbRoot | null> {
  const result = await SAF.requestDirectoryPermissionsAsync();
  if (!result.granted) return null;
  const root: UsbRoot = {
    treeUri: result.directoryUri,
    rootDocId: rootDocIdFromTreeUri(result.directoryUri),
  };
  await FileSystem.writeAsStringAsync(STATE_FILE, JSON.stringify(root)).catch(() => {});
  return root;
}

/** Restore a previously granted root, verifying the grant still works. */
export async function restoreUsbRoot(): Promise<UsbRoot | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(STATE_FILE);
    const root = JSON.parse(raw) as UsbRoot;
    // The permission survives reboots but not if the stick was re-formatted
    // or the grant was revoked — verify we can still list the root.
    await SAF.readDirectoryAsync(root.treeUri);
    return root;
  } catch {
    return null;
  }
}

/** Forget the persisted root so the app won't auto-reconnect on next launch. */
export async function clearPersistedRoot(): Promise<void> {
  await FileSystem.deleteAsync(STATE_FILE, { idempotent: true }).catch(() => {});
}

export async function fileExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

/** Locate export.pdb on the granted root. */
export async function findExportPdb(root: UsbRoot): Promise<string | null> {
  const direct = documentUri(root, PDB_PATH);
  if (await fileExists(direct)) return direct;
  // Fallback: case variations seen in the wild (Pioneer vs PIONEER).
  for (const variant of ['Pioneer/rekordbox/export.pdb', 'PIONEER/Rekordbox/export.pdb']) {
    const uri = documentUri(root, variant);
    if (await fileExists(uri)) return uri;
  }
  return null;
}

// Base64 decode without atob-size anxiety: decode in one pass ourselves.
const B64_LOOKUP = (() => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(128);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  return lookup;
})();

export function base64ToBytes(b64: string): Uint8Array {
  let len = b64.length;
  while (len > 0 && (b64[len - 1] === '=' || b64[len - 1] === '\n')) len--;
  const outLen = Math.floor((len * 3) / 4);
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < len; i += 4) {
    const a = B64_LOOKUP[b64.charCodeAt(i)];
    const b = B64_LOOKUP[b64.charCodeAt(i + 1)];
    const c = B64_LOOKUP[b64.charCodeAt(i + 2)];
    const d = B64_LOOKUP[b64.charCodeAt(i + 3)];
    out[o++] = (a << 2) | (b >> 4);
    if (o < outLen) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (o < outLen) out[o++] = ((c & 3) << 6) | d;
  }
  return out;
}

/** Read a file from the USB as raw bytes. */
export async function readFileBytes(uri: string): Promise<Uint8Array> {
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToBytes(b64);
}

export interface TreeEntry {
  name: string;
  uri: string;
  isDirectory: boolean;
}

/** List one directory level of the granted tree (for the file-tree browser). */
export async function listDirectory(dirUri: string): Promise<TreeEntry[]> {
  const childUris = await SAF.readDirectoryAsync(dirUri);
  const entries = await Promise.all(
    childUris.map(async (uri): Promise<TreeEntry> => {
      const info = await FileSystem.getInfoAsync(uri).catch(() => null);
      const docId = decodeURIComponent(uri.split('/document/').pop() ?? uri);
      const name = docId.split('/').pop() ?? docId;
      return { name, uri, isDirectory: info?.exists ? !!info.isDirectory : false };
    }),
  );
  entries.sort((a, b) =>
    a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1,
  );
  return entries;
}
