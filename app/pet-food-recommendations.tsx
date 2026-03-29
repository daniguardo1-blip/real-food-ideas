import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';

interface FoodItem {
  name: string;
  healthScore: number;
  ingredients: string;
  reason: string;
}

export default function PetFoodRecommendationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile } = usePetProfile();

  const isCat = petProfile?.pet_type.toLowerCase().includes('gat') || petProfile?.pet_type.toLowerCase().includes('cat');
  const petName = petProfile?.pet_name || (language === 'es' ? 'tu mascota' : 'your pet');

  const personalizedCatFoods = {
    dry: { name: 'Orijen Cat & Kitten', healthScore: 96, ingredients: language === 'es' ? 'Pollo fresco, pavo, pescado, huevos' : 'Fresh chicken, turkey, fish, eggs', reason: language === 'es' ? 'Alto en proteínas de calidad, ideal para gatos de todas las edades' : 'High quality proteins, ideal for cats of all ages' },
    wet: { name: 'Sheba Perfect Portions', healthScore: 92, ingredients: language === 'es' ? 'Pollo, caldo de pollo, hígado' : 'Chicken, chicken broth, liver', reason: language === 'es' ? 'Hidratación óptima y palatabilidad excelente' : 'Optimal hydration and excellent palatability' },
    mixed: { name: 'Royal Canin Indoor Adult', healthScore: 91, ingredients: language === 'es' ? 'Pollo, arroz integral, fibra' : 'Chicken, brown rice, fiber', reason: language === 'es' ? 'Equilibrio perfecto para gatos de interior' : 'Perfect balance for indoor cats' },
    treat: { name: 'Greenies Feline Dental Treats', healthScore: 86, ingredients: language === 'es' ? 'Pollo, proteína vegetal, fibra' : 'Chicken, plant protein, fiber', reason: language === 'es' ? 'Ayuda a la salud dental mientras recompensas' : 'Helps dental health while rewarding' },
  };

  const personalizedDogFoods = {
    dry: { name: 'Orijen Original Dry Dog Food', healthScore: 95, ingredients: language === 'es' ? 'Pollo fresco, pavo, pescado, huevos' : 'Fresh chicken, turkey, fish, eggs', reason: language === 'es' ? 'Proteínas de alta calidad para perros activos' : 'High quality proteins for active dogs' },
    wet: { name: 'Blue Buffalo Homestyle Recipe', healthScore: 89, ingredients: language === 'es' ? 'Pollo, caldo de pollo, arroz integral' : 'Chicken, chicken broth, brown rice', reason: language === 'es' ? 'Ingredientes naturales para una digestión óptima' : 'Natural ingredients for optimal digestion' },
    mixed: { name: 'Royal Canin Adult Dog', healthScore: 90, ingredients: language === 'es' ? 'Pollo, arroz, maíz, fibra' : 'Chicken, rice, corn, fiber', reason: language === 'es' ? 'Nutrición balanceada para perros adultos' : 'Balanced nutrition for adult dogs' },
    treat: { name: 'Greenies Dog Dental Treats', healthScore: 85, ingredients: language === 'es' ? 'Proteína vegetal, fibra, vitaminas' : 'Plant protein, fiber, vitamins', reason: language === 'es' ? 'Limpieza dental efectiva y sabor irresistible' : 'Effective dental cleaning and irresistible taste' },
  };

  const personalized = isCat ? personalizedCatFoods : personalizedDogFoods;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 85) return '#84cc16';
    return '#fbbf24';
  };

  const renderFoodItem = (food: FoodItem, category: string) => (
    <View key={category} style={styles.foodCard}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(food.healthScore) }]}>
            <Text style={styles.scoreText}>{food.healthScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>{language === 'es' ? 'Puntuación' : 'Health Score'}</Text>
        </View>
        <Text style={styles.ingredientsLabel}>{language === 'es' ? 'Ingredientes' : 'Ingredients'}:</Text>
        <Text style={styles.ingredientsText}>{food.ingredients}</Text>
        <View style={styles.reasonContainer}>
          <Star size={14} color="#f59e0b" strokeWidth={2} />
          <Text style={styles.reasonText}>{food.reason}</Text>
        </View>
        <TouchableOpacity
          style={styles.affiliateButton}
          onPress={() => {
            const encodedProduct = encodeURIComponent(food.name);
            const amazonUrl = `https://www.amazon.es/s?k=${encodedProduct}&tag=danireee105-21`;
            Linking.openURL(amazonUrl);
          }}
        >
          <Text style={styles.affiliateButtonText}>{language === 'es' ? 'Ver en Amazon' : 'View on Amazon'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Alimentos para tu mascota' : 'Food for your pet'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.personalizedHeader}>
            <Star size={28} color="#f59e0b" strokeWidth={2} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.sectionTitle}>
                {language === 'es'
                  ? `Los mejores alimentos para ${isCat ? 'tu gato' : 'tu perro'}`
                  : `Best foods for your ${isCat ? 'cat' : 'dog'}`}
              </Text>
              <Text style={styles.personalizedSubtitle}>
                {language === 'es'
                  ? `Recomendaciones personalizadas para ${petName}`
                  : `Personalized recommendations for ${petName}`}
              </Text>
            </View>
          </View>

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Comida seca' : 'Dry food'}
          </Text>
          {renderFoodItem(personalized.dry, 'dry')}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Comida húmeda' : 'Wet food'}
          </Text>
          {renderFoodItem(personalized.wet, 'wet')}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Alimentación mixta' : 'Mixed feeding'}
          </Text>
          {renderFoodItem(personalized.mixed, 'mixed')}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Snack/Premio' : 'Treat/Snack'}
          </Text>
          {renderFoodItem(personalized.treat, 'treat')}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  personalizedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  headerTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  personalizedSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 4,
  },
  foodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reasonText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  affiliateButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  affiliateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
