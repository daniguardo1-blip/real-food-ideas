import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, UtensilsCrossed, Activity, Heart, Shield, DollarSign, Lightbulb, ShoppingBag, ExternalLink, Ban, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';

interface ToxicPlant {
  name: string;
  reason: string;
}

function getToxicPlants(petType: string, language: string): ToxicPlant[] {
  const petTypeLower = petType.toLowerCase();

  if (petTypeLower.includes('perro') || petTypeLower.includes('dog')) {
    return language === 'es'
      ? [
          {
            name: 'Lirio',
            reason: 'Altamente tóxico, puede causar insuficiencia renal grave.',
          },
          {
            name: 'Adelfa',
            reason: 'Extremadamente venenosa, afecta al corazón y sistema nervioso.',
          },
          {
            name: 'Azalea',
            reason: 'Causa vómitos, diarrea y problemas cardiovasculares.',
          },
          {
            name: 'Tulipán',
            reason: 'Los bulbos son tóxicos, causan irritación gastrointestinal.',
          },
          {
            name: 'Hortensia',
            reason: 'Contiene cianuro, puede causar problemas digestivos graves.',
          },
        ]
      : [
          {
            name: 'Lily',
            reason: 'Highly toxic, can cause severe kidney failure.',
          },
          {
            name: 'Oleander',
            reason: 'Extremely poisonous, affects heart and nervous system.',
          },
          {
            name: 'Azalea',
            reason: 'Causes vomiting, diarrhea and cardiovascular problems.',
          },
          {
            name: 'Tulip',
            reason: 'Bulbs are toxic, cause gastrointestinal irritation.',
          },
          {
            name: 'Hydrangea',
            reason: 'Contains cyanide, can cause severe digestive problems.',
          },
        ];
  } else if (petTypeLower.includes('gato') || petTypeLower.includes('cat')) {
    return language === 'es'
      ? [
          {
            name: 'Lirio',
            reason: 'Extremadamente peligroso, todas las partes son mortales para gatos.',
          },
          {
            name: 'Dieffenbachia',
            reason: 'Causa inflamación de boca y garganta, dificultad para tragar.',
          },
          {
            name: 'Filodendro',
            reason: 'Irritación oral severa, vómitos y dificultad respiratoria.',
          },
          {
            name: 'Potos',
            reason: 'Provoca irritación bucal, vómitos y exceso de salivación.',
          },
          {
            name: 'Aloe Vera',
            reason: 'El gel puede causar vómitos, diarrea y letargo.',
          },
        ]
      : [
          {
            name: 'Lily',
            reason: 'Extremely dangerous, all parts are deadly for cats.',
          },
          {
            name: 'Dieffenbachia',
            reason: 'Causes mouth and throat inflammation, difficulty swallowing.',
          },
          {
            name: 'Philodendron',
            reason: 'Severe oral irritation, vomiting and breathing difficulty.',
          },
          {
            name: 'Pothos',
            reason: 'Causes oral irritation, vomiting and excessive salivation.',
          },
          {
            name: 'Aloe Vera',
            reason: 'Gel can cause vomiting, diarrhea and lethargy.',
          },
        ];
  } else {
    // Default for other pets
    return language === 'es'
      ? [
          {
            name: 'Lirio',
            reason: 'Altamente tóxico para la mayoría de mascotas.',
          },
          {
            name: 'Adelfa',
            reason: 'Extremadamente peligrosa para todos los animales.',
          },
          {
            name: 'Azalea',
            reason: 'Causa problemas digestivos y cardiovasculares.',
          },
          {
            name: 'Ciclamen',
            reason: 'Irritación gastrointestinal y problemas cardíacos.',
          },
        ]
      : [
          {
            name: 'Lily',
            reason: 'Highly toxic to most pets.',
          },
          {
            name: 'Oleander',
            reason: 'Extremely dangerous for all animals.',
          },
          {
            name: 'Azalea',
            reason: 'Causes digestive and cardiovascular problems.',
          },
          {
            name: 'Cyclamen',
            reason: 'Gastrointestinal irritation and heart problems.',
          },
        ];
  }
}

