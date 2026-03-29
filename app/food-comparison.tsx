import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { calculatePetFoodScore } from '@/lib/petFoodScoring';

function IngredientCell({ product, getTop5Ingredients }: { product: any; getTop5Ingredients: (p: any) => Promise<string> }) {
  const [ingredients, setIngredients] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIngredients();
  }, [product]);

  const loadIngredients = async () => {
    setLoading(true);
    const result = await getTop5Ingredients(product);
    setIngredients(result);
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#6b7280" />;
  }

  return (
    <Text style={styles.ingredientsText} numberOfLines={4}>
      {ingredients || 'N/A'}
    </Text>
  );
}

interface Product {
  id: string;
  name: string;
  barcode: string;
  health_score: number;
  ingredients: string[];
  ingredients_text: string;
  nutriments: any;
  price?: string;
  brands?: string;
}

export default function FoodComparisonScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [translatedIngredients, setTranslatedIngredients] = useState<{[key: string]: string}>({});

  useEffect(() => {
    checkPremiumAndLoadProducts();
  }, []);

  const checkPremiumAndLoadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        loadProducts(user.id);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProducts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('scanned_products')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      if (data && data.length > 0) {
        const uniqueProducts = new Map();

        data.forEach(item => {
          if (!uniqueProducts.has(item.barcode)) {
            uniqueProducts.set(item.barcode, item);
          }
        });

        const uniqueArray = Array.from(uniqueProducts.values());

        setProducts(uniqueArray.map(item => ({
          id: item.id,
          name: item.product_name || 'Unknown Product',
          barcode: item.barcode,
          brands: item.brands || '',
          health_score: calculateHealthScore(item),
          ingredients: item.ingredients_text ? item.ingredients_text.split(',').map((i: string) => i.trim()) : [],
          ingredients_text: item.ingredients_text || '',
          nutriments: item.nutriments || {},
          price: item.price,
        })));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const calculateHealthScore = (item: any): number => {
    const result = calculatePetFoodScore({
      product_name: item.product_name || '',
      brands: item.brands || '',
      ingredients_text: item.ingredients_text || '',
      nutriments: item.nutriments || {},
      categories: item.categories || '',
      nutriscore_grade: item.nutriscore_grade || '',
    }, language);

    return result.score;
  };

  const calculateScoreFromGrade = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'a': 95,
      'b': 85,
      'c': 70,
      'd': 50,
      'e': 30,
    };
    return gradeMap[grade.toLowerCase()] || 0;
  };

  const toggleProductSelection = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length < 3) {
        setSelectedProducts([...selectedProducts, product]);
      } else {
        Alert.alert(t.common.error, t.comparison.maxProductsError);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#fbbf24';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score === 0) return t.product.insufficientData || 'Datos insuficientes';
    if (score >= 80) return t.product.excellent;
    if (score >= 60) return t.product.good;
    if (score >= 40) return t.product.average;
    if (score >= 20) return t.product.poor;
    return t.product.veryPoor;
  };

  const translateIngredients = async (text: string): Promise<string> => {
    if (!text) return '';

    if (language === 'en') return text;

    if (translatedIngredients[text]) {
      return translatedIngredients[text];
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      const translated = data[0]?.map((item: any) => item[0]).join('') || text;

      setTranslatedIngredients(prev => ({ ...prev, [text]: translated }));
      return translated;
    } catch (error) {
      return text;
    }
  };

  const getTop5Ingredients = async (product: Product): Promise<string> => {
    const ingredients = product.ingredients.slice(0, 5);
    const ingredientsText = ingredients.join(', ');

    if (language !== 'en' && ingredientsText) {
      return await translateIngredients(ingredientsText);
    }

    return ingredientsText;
  };

  const detectWarnings = (product: Product): string[] => {
    const warnings: string[] = [];
    const ingredientsLower = product.ingredients_text.toLowerCase();

    if (ingredientsLower.includes('by-product') ||
        ingredientsLower.includes('subproduct') ||
        ingredientsLower.includes('subproducto')) {
      warnings.push(language === 'es' ? 'Subproductos animales' : 'Animal by-products');
    }

    if (ingredientsLower.includes('cereal') ||
        ingredientsLower.includes('grain') ||
        ingredientsLower.includes('wheat') ||
        ingredientsLower.includes('trigo') ||
        ingredientsLower.includes('maíz') ||
        ingredientsLower.includes('corn')) {
      warnings.push(language === 'es' ? 'Cereales' : 'Grains');
    }

    if (ingredientsLower.includes('artificial color') ||
        ingredientsLower.includes('colorant') ||
        ingredientsLower.includes('colorante artificial')) {
      warnings.push(language === 'es' ? 'Colorantes artificiales' : 'Artificial colors');
    }

    if (ingredientsLower.includes('preservative') ||
        ingredientsLower.includes('bha') ||
        ingredientsLower.includes('bht') ||
        ingredientsLower.includes('conservante')) {
      warnings.push(language === 'es' ? 'Conservantes artificiales' : 'Artificial preservatives');
    }

    if (ingredientsLower.includes('sugar') ||
        ingredientsLower.includes('syrup') ||
        ingredientsLower.includes('azúcar')) {
      warnings.push(language === 'es' ? 'Azúcares añadidos' : 'Added sugars');
    }

    return warnings;
  };

  const getNutrientValue = (product: Product, nutrient: string): string => {
    const value = product.nutriments?.[nutrient];
    if (!value) return 'N/A';
    return `${parseFloat(value).toFixed(1)}g`;
  };

  const getEnergyValue = (product: Product): string => {
    const energy = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy_100g'];
    if (!energy) return 'N/A';
    return `${Math.round(parseFloat(energy))} kcal`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.comparison.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {selectedProducts.length === 0 ? (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{t.comparison.selectProducts}</Text>
            <Text style={styles.instructionText}>
              {t.comparison.selectUpTo3}
            </Text>
          </View>
        ) : (
          <View style={styles.comparisonContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.comparisonTable}>
                <View style={styles.headerRow}>
                  <View style={styles.labelColumn}>
                    <Text style={styles.tableHeaderText}></Text>
                  </View>
                  {selectedProducts.map((product, index) => (
                    <View key={product.id} style={styles.productColumn}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tableRow}>
                  <View style={styles.labelColumn}>
                    <Text style={styles.labelText}>{t.comparison.healthScore}</Text>
                  </View>
                  {selectedProducts.map((product) => (
                    <View key={product.id} style={styles.productColumn}>
                      <View style={[styles.scoreBox, { backgroundColor: getScoreColor(product.health_score) }]}>
                        <Text style={styles.scoreText}>{product.health_score || 0}</Text>
                      </View>
                      <Text style={styles.scoreLabelText}>{getScoreLabel(product.health_score)}</Text>
                    </View>
                  ))}
                </View>

              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.productList}>
          <Text style={styles.sectionTitle}>{t.comparison.yourScannedProducts}</Text>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t.comparison.noProducts}</Text>
              <Text style={styles.emptyStateText}>{t.comparison.scanProductsFirst}</Text>
            </View>
          ) : (
            products.map((product) => {
              const isSelected = selectedProducts.find(p => p.id === product.id);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, isSelected && styles.productCardSelected]}
                  onPress={() => toggleProductSelection(product)}
                >
                  <View style={styles.productCardContent}>
                    <Text style={styles.productCardName}>{product.name}</Text>
                    <View style={[styles.scoreChip, { backgroundColor: getScoreColor(product.health_score) }]}>
                      <Text style={styles.scoreChipText}>{product.health_score}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <CheckCircle size={24} color="#10b981" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
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
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  comparisonContainer: {
    marginBottom: 24,
  },
  comparisonTable: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  labelColumn: {
    width: 120,
    justifyContent: 'center',
  },
  productColumn: {
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scoreBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreLabelText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  ingredientsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productList: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  productCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  productCardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  scoreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  warningsList: {
    gap: 6,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningItemText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
  },
  noWarningsText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
  nutrientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});
