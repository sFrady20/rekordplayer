import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { ejectUsb } from './scan';

/**
 * Returns a function that confirms, then safely ejects the USB and returns to
 * the connect screen. The confirm guards against an accidental tap stopping
 * playback while driving.
 */
export function useEject() {
  const router = useRouter();
  return useCallback(() => {
    Alert.alert(
      'Eject USB',
      'Stop playback and close the library? Finish by tapping eject next to the drive in the Storage screen that opens.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Eject',
          style: 'destructive',
          onPress: async () => {
            await ejectUsb();
            // Collapse any pushed screens (playlist, player, ...) so back
            // can't land on a dead page, then land on the connect screen.
            try {
              router.dismissAll();
            } catch {}
            router.replace('/');
          },
        },
      ],
    );
  }, [router]);
}
