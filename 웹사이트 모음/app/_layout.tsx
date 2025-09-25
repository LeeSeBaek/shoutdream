import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="browse" options={{ title: "Browse Prompts" }} />
        <Stack.Screen name="prompt/[id]" options={{ title: "Prompt Details" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
