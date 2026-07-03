import { useRouter } from 'expo-router';
import { Usb } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { connectUsb, reconnectUsb } from '@/lib/usb/scan';
import { useAppStore } from '@/store';

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
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-surface">
          <Usb size={40} color="#1DB954" />
        </View>
        <View className="items-center gap-2">
          <Text variant="title">rekordplay</Text>
          <Text variant="muted" className="text-center">
            Plug in a rekordbox-exported USB drive, then pick its root folder to load the
            library.
          </Text>
        </View>

        {busy ? (
          <View className="items-center gap-3">
            <ActivityIndicator color="#1DB954" />
            <Text variant="muted">
              {status === 'scanning' ? 'Reading library…' : 'Checking for a previous USB…'}
            </Text>
          </View>
        ) : (
          <Button label="Connect USB drive" onPress={connectUsb} />
        )}

        {status === 'error' && error ? (
          <Card className="border border-destructive/40">
            <Text className="text-sm text-destructive">{error}</Text>
          </Card>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
