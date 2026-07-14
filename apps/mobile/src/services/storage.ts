import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// localStorage может быть недоступен (приватный режим Safari, отключённые куки) —
// в этом случае держим значения в памяти до конца сессии
const memoryFallback = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key) ?? memoryFallback.get(key) ?? null;
      } catch {
        return memoryFallback.get(key) ?? null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryFallback.set(key, value);
      try {
        localStorage.setItem(key, value);
      } catch {
        // остаёмся на memoryFallback
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryFallback.delete(key);
      try {
        localStorage.removeItem(key);
      } catch {
        // ок
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
