// Custom entry: register the RNTP playback service alongside expo-router's root
// component so remote/background controls work. Keep the expo-router import first.
import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/lib/audio/service';

TrackPlayer.registerPlaybackService(() => PlaybackService);
