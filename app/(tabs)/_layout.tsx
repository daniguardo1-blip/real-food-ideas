import { Tabs } from 'expo-router';
import { Scan, History, Grid2x2 as Grid, User } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  const { t, language } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          ...theme.shadows.xl,
          paddingTop: 14,
          paddingBottom: 14,
          height: 76,
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 5,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.scan,
          tabBarIcon: ({ size, color }) => (
            <Scan size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabs.history,
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: language === 'es' ? 'Servicios' : 'Services',
          tabBarIcon: ({ size, color }) => (
            <Grid size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}