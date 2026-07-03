import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Library } from '@/types/library';
import type { UsbRoot } from '@/lib/usb/saf';

export type UsbStatus = 'disconnected' | 'scanning' | 'ready' | 'error';
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused';

interface UsbSlice {
  root: UsbRoot | null;
  status: UsbStatus;
  error: string | null;
}

interface PlayerSlice {
  /** Ordered track ids in the play queue (shuffled order when shuffle is on). */
  queue: number[];
  /** Index into queue of the current track, or -1. */
  queueIndex: number;
  /** Human-readable source of the queue, e.g. playlist name. */
  queueSource: string;
  /** The queue in playlist order, for restoring when shuffle turns off. */
  originalQueue: number[];
  shuffle: boolean;
  status: PlaybackStatus;
  positionSec: number;
  durationSec: number;
}

interface AppState {
  usb: UsbSlice;
  library: Library | null;
  player: PlayerSlice;

  setUsb: (partial: Partial<UsbSlice>) => void;
  setLibrary: (library: Library | null) => void;
  setQueue: (queue: number[], startIndex: number, source: string, originalQueue?: number[]) => void;
  setQueueIndex: (index: number) => void;
  /** Swap the play order in place (shuffle on/off) without changing the source. */
  applyShuffle: (queue: number[], queueIndex: number, shuffle: boolean) => void;
  setPlayback: (partial: Partial<Pick<PlayerSlice, 'status' | 'positionSec' | 'durationSec'>>) => void;
  reset: () => void;
}

const initialUsb: UsbSlice = { root: null, status: 'disconnected', error: null };
const initialPlayer: PlayerSlice = {
  queue: [],
  queueIndex: -1,
  queueSource: '',
  originalQueue: [],
  shuffle: false,
  status: 'idle',
  positionSec: 0,
  durationSec: 0,
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    usb: initialUsb,
    library: null,
    player: initialPlayer,

    setUsb: (partial) =>
      set((state) => {
        Object.assign(state.usb, partial);
      }),

    setLibrary: (library) =>
      set((state) => {
        state.library = library;
      }),

    setQueue: (queue, startIndex, source, originalQueue) =>
      set((state) => {
        state.player.queue = queue;
        state.player.queueIndex = startIndex;
        state.player.queueSource = source;
        state.player.originalQueue = originalQueue ?? queue;
      }),

    setQueueIndex: (index) =>
      set((state) => {
        state.player.queueIndex = index;
      }),

    applyShuffle: (queue, queueIndex, shuffle) =>
      set((state) => {
        state.player.queue = queue;
        state.player.queueIndex = queueIndex;
        state.player.shuffle = shuffle;
      }),

    setPlayback: (partial) =>
      set((state) => {
        Object.assign(state.player, partial);
      }),

    reset: () =>
      set((state) => {
        state.usb = initialUsb;
        state.library = null;
        state.player = initialPlayer;
      }),
  })),
);

/** The currently playing track, or null. */
export function useCurrentTrack() {
  return useAppStore((s) => {
    const id = s.player.queue[s.player.queueIndex];
    return id != null ? (s.library?.tracks[id] ?? null) : null;
  });
}
