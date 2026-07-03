/** 245 -> "4:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, '0')}`;
}

/** "12 tracks" / "1 track" */
export function formatTrackCount(n: number): string {
  return `${n} ${n === 1 ? 'track' : 'tracks'}`;
}
