import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/lib/LanguageContext';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { PetProfileProvider } from '@/lib/PetProfileContext';
import { supabase } from '@/lib/supabaseClient';

LogBox.ignoreAllLogs(true);

if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Text strings must be rendered within a <Text> component')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <LanguageProvider>
      <PetProfileProvider>
        <FavoritesProvider>
          <Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="auth/login" />
  <Stack.Screen name="auth/signup" />
  <Stack.Screen name="auth/pet-onboarding" />
  <Stack.Screen name="legal/consent" />
  <Stack.Screen name="legal/privacy-policy" />
  <Stack.Screen name="legal/terms-of-service" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="product-result" />
  <Stack.Screen name="product-submission" />
  <Stack.Screen name="pet-advisor" />
  <Stack.Screen name="ai-report" />
  <Stack.Screen name="health-calendar" />
  <Stack.Screen name="food-comparison" />
  <Stack.Screen name="top-foods" />
  <Stack.Screen name="subscription-settings" />
  <Stack.Screen name="recipe-ideas" />
  <Stack.Screen name="pet-food-recommendations" />
  <Stack.Screen name="pet-questions" />
  <Stack.Screen name="shelters-donations" />
  <Stack.Screen name="veterinarios-cerca" />
  <Stack.Screen name="peluquerias-cerca" />
  <Stack.Screen name="call-cat" />
  <Stack.Screen name="favorite-recipes" />
  <Stack.Screen name="+not-found" />
</Stack>
          <StatusBar style="auto" />
        </FavoritesProvider>
      </PetProfileProvider>
    </LanguageProvider>
  );
}
