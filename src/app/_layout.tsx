import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="library/index" options={{ title: 'Library' }} />
        <Stack.Screen name="library/tracks" options={{ title: 'All Tracks' }} />
        <Stack.Screen name="library/node/[id]" options={{ title: '' }} />
        <Stack.Screen name="library/files" options={{ title: 'Files' }} />
        <Stack.Screen
          name="player"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </>
  );
}
