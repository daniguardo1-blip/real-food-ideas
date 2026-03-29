import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_APP_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. Please ensure EXPO_PUBLIC_APP_SUPABASE_URL and EXPO_PUBLIC_APP_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

console.log('[Supabase Client] URL:', supabaseUrl);
console.log('[Supabase Client] Project Ref:', supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown');
console.log('[Supabase Client] Anon Key Length:', supabaseKey.length);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});