import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl?.trim() && supabasePublishableKey?.trim(),
);

let client: SupabaseClient | undefined;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl?.trim() || !supabasePublishableKey?.trim()) {
    throw new Error(
      'Supabase is not configured. Add the project URL and publishable key to .env.local.',
    );
  }

  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    if (Platform.OS !== 'web') {
      client.auth.startAutoRefresh();
      appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          client?.auth.startAutoRefresh();
        } else {
          client?.auth.stopAutoRefresh();
        }
      });
    }
  }

  return client;
}

export function disposeSupabaseAppStateListener(): void {
  appStateSubscription?.remove();
  appStateSubscription = undefined;
}
