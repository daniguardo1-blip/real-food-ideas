import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, TriangleAlert as AlertTriangle, Flame, Droplet, ExternalLink, Info, Lock, X } from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import { detectProductType, detectPetSpecies } from '@/lib/productLookup';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import { calculatePetFoodScore, type ScoringResult } from '@/lib/petFoodScoring';
import { BlurredContent } from '@/lib/BlurredContent';
import { detectProductType as detectFoodVsNonFood, calculateNonFoodSafetyScore, generateNonFoodAlternative, type NonFoodSafetyResult } from '@/lib/nonFoodScoring';
import { generatePersonalizedReport } from '@/lib/personalizedReportGenerator';
import { findBestFreeAlternative, findBestPersonalizedAlternative } from '@/lib/alternativeSelection';

interface AlternativeProduct {
  barcode: string;
  product_name: string;
  brands: string;
  image_url: string;
  healthScore: number;
  scoreReason?: string;
}

type DetailedAnalysisResult =
  | {
      isValid: false;
      errorMessage: string;
    }
  | {
      isValid: true;
      ingredientQuality: string;
      suitability: string;
      ageRecommendation: string;
      advice: string[];
      detailedWarnings: string[];
    };

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function ProductResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [translatedIngredients, setTranslatedIngredients] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [betterAlternative, setBetterAlternative] = useState<AlternativeProduct | null>(null);
  const [isLoadingAlternative, setIsLoadingAlternative] = useState(false);
  const [premiumAlternative, setPremiumAlternative] = useState<AlternativeProduct | null>(null);
  const [premiumAlternativeError, setPremiumAlternativeError] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const { toggleFavorite: toggleFavoriteContext, favorites } = useFavorites();
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [nonFoodResult, setNonFoodResult] = useState<NonFoodSafetyResult | null>(null);
  const [isNonFood, setIsNonFood] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { petProfile } = usePetProfile();
  const [productValidationError, setProductValidationError] = useState<string | null>(null);

  const {
    barcode,
    product_name,
    brands,
    image_url,
    ingredients_text,
    nutriments,
    nutriscore_grade,
    categories,
    isAlternative,
  } = params;

  const nutrimentsParsed =
    typeof nutriments === 'string' ? JSON.parse(nutriments) : nutriments;

  const productType = detectProductType({
    product_name: String(product_name || ''),
    brands: String(brands || ''),
    image_url: String(image_url || ''),
    ingredients_text: String(ingredients_text || ''),
    nutriments: nutrimentsParsed,
    nutriscore_grade: String(nutriscore_grade || ''),
    categories: String(categories || ''),
  });

  useEffect(() => {
    checkPremiumStatus();
    translateIngredients();
    calculateScore();
    saveToCache();
    saveToHistory();
  }, [language]);

  useEffect(() => {
    if (scoringResult) {
      findBetterAlternatives();
    }
  }, [scoringResult]);

  useEffect(() => {
    calculateScore();
    findBetterAlternatives();
  }, [barcode]);

  useEffect(() => {
    console.log('[ProductResult] Premium status or pet profile changed, recalculating alternatives...');
    if (scoringResult) {
      findBetterAlternatives();
    }
  }, [isPremium, petProfile]);

  const calculateScore = () => {
    const productData = {
      product_name: String(product_name || ''),
      brands: String(brands || ''),
      ingredients_text: String(ingredients_text || ''),
      nutriments: nutrimentsParsed,
      categories: String(categories || ''),
      nutriscore_grade: String(nutriscore_grade || ''),
      image_url: String(image_url || ''),
    };

    const productTypeDetected = detectFoodVsNonFood(productData);
    setIsNonFood(productTypeDetected === 'non-food');

    if (productTypeDetected === 'non-food') {
      const nonFoodScore = calculateNonFoodSafetyScore(productData, language);
      setNonFoodResult(nonFoodScore);
      setScoringResult({
        score: nonFoodScore.score,
        hasEnoughData: !nonFoodScore.hasLimitedData,
        explanation: nonFoodScore.explanation,
        label: nonFoodScore.score >= 75 ? (language === 'es' ? 'Seguro' : 'Safe') :
               nonFoodScore.score >= 50 ? (language === 'es' ? 'Precaución' : 'Caution') :
               (language === 'es' ? 'Riesgo' : 'Risk'),
        productType: 'unknown' as const,
        confidence: nonFoodScore.hasLimitedData ? 'low' as const : 'high' as const,
      });
      return;
    }

    const detectedSpecies = detectPetSpecies(productData);
    const userPetType = petProfile?.pet_type?.toLowerCase();

    if (detectedSpecies !== 'unknown' && userPetType && detectedSpecies !== userPetType) {
      const errorMsg = language === 'es'
        ? `Este alimento no es para ${userPetType === 'cat' ? 'gatos' : 'perros'}. Si quieres ver productos de otro tipo, puedes cambiar tu mascota en la parte de perfil.`
        : `This food is not for ${userPetType === 'cat' ? 'cats' : 'dogs'}. If you want to see products for another type, you can change your pet in the profile section.`;
      setProductValidationError(errorMsg);
      return;
    }

    setProductValidationError(null);

    const result = calculatePetFoodScore({
      product_name: String(product_name || ''),
      brands: String(brands || ''),
      ingredients_text: String(ingredients_text || ''),
      nutriments: nutrimentsParsed,
      categories: String(categories || ''),
      nutriscore_grade: String(nutriscore_grade || ''),
    }, language);

    setScoringResult(result);
  };

  const saveToHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !barcode) return;

      const { error } = await supabase
        .from('scanned_products')
        .upsert({
          user_id: user.id,
          barcode: String(barcode),
          product_name: String(product_name || ''),
          brands: String(brands || ''),
          image_url: String(image_url || ''),
          ingredients_text: String(ingredients_text || ''),
          nutriments: nutrimentsParsed || {},
          nutriscore_grade: String(nutriscore_grade || ''),
          scanned_at: new Date().toISOString(),
        }, { onConflict: 'user_id,barcode' });

      if (error) {
        console.error('[ProductResult] Error saving to history:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      } else {
        console.log('[ProductResult] ✅ Product saved to history');
      }
    } catch (error) {
      console.error('[ProductResult] Unexpected error saving to history:', error);
    }
  };

  const translateIngredients = async () => {
    if (!ingredients_text || typeof ingredients_text !== 'string') {
      setTranslatedIngredients('');
      return;
    }

    if (language === 'en') {
      setTranslatedIngredients(String(ingredients_text));
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(ingredients_text)}`
      );
      const data = await response.json();
      const translated = data[0]?.map((item: any) => item[0]).join('') || String(ingredients_text);
      setTranslatedIngredients(translated);
    } catch (error) {
      setTranslatedIngredients(String(ingredients_text));
    } finally {
      setIsTranslating(false);
    }
  };


  const checkPremiumStatus = useCallback(async () => {
    try {
      console.log('[ProductResult] Checking premium status...');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_subscribed')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[ProductResult] Error fetching premium status:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          setIsPremium(false);
          return;
        }

        const newPremiumStatus = data?.is_subscribed || false;
        console.log('[ProductResult] Premium status:', newPremiumStatus);
        setIsPremium(newPremiumStatus);
      }
    } catch (error) {
      console.error('[ProductResult] Unexpected error checking premium status:', error);
      setIsPremium(false);
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      console.log('[ProductResult] 🔄 Starting subscription process...');

      const profileResult = await ensureUserProfile();

      if (!profileResult.success || !profileResult.profile) {
        console.error('[ProductResult] ❌ Could not ensure profile:', profileResult.error);
        Alert.alert(
          language === 'es' ? 'Error' : 'Error',
          language === 'es'
            ? profileResult.error || 'No se pudo verificar tu perfil'
            : profileResult.error || 'Could not verify your profile'
        );
        return;
      }

      if (profileResult.schemaMismatch) {
        console.warn('[ProductResult] ⚠️ Schema mismatch detected, skipping subscription update');
        Alert.alert(
          language === 'es' ? 'Error de configuración' : 'Configuration Error',
          language === 'es'
            ? 'Hay un problema con la configuración de la base de datos. Por favor contacta soporte.'
            : 'There is a problem with database configuration. Please contact support.'
        );
        return;
      }

      console.log('[ProductResult] ✅ Profile ensured, updating subscription...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_subscribed: true,
          subscription_started_at: new Date().toISOString(),
          subscription_canceled_at: null,
        })
        .eq('id', profileResult.profile.id);

      if (updateError) {
        console.error('[ProductResult] ❌ Error updating subscription:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        Alert.alert(
          language === 'es' ? 'Error' : 'Error',
          language === 'es' ? 'No se pudo activar la suscripción' : 'Could not activate subscription'
        );
        return;
      }

      console.log('[ProductResult] ✅ Subscription updated successfully');

      const { data: updatedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('is_subscribed')
        .eq('id', profileResult.profile.id)
        .maybeSingle();

      if (verifyError) {
        console.error('[ProductResult] ⚠️ Error verifying subscription:', {
          code: verifyError.code,
          message: verifyError.message,
          details: verifyError.details,
          hint: verifyError.hint,
        });
      }

      const finalStatus = updatedProfile?.is_subscribed || false;
      console.log('[ProductResult] ✅ Verified subscription status:', finalStatus);
      setIsPremium(finalStatus);

      setShowSubscriptionModal(false);

      Alert.alert(
        language === 'es' ? '✅ Suscripción activada' : '✅ Subscription activated',
        language === 'es' ? 'Ahora tienes acceso a todos los informes detallados' : 'You now have access to all detailed reports'
      );

      console.log('[ProductResult] 🎉 Subscription process completed successfully');
    } catch (error) {
      console.error('[ProductResult] ❌ Unexpected error subscribing:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Ocurrió un error inesperado' : 'An unexpected error occurred'
      );
    }
  };

  const saveToCache = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !barcode) return;

      const { data: existingProduct } = await supabase
        .from('products_cache')
        .select('*')
        .eq('barcode', String(barcode))
        .maybeSingle();

      const productData = {
        barcode: String(barcode),
        product_name: String(product_name || ''),
        brands: String(brands || ''),
        image_url: String(image_url || ''),
        ingredients_text: String(ingredients_text || ''),
        nutriments: nutrimentsParsed || {},
        categories: String(categories || ''),
        nutriscore_grade: String(nutriscore_grade || ''),
        product_type: productType,
        updated_at: new Date().toISOString(),
      };

      if (existingProduct) {
        await supabase
          .from('products_cache')
          .update(productData)
          .eq('barcode', String(barcode));
      } else {
        await supabase.from('products_cache').insert(productData);
      }
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await toggleFavoriteContext({
        barcode: String(barcode),
        product_name: String(product_name),
        brands: String(brands),
        image_url: String(image_url),
        nutriscore_grade: String(nutriscore_grade),
      });
    } catch (error) {
      Alert.alert(t.common.error, 'Failed to update favorites');
    }
  };

  const isFavorite = barcode ? favorites.some(f => f.barcode === String(barcode)) : false;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#84cc16';
    if (score >= 55) return '#fbbf24';
    if (score >= 35) return '#f97316';
    return '#ef4444';
  };

  const checkForWarnings = () => {
    if (!ingredients_text || typeof ingredients_text !== 'string') return [];

    const warnings = [];
    const ingredientsLower = String(ingredients_text).toLowerCase();

    if (
      ingredientsLower.includes('artificial') ||
      ingredientsLower.includes('preservative') ||
      ingredientsLower.includes('bha') ||
      ingredientsLower.includes('bht') ||
      ingredientsLower.includes('ethoxyquin')
    ) {
      warnings.push({
        title: t.product.artificialPreservatives,
        description: 'May cause health issues in some pets',
      });
    }

    if (
      ingredientsLower.includes('color') ||
      ingredientsLower.includes('dye') ||
      ingredientsLower.includes('artificial color')
    ) {
      warnings.push({
        title: t.product.artificialColors,
        description: 'Unnecessary additives that provide no nutritional value',
      });
    }

    if (
      ingredientsLower.includes('sugar') ||
      ingredientsLower.includes('corn syrup') ||
      ingredientsLower.includes('fructose')
    ) {
      warnings.push({
        title: t.product.addedSugars,
        description: 'Can lead to obesity and dental problems',
      });
    }

    if (
      ingredientsLower.includes('by-product') ||
      ingredientsLower.includes('meat meal') ||
      ingredientsLower.includes('bone meal')
    ) {
      warnings.push({
        title: t.product.lowQualityMeat,
        description: 'Contains meat by-products or meals of unclear origin',
      });
    }

    return warnings;
  };

  const warnings = isNonFood && nonFoodResult
    ? nonFoodResult.warnings.map(w => ({
        title: language === 'es' ? 'Advertencia de seguridad' : 'Safety warning',
        description: w,
      }))
    : checkForWarnings();

  const detectAgeRecommendation = (): string => {
    const productNameLower = String(product_name || '').toLowerCase();
    const categoriesLower = String(categories || '').toLowerCase();
    const combined = `${productNameLower} ${categoriesLower}`;

    if (combined.includes('puppy') || combined.includes('junior') || combined.includes('cachorro')) {
      return language === 'es'
        ? '🐕 Este producto está formulado para cachorros (hasta 12 meses aproximadamente). Contiene niveles más altos de proteínas y calorías para apoyar el crecimiento.'
        : '🐕 This product is formulated for puppies (up to approximately 12 months). Contains higher levels of protein and calories to support growth.';
    }

    if (combined.includes('kitten') || combined.includes('gatito')) {
      return language === 'es'
        ? '🐱 Este producto está diseñado para gatitos (hasta 12 meses). Aporta nutrientes esenciales para el desarrollo de gatos jóvenes.'
        : '🐱 This product is designed for kittens (up to 12 months). Provides essential nutrients for young cat development.';
    }

    if (combined.includes('senior') || combined.includes('aged') || combined.includes('7+') || combined.includes('8+') || combined.includes('veterano')) {
      return language === 'es'
        ? '🦴 Este producto está orientado a mascotas senior (7+ años). Formulación adaptada para necesidades de animales mayores, con menor contenido calórico y apoyo articular.'
        : '🦴 This product is oriented for senior pets (7+ years). Formula adapted for older animals needs, with lower caloric content and joint support.';
    }

    if (combined.includes('steril') || combined.includes('light') || combined.includes('esterilizado') || combined.includes('castrado')) {
      return language === 'es'
        ? '⚖️ Este producto es adecuado para mascotas esterilizadas/castradas o con tendencia al sobrepeso. Generalmente apropiado para adultos (1-7 años).'
        : '⚖️ This product is suitable for sterilized/neutered pets or those prone to overweight. Generally appropriate for adults (1-7 years).';
    }

    if (combined.includes('adult') || combined.includes('adulto')) {
      return language === 'es'
        ? '🐾 Este producto está diseñado para mascotas adultas (1-7 años). Mantiene un balance nutricional para la etapa de madurez.'
        : '🐾 This product is designed for adult pets (1-7 years). Maintains nutritional balance for the maturity stage.';
    }

    return language === 'es'
      ? '📋 No se especifica rango de edad concreto. Parece ser un alimento de mantenimiento para mascotas adultas sanas. Consulta con tu veterinario si tu mascota es cachorro, senior o tiene necesidades especiales.'
      : '📋 No specific age range specified. Appears to be a maintenance food for healthy adult pets. Consult your veterinarian if your pet is a puppy, senior, or has special needs.';
  };

  const detailedAnalysis = useMemo((): DetailedAnalysisResult | null => {
    if (!scoringResult || !ingredients_text) return null;

    const personalizedReport = generatePersonalizedReport(
      petProfile,
      {
        product_name: String(product_name || ''),
        brands: String(brands || ''),
        ingredients_text: String(ingredients_text || ''),
        nutriments: nutrimentsParsed,
        categories: String(categories || ''),
      },
      scoringResult.score,
      language
    );

    if (!personalizedReport.isValid) {
      return { isValid: false, errorMessage: personalizedReport.errorMessage || '' } as const;
    }

    return {
      isValid: true,
      ingredientQuality: personalizedReport.ingredientQuality,
      suitability: personalizedReport.suitability,
      ageRecommendation: personalizedReport.ageRecommendation,
      advice: personalizedReport.advice,
      detailedWarnings: personalizedReport.detailedWarnings,
    } as const;
  }, [scoringResult, ingredients_text, petProfile, product_name, brands, nutrimentsParsed, categories, language]);

  useEffect(() => {
    if (detailedAnalysis && !detailedAnalysis.isValid) {
      setProductValidationError((detailedAnalysis as { isValid: false; errorMessage: string }).errorMessage || '');
    } else {
      setProductValidationError(null);
    }
  }, [detailedAnalysis]);

  const generateDetailedAnalysisLegacy = () => {
    if (!scoringResult || !ingredients_text) return null;

    const ingredientsLower = String(ingredients_text).toLowerCase();
    const analysis = {
      ingredientQuality: '',
      suitability: '',
      ageRecommendation: detectAgeRecommendation(),
      advice: [] as string[],
      detailedWarnings: [] as string[],
    };

    if (scoringResult.score >= 85) {
      analysis.ingredientQuality = language === 'es'
        ? 'Este producto contiene ingredientes de alta calidad. Los primeros ingredientes son proteínas de origen animal bien definidas, lo cual es excelente para la salud de tu mascota.'
        : 'This product contains high-quality ingredients. The first ingredients are well-defined animal proteins, which is excellent for your pet\'s health.';
    } else if (scoringResult.score >= 70) {
      analysis.ingredientQuality = language === 'es'
        ? 'Este producto tiene ingredientes de calidad aceptable. Contiene una buena fuente de proteínas, aunque puede incluir algunos ingredientes procesados.'
        : 'This product has acceptable quality ingredients. It contains a good source of protein, though it may include some processed ingredients.';
    } else if (scoringResult.score >= 55) {
      analysis.ingredientQuality = language === 'es'
        ? 'Este producto contiene ingredientes de calidad media. Puede incluir subproductos animales o cereales como ingredientes principales.'
        : 'This product contains medium-quality ingredients. It may include animal by-products or grains as main ingredients.';
    } else {
      analysis.ingredientQuality = language === 'es'
        ? 'Este producto contiene ingredientes de baja calidad. Los ingredientes principales pueden ser subproductos poco definidos o exceso de cereales y rellenos.'
        : 'This product contains low-quality ingredients. Main ingredients may be poorly defined by-products or excess grains and fillers.';
    }

    if (productType && 'isVeterinaryDiet' in productType && productType.isVeterinaryDiet) {
      analysis.suitability = language === 'es'
        ? 'Este es un alimento veterinario de prescripción. Sigue las indicaciones de tu veterinario sobre su uso. No lo sustituyas sin consultar primero.'
        : 'This is a veterinary prescription food. Follow your veterinarian\'s instructions for use. Do not substitute without consulting first.';
    } else if (productType && ('isTreat' in productType || 'isSnack' in productType) && (productType.isTreat || productType.isSnack)) {
      analysis.suitability = language === 'es'
        ? 'Este producto es un snack o premio. No debe ser la comida principal. Ofrece solo en pequeñas cantidades como complemento a una dieta balanceada.'
        : 'This product is a treat or snack. It should not be the main food. Offer only in small amounts as a complement to a balanced diet.';
    } else {
      if (scoringResult.score >= 70) {
        analysis.suitability = language === 'es'
          ? 'Este producto puede ser usado como alimento base para tu mascota. Proporciona una nutrición adecuada para el día a día.'
          : 'This product can be used as a base food for your pet. It provides adequate nutrition for daily use.';
      } else {
        analysis.suitability = language === 'es'
          ? 'Este producto puede no ser óptimo como alimento base único. Considera complementarlo o buscar alternativas de mejor calidad.'
          : 'This product may not be optimal as a sole base food. Consider supplementing it or looking for higher quality alternatives.';
      }
    }

    if (scoringResult.score >= 85) {
      analysis.advice.push(
        language === 'es'
          ? 'Continúa con este alimento si tu mascota lo tolera bien.'
          : 'Continue with this food if your pet tolerates it well.'
      );
    } else if (scoringResult.score < 55) {
      analysis.advice.push(
        language === 'es'
          ? 'Considera gradualmente cambiar a un alimento de mejor calidad.'
          : 'Consider gradually switching to a higher quality food.'
      );
    }

    analysis.advice.push(
      language === 'es'
        ? 'Asegúrate de que tu mascota tenga siempre agua fresca disponible.'
        : 'Make sure your pet always has fresh water available.'
    );

    if (!productType || !('isVeterinaryDiet' in productType) || !productType.isVeterinaryDiet) {
      analysis.advice.push(
        language === 'es'
          ? 'Consulta con tu veterinario si notas cambios en el apetito o digestión de tu mascota.'
          : 'Consult your veterinarian if you notice changes in your pet\'s appetite or digestion.'
      );
    }

    if (ingredientsLower.includes('artificial') || ingredientsLower.includes('bha') || ingredientsLower.includes('bht')) {
      analysis.detailedWarnings.push(
        language === 'es'
          ? 'Conservantes artificiales: BHA, BHT y etoxiquina han sido relacionados con problemas de salud en mascotas. Considera opciones con conservantes naturales como vitamina E.'
          : 'Artificial preservatives: BHA, BHT, and ethoxyquin have been linked to health issues in pets. Consider options with natural preservatives like vitamin E.'
      );
    }

    if (ingredientsLower.includes('color') || ingredientsLower.includes('dye')) {
      analysis.detailedWarnings.push(
        language === 'es'
          ? 'Colorantes artificiales: No aportan valor nutricional y pueden causar alergias o reacciones adversas en algunas mascotas.'
          : 'Artificial colors: They provide no nutritional value and may cause allergies or adverse reactions in some pets.'
      );
    }

    if (ingredientsLower.includes('sugar') || ingredientsLower.includes('corn syrup')) {
      analysis.detailedWarnings.push(
        language === 'es'
          ? 'Azúcares añadidos: Pueden causar obesidad, diabetes y problemas dentales. Los alimentos para mascotas no necesitan azúcares añadidos.'
          : 'Added sugars: Can cause obesity, diabetes, and dental problems. Pet foods do not need added sugars.'
      );
    }

    if (ingredientsLower.includes('by-product') || ingredientsLower.includes('meal')) {
      analysis.detailedWarnings.push(
        language === 'es'
          ? 'Subproductos animales: Los subproductos poco definidos pueden incluir partes de baja calidad. Busca fuentes de proteína claramente identificadas (ej: "pollo" en lugar de "subproductos de ave").'
          : 'Animal by-products: Poorly defined by-products may include low-quality parts. Look for clearly identified protein sources (e.g., "chicken" instead of "poultry by-products").'
      );
    }

    if (ingredientsLower.includes('corn') || ingredientsLower.includes('wheat') || ingredientsLower.includes('soy')) {
      const grainCount = (ingredientsLower.match(/corn|wheat|soy|rice/g) || []).length;
      if (grainCount >= 3) {
        analysis.detailedWarnings.push(
          language === 'es'
            ? 'Exceso de cereales: Un alto contenido de cereales puede indicar menos proteína animal de calidad. Los carnívoros necesitan principalmente proteínas animales.'
            : 'Excess grains: High grain content may indicate less quality animal protein. Carnivores need primarily animal proteins.'
        );
      }
    }

    return analysis;
  };

  const generateAmazonAffiliateLink = (productName: string, brandName: string): string => {
    const AFFILIATE_TAG = 'danireee105-21';
    const searchQuery = `${brandName} ${productName}`.trim().replace(/\s+/g, '+');
    return `https://www.amazon.es/s?k=${searchQuery}&tag=${AFFILIATE_TAG}`;
  };

  const getAlternativeReasonText = (healthScore: number): string => {
    if (healthScore >= 85) {
      return language === 'es'
        ? 'Excelente calidad de ingredientes y composición nutricional óptima'
        : 'Excellent ingredient quality and optimal nutritional composition';
    } else if (healthScore >= 75) {
      return language === 'es'
        ? 'Mejor balance nutricional y ingredientes de mayor calidad'
        : 'Better nutritional balance and higher quality ingredients';
    } else {
      return language === 'es'
        ? 'Opción más saludable con mejores ingredientes'
        : 'Healthier option with better ingredients';
    }
  };

  const findBetterAlternatives = async () => {
    if (!scoringResult) {
      return;
    }

    if (isAlternative === 'true') {
      return;
    }

    if (isNonFood && nonFoodResult) {
      const alternative = generateNonFoodAlternative(
        {
          product_name: String(product_name || ''),
          ingredients_text: String(ingredients_text || ''),
          categories: String(categories || ''),
        },
        language
      );

      setBetterAlternative({
        barcode: '',
        product_name: alternative.name,
        brands: '',
        image_url: '',
        healthScore: 85,
        scoreReason: alternative.reason,
      });
      setIsLoadingAlternative(false);
      return;
    }

    setIsLoadingAlternative(true);
    setBetterAlternative(null);
    setPremiumAlternative(null);
    setPremiumAlternativeError(null);

    try {
      const currentProductData = {
        barcode: String(barcode || ''),
        product_name: String(product_name || ''),
        categories: String(categories || ''),
        ingredients_text: String(ingredients_text || ''),
      };

      const freeAlternative = await findBestFreeAlternative(
        currentProductData,
        scoringResult.score,
        language
      );

      if (freeAlternative) {
        setBetterAlternative(freeAlternative);
      }

      if (isPremium) {
        const personalizedResult = await findBestPersonalizedAlternative(
          currentProductData,
          scoringResult.score,
          petProfile,
          language
        );

        if (personalizedResult.validationError) {
          setPremiumAlternativeError(personalizedResult.validationError);
        } else if (personalizedResult.alternative) {
          setPremiumAlternative(personalizedResult.alternative);
        }
      }
    } catch (error) {
      console.error('Error finding better alternatives:', error);
    } finally {
      setIsLoadingAlternative(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.product.title}</Text>
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Heart
            size={24}
            color={isFavorite ? '#ef4444' : '#6b7280'}
            fill={isFavorite ? '#ef4444' : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imageContainer}>
          {image_url && typeof image_url === 'string' && image_url.length > 0 ? (
            <Image
              source={{ uri: image_url }}
              style={styles.productImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.productName}>{capitalizeFirstLetter(String(product_name || 'Unknown Product'))}</Text>
          {brands && typeof brands === 'string' && brands.length > 0 && (
            <Text style={styles.productBrand}>{String(brands)}</Text>
          )}
        </View>

        {productValidationError ? (
          <View style={[styles.card, styles.errorCard]}>
            <View style={styles.errorHeader}>
              <AlertTriangle size={28} color="#dc2626" strokeWidth={2} />
              <Text style={styles.errorTitle}>
                {language === 'es' ? 'Producto no compatible' : 'Incompatible product'}
              </Text>
            </View>
            <Text style={styles.errorMessage}>{productValidationError}</Text>
          </View>
        ) : null}

        {scoringResult?.badge && scoringResult?.notice && (
          <View style={[
            styles.card,
            styles.noticeCard,
            { backgroundColor: scoringResult.productType === 'veterinary' ? '#dbeafe' : '#fef3c7', borderLeftColor: scoringResult.productType === 'veterinary' ? '#2563eb' : '#d97706' }
          ]}>
            <View style={styles.noticeHeader}>
              <Info size={24} color={scoringResult.productType === 'veterinary' ? '#2563eb' : '#d97706'} strokeWidth={2} />
              <Text style={[styles.noticeTitle, { color: scoringResult.productType === 'veterinary' ? '#2563eb' : '#d97706' }]}>
                {scoringResult.badge}
              </Text>
            </View>
            <Text style={styles.noticeText}>
              {scoringResult.notice}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isNonFood
              ? (language === 'es' ? 'Puntuación de seguridad' : 'Safety Score')
              : t.product.healthScore}
          </Text>
          {scoringResult?.hasEnoughData ? (
            <View style={styles.scoreContainer}>
              <View style={styles.circularScoreContainer}>
                <View
                  style={[
                    styles.circularScore,
                    { borderColor: getScoreColor(scoringResult.score) },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreNumber,
                      { color: getScoreColor(scoringResult.score) },
                    ]}
                  >
                    {scoringResult.score}
                  </Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
              </View>
              <View style={styles.scoreInfo}>
                <Text
                  style={[
                    styles.scoreLabel,
                    { color: getScoreColor(scoringResult.score) },
                  ]}
                >
                  {scoringResult.label}
                </Text>
                <Text style={styles.scoreDescription}>
                  {scoringResult.explanation}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                {scoringResult?.label || t.product.insufficientData}
              </Text>
              <Text style={styles.partialDataText}>
                {scoringResult?.explanation || t.product.partialData}
              </Text>
              {isNonFood && nonFoodResult?.hasLimitedData && (
                <Text style={[styles.partialDataText, { marginTop: 8, fontStyle: 'italic' }]}>
                  {language === 'es'
                    ? 'No hay suficiente información para un análisis completo.'
                    : 'Not enough information for a complete analysis.'}
                </Text>
              )}
            </View>
          )}
        </View>

        {warnings.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.product.warnings}</Text>
            {warnings.map((warning, index) => (
              <View key={index} style={styles.warningContainer}>
                <AlertTriangle size={24} color="#ef4444" strokeWidth={2} />
                <View style={styles.warningInfo}>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                  <Text style={styles.warningDescription}>{warning.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {scoringResult && scoringResult.score < 70 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t.product.betterAlternative}
            </Text>
            {isLoadingAlternative ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>
                  {language === 'es' ? 'Buscando mejor alternativa...' : 'Finding better alternative...'}
                </Text>
              </View>
            ) : betterAlternative ? (
              <>
                <Text style={styles.alternativeSubtitle}>
                  {getAlternativeReasonText(betterAlternative.healthScore)}
                </Text>
                <TouchableOpacity
                  style={styles.alternativeCard}
                  onPress={() => {
                    router.push({
                      pathname: '/product-result',
                      params: {
                        barcode: betterAlternative.barcode,
                        product_name: betterAlternative.product_name,
                        brands: betterAlternative.brands,
                        image_url: betterAlternative.image_url,
                        ingredients_text: '',
                        nutriments: JSON.stringify({}),
                        nutriscore_grade: '',
                        isAlternative: 'true',
                      },
                    });
                  }}
                >
                  <View style={styles.alternativeImageContainer}>
                    {betterAlternative.image_url && betterAlternative.image_url.length > 0 ? (
                      <Image
                        source={{ uri: betterAlternative.image_url }}
                        style={styles.alternativeImage}
                      />
                    ) : (
                      <View style={[styles.alternativeImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>No Image</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.alternativeInfo}>
                    <Text style={styles.alternativeName} numberOfLines={2}>
                      {String(betterAlternative.product_name)}
                    </Text>
                    {betterAlternative.brands && betterAlternative.brands.length > 0 && (
                      <Text style={styles.alternativeBrand} numberOfLines={1}>
                        {String(betterAlternative.brands)}
                      </Text>
                    )}
                    <View style={styles.alternativeScoreContainer}>
                      <View
                        style={[
                          styles.alternativeScoreBadge,
                          { backgroundColor: getScoreColor(betterAlternative.healthScore) },
                        ]}
                      >
                        <Text style={styles.alternativeScoreText}>
                          {Math.round(betterAlternative.healthScore)}
                        </Text>
                      </View>
                      <Text style={styles.alternativeScoreLabel}>
                        {language === 'es' ?
                          (betterAlternative.healthScore >= 90 ? 'Excelente' :
                           betterAlternative.healthScore >= 75 ? 'Bueno' :
                           betterAlternative.healthScore >= 55 ? 'Promedio' :
                           betterAlternative.healthScore >= 35 ? 'Bajo' : 'Pobre') :
                          (betterAlternative.healthScore >= 90 ? 'Excellent' :
                           betterAlternative.healthScore >= 75 ? 'Good' :
                           betterAlternative.healthScore >= 55 ? 'Average' :
                           betterAlternative.healthScore >= 35 ? 'Low' : 'Poor')
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.amazonButton}
                  onPress={() => {
                    const amazonUrl = generateAmazonAffiliateLink(
                      betterAlternative.product_name,
                      betterAlternative.brands
                    );
                    Linking.openURL(amazonUrl);
                  }}
                >
                  <Text style={styles.amazonButtonText}>
                    {language === 'es' ? 'Comprar en Amazon' : 'Buy on Amazon'}
                  </Text>
                  <ExternalLink size={16} color="#ffffff" strokeWidth={2} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noAlternativeContainer}>
                <Info size={48} color="#9ca3af" strokeWidth={1.5} />
                <Text style={styles.noAlternativeText}>
                  {t.product.noAlternativeAvailable}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.premiumHeaderContainer}>
            <View style={styles.premiumHeaderLeft}>
              <Lock size={24} color="#10b981" strokeWidth={2} />
              <View style={styles.premiumHeaderTextContainer}>
                <Text style={styles.cardTitle}>{t.product.detailedReport}</Text>
                <Text style={styles.premiumPrice}>{t.product.premiumReportPrice}</Text>
              </View>
            </View>
          </View>

          {isPremium ? (
            <View style={styles.premiumContent}>
              {productValidationError ? (
                <View style={styles.validationErrorContainer}>
                  <AlertTriangle size={48} color="#ef4444" strokeWidth={2} />
                  <Text style={styles.validationErrorTitle}>
                    {language === 'es' ? 'Producto no compatible' : 'Product not compatible'}
                  </Text>
                  <Text style={styles.validationErrorText}>{productValidationError}</Text>
                </View>
              ) : (() => {
                const analysis = detailedAnalysis;
                if (!analysis || !analysis.isValid) return null;

                return (
                  <>
                    {ingredients_text && typeof ingredients_text === 'string' && ingredients_text.length > 0 && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>{t.product.ingredientAnalysis}</Text>
                        {isTranslating ? (
                          <View style={styles.translatingContainer}>
                            <ActivityIndicator size="small" color="#10b981" />
                            <Text style={styles.translatingText}>Translating...</Text>
                          </View>
                        ) : (
                          <Text style={styles.ingredientsText}>
                            {translatedIngredients || String(ingredients_text)}
                          </Text>
                        )}
                      </View>
                    )}

                    {analysis.isValid && (
                      <>
                        <View style={styles.analysisSection}>
                          <Text style={styles.analysisSectionTitle}>{t.product.productAnalysis}</Text>
                          <Text style={styles.analysisText}>{analysis.ingredientQuality}</Text>
                          <Text style={[styles.analysisText, styles.analysisTextSpaced]}>{analysis.suitability}</Text>
                        </View>

                        {analysis.ingredientBreakdown && analysis.ingredientBreakdown.length > 0 && (
                          <View style={styles.analysisSection}>
                            <Text style={styles.analysisSectionTitle}>
                              {language === 'es' ? 'Análisis de ingredientes' : 'Ingredient analysis'}
                            </Text>
                            {analysis.ingredientBreakdown.map((item: any, index: number) => (
                              <View
                                key={index}
                                style={[
                                  styles.ingredientItem,
                                  item.rating === 'good' && styles.ingredientGood,
                                  item.rating === 'medium' && styles.ingredientMedium,
                                  item.rating === 'bad' && styles.ingredientBad,
                                ]}
                              >
                                <View style={styles.ingredientHeader}>
                                  <Text style={styles.ingredientName}>{item.name}</Text>
                                  <View style={[
                                    styles.ingredientBadge,
                                    item.rating === 'good' && styles.badgeGood,
                                    item.rating === 'medium' && styles.badgeMedium,
                                    item.rating === 'bad' && styles.badgeBad,
                                  ]}>
                                    <Text style={styles.badgeText}>
                                      {item.rating === 'good' ? (language === 'es' ? 'Bueno' : 'Good') :
                                       item.rating === 'medium' ? (language === 'es' ? 'Medio' : 'Medium') :
                                       (language === 'es' ? 'Malo' : 'Bad')}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.ingredientExplanation}>{item.explanation}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={styles.analysisSection}>
                          <Text style={styles.analysisSectionTitle}>
                            {language === 'es' ? 'Rango de edad recomendado' : 'Recommended age range'}
                          </Text>
                          <Text style={styles.analysisText}>{analysis.ageRecommendation}</Text>
                        </View>

                        {analysis.advice.length > 0 && (
                          <View style={styles.analysisSection}>
                            <Text style={styles.analysisSectionTitle}>{t.product.personalizedAdvice}</Text>
                            {analysis.advice.map((advice: string, index: number) => (
                              <View key={index} style={styles.adviceItem}>
                                <Text style={styles.adviceBullet}>•</Text>
                                <Text style={styles.adviceText}>{advice}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {analysis.detailedWarnings.length > 0 && (
                          <View style={styles.analysisSection}>
                            <Text style={styles.analysisSectionTitle}>{t.product.ingredientWarnings}</Text>
                            {analysis.detailedWarnings.map((warning: string, index: number) => (
                          <View key={index} style={styles.detailedWarningItem}>
                            <AlertTriangle size={20} color="#ef4444" strokeWidth={2} />
                            <Text style={styles.detailedWarningText}>{warning}</Text>
                          </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {premiumAlternativeError ? (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>
                          {language === 'es' ? 'Mejor alternativa personalizada' : 'Personalized Better Alternative'}
                        </Text>
                        <View style={styles.validationErrorContainer}>
                          <AlertTriangle size={32} color="#ef4444" strokeWidth={2} />
                          <Text style={styles.validationErrorText}>{premiumAlternativeError}</Text>
                        </View>
                      </View>
                    ) : premiumAlternative && scoringResult && scoringResult.score < 70 ? (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>
                          {language === 'es' ? 'Mejor alternativa personalizada' : 'Personalized Better Alternative'}
                        </Text>
                        <Text style={styles.premiumAlternativeSubtitle}>
                          {premiumAlternative.scoreReason}
                        </Text>
                        <TouchableOpacity
                          style={styles.premiumAlternativeCard}
                          onPress={() => {
                            router.push({
                              pathname: '/product-result',
                              params: {
                                barcode: premiumAlternative.barcode,
                                product_name: premiumAlternative.product_name,
                                brands: premiumAlternative.brands,
                                image_url: premiumAlternative.image_url,
                                ingredients_text: '',
                                nutriments: JSON.stringify({}),
                                nutriscore_grade: '',
                                isAlternative: 'true',
                              },
                            });
                          }}
                        >
                          <View style={styles.alternativeImageContainer}>
                            {premiumAlternative.image_url && premiumAlternative.image_url.length > 0 ? (
                              <Image
                                source={{ uri: premiumAlternative.image_url }}
                                style={styles.alternativeImage}
                              />
                            ) : (
                              <View style={[styles.alternativeImage, styles.placeholderImage]}>
                                <Text style={styles.placeholderText}>No Image</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.alternativeInfo}>
                            <Text style={styles.alternativeName} numberOfLines={2}>
                              {String(premiumAlternative.product_name)}
                            </Text>
                            {premiumAlternative.brands && premiumAlternative.brands.length > 0 && (
                              <Text style={styles.alternativeBrand} numberOfLines={1}>
                                {String(premiumAlternative.brands)}
                              </Text>
                            )}
                            <View style={styles.alternativeScoreContainer}>
                              <View
                                style={[
                                  styles.alternativeScoreBadge,
                                  { backgroundColor: getScoreColor(premiumAlternative.healthScore) },
                                ]}
                              >
                                <Text style={styles.alternativeScoreText}>
                                  {Math.round(premiumAlternative.healthScore)}
                                </Text>
                              </View>
                              <Text style={styles.alternativeScoreLabel}>
                                {language === 'es' ?
                                  (premiumAlternative.healthScore >= 90 ? 'Excelente' :
                                   premiumAlternative.healthScore >= 75 ? 'Bueno' :
                                   premiumAlternative.healthScore >= 55 ? 'Promedio' :
                                   premiumAlternative.healthScore >= 35 ? 'Bajo' : 'Pobre') :
                                  (premiumAlternative.healthScore >= 90 ? 'Excellent' :
                                   premiumAlternative.healthScore >= 75 ? 'Good' :
                                   premiumAlternative.healthScore >= 55 ? 'Average' :
                                   premiumAlternative.healthScore >= 35 ? 'Low' : 'Poor')
                                }
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.amazonButton}
                          onPress={() => {
                            const amazonUrl = generateAmazonAffiliateLink(
                              premiumAlternative.product_name,
                              premiumAlternative.brands
                            );
                            Linking.openURL(amazonUrl);
                          }}
                        >
                          <Text style={styles.amazonButtonText}>
                            {language === 'es' ? 'Comprar en Amazon' : 'Buy on Amazon'}
                          </Text>
                          <ExternalLink size={16} color="#ffffff" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </View>
          ) : (
            <View style={styles.premiumLockedContainer}>
              <Lock size={64} color="#9ca3af" strokeWidth={1.5} />
              <Text style={styles.premiumLockedTitle}>{t.product.premiumReportAvailable}</Text>
              <TouchableOpacity
                style={styles.premiumUnlockButton}
                onPress={() => setShowWelcomeModal(true)}
              >
                <Text style={styles.premiumUnlockButtonText}>{t.product.unlockReport}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWelcomeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWelcomeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.welcomeModalTitle}>
              {language === 'es'
                ? '¡Qué bien! ¡Nos alegra mucho saber que quieres lo mejor para tu mascota! :)'
                : 'Great! We\'re so happy to know you want the best for your pet! :)'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWelcomeModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowWelcomeModal(false);
                  setShowSubscriptionModal(true);
                }}
              >
                <Text style={styles.modalConfirmText}>
                  {language === 'es' ? 'Continuar' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSubscriptionModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {language === 'es' ? 'Suscripción a Informes Detallados' : 'Detailed Reports Subscription'}
            </Text>

            <Text style={styles.modalDescription}>
              {language === 'es'
                ? 'Vas a pagar el acceso a tener informes detallados de todos tus productos escaneados durante 1 mes por 1,99€/mes. Puedes cancelar cuando quieras en la parte "Perfil".'
                : 'You will pay for access to detailed reports for all your scanned products for 1 month at €1.99/month. You can cancel anytime from "Profile".'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSubscribe}
              >
                <Text style={styles.modalConfirmText}>
                  {language === 'es' ? 'Pagar' : 'Pay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  favoriteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
  },
  productImage: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 16,
    color: '#6b7280',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nutritionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  circularScoreContainer: {
    marginRight: 20,
  },
  circularScore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreOutOf: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  scoreDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  noDataContainer: {
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginTop: 12,
  },
  noDataText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  partialDataText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  noticeCard: {
    borderLeftWidth: 4,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  noticeText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    flex: 1,
  },
  errorMessage: {
    fontSize: 15,
    color: '#991b1b',
    lineHeight: 22,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 12,
  },
  warningInfo: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  nutrimentsList: {
    gap: 8,
  },
  nutrimentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  nutrimentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutrimentLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  nutrimentValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  translatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  translatingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  alternativeSubtitle: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 12,
  },
  alternativeCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  alternativeImageContainer: {
    marginRight: 16,
  },
  alternativeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  alternativeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  alternativeBrand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  alternativeScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alternativeScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alternativeScoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  alternativeScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  noAlternativeContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 12,
  },
  noAlternativeText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  premiumHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  premiumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  premiumHeaderTextContainer: {
    flex: 1,
  },
  premiumPrice: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  premiumContent: {
    gap: 20,
  },
  analysisSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  analysisTextSpaced: {
    marginTop: 12,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  adviceBullet: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '700',
    marginRight: 8,
    marginTop: 1,
  },
  adviceText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    flex: 1,
  },
  detailedWarningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  detailedWarningText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
    flex: 1,
  },
  premiumLockedContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  premiumLockedTitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    fontWeight: '600',
  },
  premiumUnlockButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumUnlockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  affiliateButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  amazonButton: {
    backgroundColor: '#FF9900',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amazonButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  affiliateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    paddingRight: 32,
  },
  welcomeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    lineHeight: 26,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailedAlternativeCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  detailedAlternativeHeader: {
    marginBottom: 12,
  },
  detailedAlternativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  detailedAlternativeBrand: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailedAlternativeScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailedAlternativeScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedAlternativeScoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailedAlternativeScoreLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  detailedAlternativeReason: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  detailedAlternativeButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailedAlternativeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  validationErrorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  validationErrorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  validationErrorText: {
    fontSize: 15,
    color: '#991b1b',
    textAlign: 'center',
    lineHeight: 22,
  },
  premiumAlternativeSubtitle: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  premiumAlternativeCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#059669',
  },
  ingredientItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  ingredientGood: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  ingredientMedium: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  ingredientBad: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ingredientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGood: {
    backgroundColor: '#10b981',
  },
  badgeMedium: {
    backgroundColor: '#f59e0b',
  },
  badgeBad: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ingredientExplanation: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
});
