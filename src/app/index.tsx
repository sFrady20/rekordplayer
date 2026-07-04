import { useRouter } from 'expo-router';
import { Usb } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuroraBackground, GradientBlob } from '@/components/aurora-background';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { connectUsb, reconnectUsb } from '@/lib/usb/scan';
import { useAppStore } from '@/store';

/** An expanding, fading ring pulsing out of the USB icon — like a beacon. */
function PulseRing({ delay }: { delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * 0.85 }],
    opacity: 0.55 * (1 - t.value),
  }));
  return <Animated.View pointerEvents="none" style={[styles.ring, style]} />;
}

/** Soft breathing glow that sits behind the CTA button. */
function ButtonGlow() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + t.value * 0.4,
    transform: [{ scale: 0.95 + t.value * 0.12 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, style]}>
      <GradientBlob id="cta-glow" color="#1DB954" opacity={0.55} sizePx={260} />
    </Animated.View>
  );
}

export default function ConnectScreen() {
  const router = useRouter();
  const status = useAppStore((s) => s.usb.status);
  const error = useAppStore((s) => s.usb.error);
  const [restoring, setRestoring] = useState(true);

  // Try to silently reconnect to the last USB on launch.
  useEffect(() => {
    reconnectUsb().finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    if (status === 'ready') router.replace('/library');
  }, [status, router]);

  const busy = restoring || status === 'scanning';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuroraBackground />
      <View className="flex-1 items-center justify-center gap-8 px-8">
        <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.iconWrap}>
          <PulseRing delay={0} />
          <PulseRing delay={1300} />
          <View className="h-28 w-28 items-center justify-center rounded-full border border-primary/30 bg-surface/90">
            <Usb size={44} color="#1DB954" />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(700).delay(150).springify()}
          className="items-center gap-3"
        >
          <Text variant="title" className="text-4xl">
            rekordplayer
          </Text>
          <Text variant="muted" className="max-w-[300px] text-center text-base leading-6">
            Plug in a rekordbox USB and your whole library — playlists, artwork and all — is
            ready to play.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(700).delay(320).springify()}
          style={styles.ctaWrap}
        >
          {busy ? (
            <View className="h-[104px] items-center justify-center gap-3">
              <ActivityIndicator color="#1DB954" />
              <Text variant="muted">
                {status === 'scanning' ? 'Reading library…' : 'Checking for a previous USB…'}
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <ButtonGlow />
              <Button size="lg" label="Connect USB drive" onPress={connectUsb} />
              <Text variant="caption" className="mt-4">
                Pick the root folder of the drive when asked
              </Text>
            </View>
          )}
        </Animated.View>

        {status === 'error' && error ? (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card className="border border-destructive/40">
              <Text className="text-sm text-destructive">{error}</Text>
            </Card>
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: '#1DB954',
  },
  ctaWrap: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
  },
});
