/**
 * Singleton queue-driven playback service over expo-audio.
 * Screens dispatch intents (playQueue/toggle/next/...) and subscribe to
 * playback state through the zustand store.
 */
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useAppStore } from '@/store';
import { documentUri } from '@/lib/usb/saf';

let player: AudioPlayer | null = null;
let initialized = false;
/**
 * While a seek is settling, ExoPlayer briefly reports stale (often 0)
 * positions; ignore position updates until this timestamp so the progress
 * UI doesn't flicker back.
 */
let seekGuardUntil = 0;

function ensurePlayer(): AudioPlayer {
  if (player) return player;
  player = createAudioPlayer(null, { updateInterval: 500 });
  player.addListener('playbackStatusUpdate', (status) => {
    const { setPlayback } = useAppStore.getState();
    setPlayback({
      ...(Date.now() >= seekGuardUntil ? { positionSec: status.currentTime } : {}),
      durationSec: status.duration,
      status: status.playing ? 'playing' : status.isBuffering ? 'loading' : 'paused',
    });
    if (status.didJustFinish) next();
  });
  return player;
}

async function ensureAudioMode() {
  if (initialized) return;
  initialized = true;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  }).catch(() => {});
}

function loadAndPlay(index: number) {
  const { player: p, library, usb, setQueueIndex, setPlayback } = useAppStore.getState();
  const trackId = p.queue[index];
  const track = trackId != null ? library?.tracks[trackId] : null;
  if (!track || !usb.root) return;

  setQueueIndex(index);
  seekGuardUntil = 0; // fresh track: position reports are trustworthy again
  setPlayback({ status: 'loading', positionSec: 0, durationSec: track.durationSec });

  const uri = documentUri(usb.root, track.filePath);
  const audio = ensurePlayer();
  audio.replace({ uri });
  audio.play();
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
  await ensureAudioMode();
  const { player: p, setQueue } = useAppStore.getState();
  if (p.shuffle) {
    // Shuffle stays on across queue changes: chosen track first, rest shuffled.
    const rest = trackIds.filter((_, i) => i !== startIndex);
    setQueue([trackIds[startIndex], ...shuffleArray(rest)], 0, source, trackIds);
    loadAndPlay(0);
  } else {
    setQueue(trackIds, startIndex, source);
    loadAndPlay(startIndex);
  }
}

/** Turn shuffle on and start the given queue from a random track. */
export async function playQueueShuffled(trackIds: number[], source: string) {
  const { player: p, applyShuffle } = useAppStore.getState();
  if (!p.shuffle) applyShuffle(p.queue, p.queueIndex, true);
  await playQueue(trackIds, Math.floor(Math.random() * trackIds.length), source);
}

/** Toggle shuffle for the current queue, keeping the current track playing. */
export function toggleShuffle() {
  const { player: p, applyShuffle } = useAppStore.getState();
  if (p.queue.length === 0) {
    applyShuffle(p.queue, p.queueIndex, !p.shuffle);
    return;
  }
  const currentId = p.queue[p.queueIndex];
  if (!p.shuffle) {
    // Current track moves to the front; everything else is shuffled after it.
    const rest = p.queue.filter((_, i) => i !== p.queueIndex);
    applyShuffle([currentId, ...shuffleArray(rest)], 0, true);
  } else {
    // Restore playlist order, positioned at the current track.
    const index = Math.max(0, p.originalQueue.indexOf(currentId));
    applyShuffle(p.originalQueue, index, false);
  }
}

export function toggle() {
  if (!player) return;
  const { status } = useAppStore.getState().player;
  if (status === 'playing') player.pause();
  else player.play();
}

export function next() {
  const { queue, queueIndex } = useAppStore.getState().player;
  if (queueIndex + 1 < queue.length) loadAndPlay(queueIndex + 1);
  else useAppStore.getState().setPlayback({ status: 'paused' });
}

export function previous() {
  const { queueIndex, positionSec } = useAppStore.getState().player;
  // Standard behavior: restart current track unless we're near its start.
  if (positionSec > 3 || queueIndex === 0) {
    seekTo(0); // guarded seek, so the bar snaps to 0 without flicker
    player?.play();
  } else if (queueIndex > 0) {
    loadAndPlay(queueIndex - 1);
  }
}

export function seekTo(seconds: number) {
  if (!player) return;
  // Show the target position immediately and hold it until the seek settles.
  seekGuardUntil = Date.now() + 1200;
  useAppStore.getState().setPlayback({ positionSec: seconds });
  player
    .seekTo(seconds)
    .then(() => {
      // Seek done; give the status pipeline one more tick to catch up.
      seekGuardUntil = Math.min(seekGuardUntil, Date.now() + 300);
    })
    .catch(() => {
      seekGuardUntil = 0;
    });
}

export function stopAndRelease() {
  try {
    player?.pause();
    player?.release();
  } catch {}
  player = null;
}
