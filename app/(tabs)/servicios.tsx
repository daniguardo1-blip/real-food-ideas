import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import {
  MessageCircle,
  Utensils,
  Trophy,
  Calendar,
  ChefHat,
  Circle as HelpCircle,
  MapPin,
  Volume2,
  Stethoscope,
  Scissors,
  Star,
  Grid2x2,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: Href;
  color: string;
};

export default function ServiciosScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile } = usePetProfile();

  const petType = petProfile?.pet_type?.toLowerCase() || '';
  const isCat = petType.includes('gat') || petType.includes('cat');
  const isDog = petType.includes('perr') || petType.includes('dog');

  const baseServices: ServiceItem[] = [
    {
      id: 'pet-advisor',
      title: language === 'es' ? 'Asesor de Mascotas' : 'Pet Advisor',
      description:
        language === 'es'
          ? 'Obtén consejos personalizados sobre nutrición y salud para tu mascota'
          : 'Get personalized advice on nutrition and health for your pet',
      icon: MessageCircle,
      route: '/pet-advisor',
      color: '#10b981',
    },
    {
      id: 'health-calendar',
      title: language === 'es' ? 'Calendario de Salud' : 'Health Calendar',
      description:
        language === 'es'
          ? 'Gestiona recordatorios de vacunas, desparasitaciones y citas veterinarias'
          : 'Manage reminders for vaccines, deworming, and vet appointments',
      icon: Calendar,
      route: '/health-calendar',
      color: '#8b5cf6',
    },
    {
      id: 'food-comparison',
      title: language === 'es' ? 'Comparación de Alimentos' : 'Food Comparison',
      description:
        language === 'es'
          ? 'Compara diferentes alimentos para encontrar el mejor para tu mascota'
          : 'Compare different foods to find the best for your pet',
      icon: Utensils,
      route: '/food-comparison',
      color: '#3b82f6',
    },
    {
      id: 'recipe-ideas',
      title: language === 'es' ? 'Ideas de recetas caseras' : 'Homemade recipe ideas',
      description:
        language === 'es'
          ? 'Genera recetas personalizadas y saludables para tu mascota'
          : 'Generate personalized and healthy recipes for your pet',
      icon: ChefHat,
      route: '/recipe-ideas',
      color: '#ec4899',
    },
    {
      id: 'top-foods',
      title: language === 'es' ? 'Mejores Alimentos' : 'Top Foods',
      description:
        language === 'es'
          ? 'Descubre los alimentos mejor calificados según nuestra base de datos'
          : 'Discover top-rated foods from our database',
      icon: Trophy,
      route: '/top-foods',
      color: '#f59e0b',
    },
    {
      id: 'pet-food-recommendations',
      title: language === 'es' ? 'Alimentos para tu mascota' : 'Food for your pet',
      description:
        language === 'es'
          ? 'Recomendaciones personalizadas de alimentos para tu mascota'
          : 'Personalized food recommendations for your pet',
      icon: Star,
      route: '/pet-food-recommendations',
      color: '#f59e0b',
    },
    {
      id: 'pet-questions',
      title: language === 'es' ? 'Duda sobre mi mascota' : 'Question about my pet',
      description:
        language === 'es'
          ? 'Obtén respuestas profesionales a tus consultas sobre tu mascota'
          : 'Get professional answers to your pet questions',
      icon: HelpCircle,
      route: '/pet-questions',
      color: '#6366f1',
    },
    {
      id: 'shelters-donations',
      title: language === 'es' ? 'Refugios animales y donación' : 'Animal shelters and donation',
      description:
        language === 'es'
          ? 'Encuentra refugios cerca de ti y apoya organizaciones de protección animal'
          : 'Find shelters near you and support animal protection organizations',
      icon: MapPin,
      route: '/shelters-donations',
      color: '#ef4444',
    },
    {
      id: 'veterinarios-cerca',
      title: language === 'es' ? 'Veterinarios cerca' : 'Nearby Veterinarians',
      description:
        language === 'es'
          ? 'Encuentra clínicas veterinarias en tu zona'
          : 'Find veterinary clinics in your area',
      icon: Stethoscope,
      route: '/veterinarios-cerca',
      color: '#06b6d4',
    },
  ];

  const catService: ServiceItem = {
    id: 'call-cat',
    title: language === 'es' ? 'Llama a tu gato' : 'Call your cat',
    description:
      language === 'es'
        ? 'Reproduce un sonido para llamar la atención de tu gato'
        : "Play a sound to get your cat's attention",
    icon: Volume2,
    route: '/call-cat',
    color: '#f97316',
  };

  const dogGroomingService: ServiceItem = {
    id: 'peluquerias-cerca',
    title: language === 'es' ? 'Peluquerías cerca' : 'Nearby Groomers',
    description:
      language === 'es'
        ? 'Encuentra peluquerías caninas en tu zona'
        : 'Find dog groomers in your area',
    icon: Scissors,
    route: '/peluquerias-cerca',
    color: '#f59e0b',
  };

  let services = [...baseServices];
  if (isDog) services.push(dogGroomingService);
  if (isCat) services.push(catService);

  const handleNavigate = (route: Href) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>
              {language === 'es' ? 'Servicios' : 'Services'}
            </Text>
            <Text style={styles.subtitle}>
              {language === 'es'
                ? 'Todo para el cuidado de tu mascota'
                : 'Everything for your pet care'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {services.map((service) => {
            const IconComponent = service.icon;

            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleNavigate(service.route)}
                activeOpacity={0.7}
              >
                <Card variant="elevated" style={styles.cardInner}>
                  <View style={styles.iconContainer}>
                    <IconComponent size={30} color={service.color} strokeWidth={2} />
                  </View>

                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle} numberOfLines={2}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  </View>

                  <View style={styles.arrow}>
                    <ChevronRight size={22} color={theme.colors.text.tertiary} strokeWidth={2.5} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  grid: {
    gap: theme.spacing.md,
  },
  serviceCard: {
    marginBottom: theme.spacing.md,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  serviceTitle: {
    ...theme.typography.h3,
    fontSize: 17,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  serviceDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  arrow: {
    opacity: 0.5,
  },
});