export default function AIReportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();

  const { pet_type, breed, age, location, report } = params;

  const reportData = typeof report === 'string' ? JSON.parse(report) : report;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.aiReport.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.petInfoCard}>
          <Sparkles size={32} color="#fbbf24" strokeWidth={2} />
          <Text style={styles.petInfoTitle}>{t.aiReport.personalizedReport}</Text>
          <Text style={styles.petInfoText}>
            {t.aiReport.forYourPet} {age} {t.aiReport.old} {breed} {pet_type}
          </Text>
          <Text style={styles.petInfoSubtext}>{t.aiReport.livingIn} {location}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UtensilsCrossed size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.recommendedFood}</Text>
          </View>
          {reportData.recommended_food.map((food: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{food}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.nutritionAdvice}</Text>
          </View>
          <Text style={styles.bodyText}>{reportData.nutrition_advice}</Text>
        </View>

        {reportData.estimated_weight && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t.aiReport.estimatedWeight}</Text>
            </View>
            <Text style={styles.bodyText}>{reportData.estimated_weight}</Text>
          </View>
        )}

        {reportData.daily_food_amount && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t.aiReport.dailyFoodAmount}</Text>
            </View>
            <Text style={styles.bodyText}>{reportData.daily_food_amount}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.suggestedActivities}</Text>
          </View>
          {reportData.activities.map((activity: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{activity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.veterinaryCare}</Text>
          </View>
          <Text style={styles.bodyText}>{reportData.veterinary_care}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.preventiveCare}</Text>
          </View>
          {reportData.preventive_care.map((care: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{care}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <DollarSign size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.estimatedCosts}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t.aiReport.food}</Text>
            <Text style={styles.costValue}>{reportData.estimated_costs.food}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t.aiReport.veterinary}</Text>
            <Text style={styles.costValue}>{reportData.estimated_costs.veterinary}</Text>
          </View>
          {reportData.estimated_costs.grooming && (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>{t.aiReport.grooming}</Text>
              <Text style={styles.costValue}>{reportData.estimated_costs.grooming}</Text>
            </View>
          )}
          <View style={[styles.costRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t.aiReport.totalMonthly}</Text>
            <Text style={styles.totalValue}>{reportData.estimated_costs.total}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Lightbulb size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.cardTitle}>{t.aiReport.costOptimization}</Text>
          </View>
          {reportData.cost_tips.map((tip: string, index: number) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {reportData.shopping_list && reportData.shopping_list.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ShoppingBag size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t.aiReport.shoppingList}</Text>
            </View>
            {reportData.shopping_list.map((item: any, index: number) => (
              <View key={index} style={styles.shoppingItem}>
                <Text style={styles.shoppingItemName}>{item.name}</Text>
                <Text style={styles.shoppingItemDesc}>{item.description}</Text>
                <TouchableOpacity
                  style={styles.affiliateButton}
                  onPress={() => {
                    const encodedProduct = encodeURIComponent(item.name);
                    const amazonUrl = `https://www.amazon.es/s?k=${encodedProduct}&tag=danireee105-21`;
                    Linking.openURL(amazonUrl);
                  }}
                >
                  <Text style={styles.affiliateButtonText}>{t.affiliate.viewOnAmazon}</Text>
                  <ExternalLink size={14} color="#ffffff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {reportData.forbidden_foods && reportData.forbidden_foods.length > 0 && (
          <View style={styles.dangerCard}>
            <View style={styles.cardHeader}>
              <Ban size={24} color="#ef4444" strokeWidth={2} />
              <Text style={[styles.cardTitle, { color: '#ef4444' }]}>{t.aiReport.forbiddenFoods}</Text>
            </View>
            <View style={styles.warningBanner}>
              <AlertTriangle size={20} color="#dc2626" strokeWidth={2} />
              <Text style={styles.warningText}>{t.aiReport.forbiddenWarning}</Text>
            </View>
            {reportData.forbidden_foods.map((item: any, index: number) => (
              <View key={index} style={styles.forbiddenItem}>
                <View style={styles.forbiddenHeader}>
                  <Ban size={16} color="#ef4444" strokeWidth={2} />
                  <Text style={styles.forbiddenName}>{item.name}</Text>
                </View>
                <Text style={styles.forbiddenReason}>{item.reason}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.dangerCard}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={24} color="#ef4444" strokeWidth={2} />
            <Text style={[styles.cardTitle, { color: '#ef4444' }]}>
              {language === 'es' ? 'Plantas tóxicas' : 'Toxic plants'}
            </Text>
          </View>
          <View style={styles.warningBanner}>
            <AlertTriangle size={20} color="#dc2626" strokeWidth={2} />
            <Text style={styles.warningText}>
              {language === 'es'
                ? 'Mantén estas plantas fuera del alcance de tu mascota'
                : 'Keep these plants away from your pet'}
            </Text>
          </View>
          {getToxicPlants(String(pet_type).toLowerCase(), language).map((plant, index) => (
            <View key={index} style={styles.forbiddenItem}>
              <View style={styles.forbiddenHeader}>
                <AlertTriangle size={16} color="#ef4444" strokeWidth={2} />
                <Text style={styles.forbiddenName}>{plant.name}</Text>
              </View>
              <Text style={styles.forbiddenReason}>{plant.reason}</Text>
            </View>
          ))}
        </View>

        {reportData.disclaimer && (
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>{reportData.disclaimer}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => router.push('/pet-advisor')}
        >
          <Text style={styles.updateButtonText}>{t.aiReport.updatePetInfo}</Text>
        </TouchableOpacity>
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
  petInfoCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 24,
    margin: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  petInfoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 8,
  },
  petInfoText: {
    fontSize: 16,
    color: '#92400e',
    marginBottom: 4,
  },
  petInfoSubtext: {
    fontSize: 14,
    color: '#92400e',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    flexWrap: 'wrap',
  },
  bodyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 7,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  costLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 8,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    margin: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  shoppingItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shoppingItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  shoppingItemDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  affiliateButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  affiliateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '100%',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    lineHeight: 20,
  },
  forbiddenItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  forbiddenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  forbiddenName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    flex: 1,
    flexWrap: 'wrap',
  },
  forbiddenReason: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  disclaimerCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
