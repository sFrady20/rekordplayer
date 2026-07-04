/**
 * react-native-track-player playback service. Runs in a headless context so
 * remote controls (car Bluetooth/AVRCP, lock screen, headset, notification)
 * keep working while the app is backgrounded. Each handler delegates to the
 * player; queue position/state sync back to the store via listeners set up in
 * player.ts.
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    // Mirror the in-app behavior: restart the track unless we're near its start.
    const position = await TrackPlayer.getProgress().then((p) => p.position).catch(() => 0);
    if (position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious().catch(() => TrackPlayer.seekTo(0));
    }
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const { position, duration } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.min(position + (interval ?? 15), duration));
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(position - (interval ?? 15), 0));
  });
}
