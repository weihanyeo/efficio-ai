import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Define types for Supabase realtime payload
export type RealtimePayload<T = Record<string, unknown>> = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
  new: T;
  old: T;
}>;

// Create Supabase client with custom settings and proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('Network error during fetch:', err);
        throw err;
      });
    }
  }
});