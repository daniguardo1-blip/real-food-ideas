declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_APP_SUPABASE_URL: string;
      EXPO_PUBLIC_APP_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_GOOGLE_API_KEY?: string;
      EXPO_PUBLIC_GOOGLE_SEARCH_ENGINE_ID?: string;
      EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?: string;
    }
  }
}

export {};
