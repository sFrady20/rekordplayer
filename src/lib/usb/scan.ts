/**
 * Orchestrates connecting to a rekordbox USB: permission → locate pdb →
 * read bytes → parse → populate the store.
 */
import * as IntentLauncher from 'expo-intent-launcher';
import { stopAndRelease } from '@/lib/audio/player';
import { parsePdb } from '@/lib/pdb/parse';
import { useAppStore } from '@/store';
import {
  clearPersistedRoot,
  findExportPdb,
  readFileBytes,
  requestUsbRoot,
  restoreUsbRoot,
  UsbRoot,
} from './saf';

async function scanRoot(root: UsbRoot): Promise<void> {
  const { setUsb, setLibrary } = useAppStore.getState();
  setUsb({ root, status: 'scanning', error: null });
  try {
    const pdbUri = await findExportPdb(root);
    if (!pdbUri) {
      setUsb({
        status: 'error',
        error:
          'No rekordbox library found (PIONEER/rekordbox/export.pdb). Pick the root of a rekordbox-exported USB.',
      });
      return;
    }
    const bytes = await readFileBytes(pdbUri);
    const library = parsePdb(bytes);
    setLibrary(library);
    setUsb({ status: 'ready' });
  } catch (err) {
    setUsb({ status: 'error', error: err instanceof Error ? err.message : String(err) });
  }
}

/** Prompt the user to pick the USB root, then scan it. */
export async function connectUsb(): Promise<void> {
  const root = await requestUsbRoot();
  if (!root) return; // user cancelled
  await scanRoot(root);
}

/** Try to reconnect to the last-used USB without prompting. */
export async function reconnectUsb(): Promise<boolean> {
  const root = await restoreUsbRoot();
  if (!root) return false;
  await scanRoot(root);
  return true;
}

/**
 * Prepare the USB for safe removal. Apps cannot unmount volumes themselves
 * (that needs the privileged MOUNT_UNMOUNT_FILESYSTEMS permission), so this
 * releases everything we hold — playback file handles and library state —
 * then opens Android's Storage settings, where the volume's eject button is.
 */
export async function ejectUsb(): Promise<void> {
  stopAndRelease(); // closes the audio player's open file descriptors on the drive
  await clearPersistedRoot(); // don't auto-reconnect to a drive that's about to be pulled
  useAppStore.getState().reset();
  await IntentLauncher.startActivityAsync('android.settings.INTERNAL_STORAGE_SETTINGS').catch(
    () => {},
  );
}
