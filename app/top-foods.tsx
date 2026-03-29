import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';

interface FoodItem {
  name: string;
  healthScore: number;
  ingredients: string;
  reason?: string;
}

interface CategoryFoods {
  dry: FoodItem[];
  wet: FoodItem[];
  mixed: FoodItem[];
  treat: FoodItem[];
}

export default function TopFoodsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile } = usePetProfile();

  const isCat = petProfile?.pet_type.toLowerCase().includes('gat') || petProfile?.pet_type.toLowerCase().includes('cat');

  const catFoods: CategoryFoods = {
    dry: [
      { name: 'Orijen Cat & Kitten', healthScore: 96, ingredients: language === 'es' ? 'Pollo fresco, pavo, pescado, huevos' : 'Fresh chicken, turkey, fish, eggs' },
      { name: 'Acana Wild Prairie', healthScore: 95, ingredients: language === 'es' ? 'Pollo de granja, pavo, huevos enteros' : 'Free-run chicken, turkey, whole eggs' },
      { name: 'Wellness CORE Grain-Free', healthScore: 93, ingredients: language === 'es' ? 'Pavo deshuesado, harina de pollo, arenque' : 'Deboned turkey, chicken meal, herring' },
    ],
    wet: [
      { name: 'Sheba Perfect Portions', healthScore: 92, ingredients: language === 'es' ? 'Pollo, caldo de pollo, hígado' : 'Chicken, chicken broth, liver' },
      { name: 'Fancy Feast Gravy Lovers', healthScore: 90, ingredients: language === 'es' ? 'Pescado, subproductos de pescado, caldo' : 'Fish, fish by-products, broth' },
      { name: 'Purina Pro Plan Wet Cat Food', healthScore: 89, ingredients: language === 'es' ? 'Pavo, hígado, caldo de pavo' : 'Turkey, liver, turkey broth' },
    ],
    mixed: [
      { name: 'Royal Canin Indoor Adult', healthScore: 91, ingredients: language === 'es' ? 'Pollo, arroz integral, fibra' : 'Chicken, brown rice, fiber' },
      { name: 'Hill\'s Science Diet Adult', healthScore: 88, ingredients: language === 'es' ? 'Pollo, arroz, gluten de maíz' : 'Chicken, rice, corn gluten meal' },
      { name: 'Iams Proactive Health', healthScore: 87, ingredients: language === 'es' ? 'Pollo, maíz molido, harina de pollo' : 'Chicken, ground corn, chicken meal' },
    ],
    treat: [
      { name: 'Temptations Classic Treats', healthScore: 85, ingredients: language === 'es' ? 'Pollo, cereales, grasas animales' : 'Chicken, cereals, animal fats' },
      { name: 'Greenies Feline Dental Treats', healthScore: 86, ingredients: language === 'es' ? 'Pollo, proteína vegetal, fibra' : 'Chicken, plant protein, fiber' },
      { name: 'Dreamies Cat Treats', healthScore: 84, ingredients: language === 'es' ? 'Carne, cereales, aceites y grasas' : 'Meat, cereals, oils and fats' },
    ],
  };

  const dogFoods: CategoryFoods = {
    dry: [
      { name: 'Orijen Original Dry Dog Food', healthScore: 95, ingredients: language === 'es' ? 'Pollo fresco, pavo, pescado, huevos' : 'Fresh chicken, turkey, fish, eggs' },
      { name: 'Acana Heritage Meats', healthScore: 94, ingredients: language === 'es' ? 'Ternera Angus, cerdo Yorkshire, cordero de pasto' : 'Angus beef, Yorkshire pork, grass-fed lamb' },
      { name: 'Taste of the Wild High Prairie', healthScore: 92, ingredients: language === 'es' ? 'Búfalo, harina de cordero, batatas' : 'Buffalo, lamb meal, sweet potatoes' },
    ],
    wet: [
      { name: 'Cesar Wet Dog Food', healthScore: 88, ingredients: language === 'es' ? 'Pollo, caldo de pollo, verduras' : 'Chicken, chicken broth, vegetables' },
      { name: 'Pedigree Choice Cuts', healthScore: 87, ingredients: language === 'es' ? 'Carne, subproductos cárnicos, caldo' : 'Meat, meat by-products, broth' },
      { name: 'Blue Buffalo Homestyle Recipe', healthScore: 89, ingredients: language === 'es' ? 'Pollo, caldo de pollo, arroz integral' : 'Chicken, chicken broth, brown rice' },
    ],
    mixed: [
      { name: 'Royal Canin Adult Dog', healthScore: 90, ingredients: language === 'es' ? 'Pollo, arroz, maíz, fibra' : 'Chicken, rice, corn, fiber' },
      { name: 'Hill\'s Science Diet Adult', healthScore: 88, ingredients: language === 'es' ? 'Pollo, trigo integral, maíz' : 'Chicken, whole grain wheat, corn' },
      { name: 'Purina Pro Plan Adult', healthScore: 89, ingredients: language === 'es' ? 'Pollo, arroz, harina de maíz' : 'Chicken, rice, corn meal' },
    ],
    treat: [
      { name: 'Pedigree Dentastix', healthScore: 82, ingredients: language === 'es' ? 'Cereales, derivados de origen vegetal, minerales' : 'Cereals, plant derivatives, minerals' },
      { name: 'Greenies Dog Dental Treats', healthScore: 85, ingredients: language === 'es' ? 'Proteína vegetal, fibra, vitaminas' : 'Plant protein, fiber, vitamins' },
      { name: 'Blue Buffalo Health Bars', healthScore: 84, ingredients: language === 'es' ? 'Pollo, avena, cebada' : 'Chicken, oats, barley' },
    ],
  };

  const foods = isCat ? catFoods : dogFoods;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 85) return '#84cc16';
    return '#fbbf24';
  };

  const renderFoodItem = (food: FoodItem) => (
    <View style={styles.foodCard}>
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
        <TouchableOpacity
          style={styles.affiliateButton}
          onPress={() => {
            const encodedProduct = encodeURIComponent(food.name);
            const amazonUrl = `https://www.amazon.es/s?k=${encodedProduct}&tag=danireee105-21`;
            Linking.openURL(amazonUrl);
          }}
        >
          <Text style={styles.affiliateButtonText}>{language === 'es' ? 'Ver en Amazon' : 'View on Amazon'}</Text>
          <ExternalLink size={12} color="#ffffff" strokeWidth={2} />
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
          {language === 'es' ? 'Mejores Alimentos' : 'Best Foods'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Alimentos mejor valorados' : 'Top Rated Foods'}
          </Text>

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Seco' : 'Dry'}
          </Text>
          {foods.dry.map((food, index) => (
            <View key={`dry-${index}`}>
              {renderFoodItem(food)}
            </View>
          ))}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Húmedo' : 'Wet'}
          </Text>
          {foods.wet.map((food, index) => (
            <View key={`wet-${index}`}>
              {renderFoodItem(food)}
            </View>
          ))}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Mixto' : 'Mixed'}
          </Text>
          {foods.mixed.map((food, index) => (
            <View key={`mixed-${index}`}>
              {renderFoodItem(food)}
            </View>
          ))}

          <Text style={styles.categoryTitle}>
            {language === 'es' ? 'Snack/Premio' : 'Treat/Snack'}
          </Text>
          {foods.treat.map((food, index) => (
            <View key={`treat-${index}`}>
              {renderFoodItem(food)}
            </View>
          ))}
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 16,
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
    marginBottom: 12,
  },
  affiliateButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  affiliateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
});
