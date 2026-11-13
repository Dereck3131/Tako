import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://jdwoszkyonkzxhgzfgnb.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_eYxe9Ek9ojWEJZoX1ewJcw_EvCtQAlE';

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return memoryStorage[key] ?? null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      memoryStorage[key] = value;
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      delete memoryStorage[key];
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
