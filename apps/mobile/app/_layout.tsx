import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../src/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(player)" />
        <Stack.Screen name="(coach)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </Provider>
  );
}