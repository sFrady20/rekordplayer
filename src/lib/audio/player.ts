/**
 * Queue-driven playback over react-native-track-player. RNTP owns the queue so
 * that OS/car/Bluetooth/lock-screen next & previous map to real track changes
 * and auto-advance is handled natively. Screens dispatch the same intents as
 * before (playQueue/toggle/next/...) and read playback state from the store,
 * which we keep in sync via RNTP event listeners.
 */
import TrackPlayer, {
  AndroidAudioContentType,
  Capability,
  Event,
  State,
  type Track as RntpTrack,
} from 'react-native-track-player';
import { documentUri } from '@/lib/usb/saf';
import type { PlaybackStatus } from '@/store';
import { useAppStore } from '@/store';
import type { Track } from '@/types/library';

let setupPromise: Promise<void> | null = null;
/** Briefly ignore progress reports right after a seek so the bar doesn't flicker. */
let seekGuardUntil = 0;

function mapState(state: State | undefined): PlaybackStatus {
  switch (state) {
    case State.Playing:
      return 'playing';
    case State.Paused:
    case State.Stopped:
    case State.Ready:
    case State.Ended:
      return 'paused';
    case State.Loading:
    case State.Buffering:
      return 'loading';
    default:
      return 'idle';
  }
}

function ensureSetup(): Promise<void> {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    await TrackPlayer.setupPlayer({
      androidAudioContentType: AndroidAudioContentType.Music,
    });
    await TrackPlayer.updateOptions({
      progressUpdateEventInterval: 0.5,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
    });

    // RNTP is the source of truth for playback; mirror it into the store so the
    // existing store-driven UI keeps working (foreground and background).
    TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
      const mapped = mapState(state);
      const prev = useAppStore.getState().player.status;
      // ExoPlayer passes through Buffering/Loading/Ready during seeks and
      // track transitions; if we were playing, stay 'playing' so the
      // play/pause button doesn't flicker. Real pauses/stops emit
      // Paused/Stopped/Ended explicitly and pass straight through.
      const transitional = mapped === 'loading' || state === State.Ready;
      const status = transitional && prev === 'playing' ? 'playing' : mapped;
      useAppStore.getState().setPlayback({ status });
    });
    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
      if (event.index != null) useAppStore.getState().setQueueIndex(event.index);
      // Snap the playhead to the top of the new track immediately instead of
      // letting it sit at the old position until the next progress tick.
      seekGuardUntil = 0;
      useAppStore.getState().setPlayback({
        positionSec: 0,
        durationSec: event.track?.duration ?? 0,
      });
    });
    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, ({ position, duration }) => {
      const patch: { positionSec?: number; durationSec: number } = { durationSec: duration };
      if (Date.now() >= seekGuardUntil) patch.positionSec = position;
      useAppStore.getState().setPlayback(patch);
    });
  })();
  return setupPromise;
}

function toRntpTrack(track: Track): RntpTrack {
  const root = useAppStore.getState().usb.root!;
  const artworkId = track.artworkId;
  const artworkPath = artworkId
    ? useAppStore.getState().library?.artworkPaths[artworkId]
    : undefined;
  return {
    id: String(track.id),
    url: documentUri(root, track.filePath),
    title: track.title,
    artist: track.artist || 'Unknown artist',
    album: track.album || undefined,
    duration: track.durationSec || undefined,
    artwork: artworkPath ? documentUri(root, artworkPath) : undefined,
  };
}

/** Load an ordered list of track ids into RNTP and start at startIndex. */
async function loadIntoPlayer(trackIds: number[], startIndex: number) {
  const { library } = useAppStore.getState();
  if (!library) return;
  const rntpTracks = trackIds
    .map((id) => library.tracks[id])
    .filter((t): t is Track => t != null)
    .map(toRntpTrack);
  await TrackPlayer.reset();
  await TrackPlayer.add(rntpTracks);
  if (startIndex > 0) await TrackPlayer.skip(startIndex);
  await TrackPlayer.play();
}

/** Fisher-Yates, non-mutating. */
function shuffleArray<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Replace the queue and start playing at startIndex (in playlist order). */
export async function playQueue(trackIds: number[], startIndex: number, source: string) {
  await ensureSetup();
  const { player: p, setQueue } = useAppStore.getState();
  if (p.shuffle) {
    const rest = trackIds.filter((_, i) => i !== startIndex);
    const order = [trackIds[startIndex], ...shuffleArray(rest)];
    setQueue(order, 0, source, trackIds);
    await loadIntoPlayer(order, 0);
  } else {
    setQueue(trackIds, startIndex, source);
    await loadIntoPlayer(trackIds, startIndex);
  }
}

/** Turn shuffle on and start the given queue from a random track. */
export async function playQueueShuffled(trackIds: number[], source: string) {
  const { player: p, applyShuffle } = useAppStore.getState();
  if (!p.shuffle) applyShuffle(p.queue, p.queueIndex, true);
  await playQueue(trackIds, Math.floor(Math.random() * trackIds.length), source);
}

/** Toggle shuffle for the current queue, keeping the current track playing. */
export async function toggleShuffle() {
  const { player: p, applyShuffle } = useAppStore.getState();
  if (p.queue.length === 0) {
    applyShuffle(p.queue, p.queueIndex, !p.shuffle);
    return;
  }
  const currentId = p.queue[p.queueIndex];
  const position = p.positionSec;
  let order: number[];
  if (!p.shuffle) {
    const rest = p.queue.filter((_, i) => i !== p.queueIndex);
    order = [currentId, ...shuffleArray(rest)];
    applyShuffle(order, 0, true);
  } else {
    order = p.originalQueue;
    const index = Math.max(0, order.indexOf(currentId));
    applyShuffle(order, index, false);
  }
  // Rebuild RNTP's queue to match the new order, resuming the same track/spot.
  const newIndex = order.indexOf(currentId);
  await loadIntoPlayer(order, Math.max(0, newIndex));
  if (position > 0) await TrackPlayer.seekTo(position).catch(() => {});
}

export async function toggle() {
  const { status } = useAppStore.getState().player;
  if (status === 'playing') await TrackPlayer.pause();
  else await TrackPlayer.play();
}

export async function next() {
  await TrackPlayer.skipToNext().catch(() => {});
}

export async function previous() {
  const { positionSec, queueIndex } = useAppStore.getState().player;
  if (positionSec > 3 || queueIndex === 0) {
    seekTo(0);
  } else {
    await TrackPlayer.skipToPrevious().catch(() => TrackPlayer.seekTo(0));
  }
}

export function seekTo(seconds: number) {
  seekGuardUntil = Date.now() + 1000;
  useAppStore.getState().setPlayback({ positionSec: seconds });
  TrackPlayer.seekTo(seconds).catch(() => {
    seekGuardUntil = 0;
  });
}

/** Stop playback and release the drive's file handle (used before eject). */
export async function stopAndRelease() {
  seekGuardUntil = 0;
  await TrackPlayer.reset().catch(() => {});
}
