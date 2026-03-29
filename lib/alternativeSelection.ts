import { supabase } from './supabaseClient';
import { calculatePetFoodScore } from './petFoodScoring';

interface AlternativeProduct {
  barcode: string;
  product_name: string;
  brands: string;
  image_url: string;
  healthScore: number;
  scoreReason?: string;
}

interface PetProfile {
  pet_type: string;
  age_years: number;
  breed?: string | null;
  weight?: number;
}

function detectAnimalType(productData: any): string {
  const productNameLower = String(productData.product_name || '').toLowerCase();
  const categoriesLower = String(productData.categories || '').toLowerCase();
  const ingredientsLower = String(productData.ingredients_text || '').toLowerCase();
  const combinedText = `${productNameLower} ${categoriesLower} ${ingredientsLower}`;

  if (combinedText.includes('cat') || combinedText.includes('feline') ||
      combinedText.includes('kitten') || combinedText.includes('gato')) {
    return 'cat';
  }

  if (combinedText.includes('dog') || combinedText.includes('canine') ||
      combinedText.includes('puppy') || combinedText.includes('perro')) {
    return 'dog';
  }

  if (combinedText.includes('bird') || combinedText.includes('parrot') ||
      combinedText.includes('parakeet') || combinedText.includes('canary') ||
      combinedText.includes('ave') || combinedText.includes('pájaro')) {
    return 'bird';
  }

  if (combinedText.includes('fish') || combinedText.includes('aquarium') ||
      combinedText.includes('goldfish') || combinedText.includes('pez') ||
      combinedText.includes('acuario')) {
    return 'fish';
  }

  if (combinedText.includes('rabbit') || combinedText.includes('bunny') ||
      combinedText.includes('conejo')) {
    return 'rabbit';
  }

  if (combinedText.includes('hamster') || combinedText.includes('guinea pig') ||
      combinedText.includes('rodent') || combinedText.includes('roedor')) {
    return 'rodent';
  }

  if (combinedText.includes('reptile') || combinedText.includes('turtle') ||
      combinedText.includes('tortoise') || combinedText.includes('reptil')) {
    return 'reptile';
  }

  return 'unknown';
}

function detectProductCategory(product: any): string {
  const text = `${product.product_name || ''} ${product.categories || ''}`.toLowerCase();

  if (
    text.includes('treat') ||
    text.includes('snack') ||
    text.includes('premio') ||
    text.includes('golosina') ||
    text.includes('dental') ||
    text.includes('chew') ||
    text.includes('stick') ||
    text.includes('bone') ||
    text.includes('masticable') ||
    text.includes('reward')
  ) {
    return 'treat';
  }

  if (
    text.includes('veterinary') ||
    text.includes('prescription') ||
    text.includes('vet diet') ||
    text.includes('therapeutic') ||
    text.includes('clinical') ||
    text.includes('medicado')
  ) {
    return 'veterinary';
  }

  if (
    text.includes('wet') ||
    text.includes('húmedo') ||
    text.includes('can') ||
    text.includes('lata') ||
    text.includes('pouch') ||
    text.includes('paté') ||
    text.includes('terrine')
  ) {
    return 'wet';
  }

  if (
    text.includes('dry') ||
    text.includes('seco') ||
    text.includes('kibble') ||
    text.includes('croqueta')
  ) {
    return 'dry';
  }

  return 'unknown';
}

function detectAgeCategory(product: any): string {
  const text = `${product.product_name || ''} ${product.categories || ''}`.toLowerCase();

  if (text.includes('puppy') || text.includes('cachorro') || text.includes('junior') ||
      text.includes('kitten') || text.includes('gatito')) {
    return 'puppy';
  }

  if (text.includes('senior') || text.includes('aged') || text.includes('7+') ||
      text.includes('8+') || text.includes('veterano') || text.includes('mayor')) {
    return 'senior';
  }

  if (text.includes('adult') || text.includes('adulto')) {
    return 'adult';
  }

  return 'unknown';
}

function matchesCategory(
  currentCategory: string,
  alternativeCategory: string
): boolean {
  if (currentCategory === 'treat') {
    return alternativeCategory === 'treat';
  }

  if (currentCategory === 'veterinary') {
    return alternativeCategory === 'veterinary';
  }

  if (currentCategory === 'wet' || currentCategory === 'dry') {
    return (
      alternativeCategory === currentCategory ||
      (alternativeCategory !== 'treat' && alternativeCategory !== 'veterinary')
    );
  }

  if (currentCategory === 'unknown') {
    return alternativeCategory !== 'treat';
  }

  return alternativeCategory === currentCategory;
}

export async function findBestFreeAlternative(
  currentProduct: any,
  currentScore: number,
  language: string
): Promise<AlternativeProduct | null> {
  try {
    const currentAnimalType = detectAnimalType(currentProduct);

    if (currentAnimalType === 'unknown') {
      return null;
    }

    const currentCategory = detectProductCategory(currentProduct);

    const { data: masterProducts } = await supabase
      .from('products_master')
      .select('*')
      .neq('barcode', String(currentProduct.barcode || ''))
      .limit(500);

    const { data: cachedProducts } = await supabase
      .from('products_cache')
      .select('*')
      .neq('barcode', String(currentProduct.barcode || ''))
      .limit(100);

    let allCandidates: any[] = [];

    if (masterProducts && masterProducts.length > 0) {
      const masterCandidates = masterProducts
        .filter((p: any) => {
          if (!p.product_name) return false;

          const alternativeAnimalType = detectAnimalType({
            product_name: p.product_name,
            categories: '',
            ingredients_text: p.ingredients || '',
          });

          const alternativeCategory = detectProductCategory({
            product_name: p.product_name,
            categories: '',
          });

          const sameAnimalType = alternativeAnimalType === currentAnimalType;

          return sameAnimalType && matchesCategory(currentCategory, alternativeCategory);
        })
        .map((p: any) => {
          const nutriments: any = {};
          if (p.protein !== null && p.protein !== undefined) {
            nutriments.proteins_100g = p.protein;
          }
          if (p.fat !== null && p.fat !== undefined) {
            nutriments.fat_100g = p.fat;
          }
          if (p.fiber !== null && p.fiber !== undefined) {
            nutriments.fiber_100g = p.fiber;
          }
          if (p.carbohydrates !== null && p.carbohydrates !== undefined) {
            nutriments.carbohydrates_100g = p.carbohydrates;
          }
          if (p.energy !== null && p.energy !== undefined) {
            nutriments.energy_100g = p.energy;
          }

          const altScoreResult = calculatePetFoodScore({
            product_name: p.product_name,
            brands: p.brand || '',
            ingredients_text: p.ingredients || '',
            nutriments: nutriments,
            categories: '',
            nutriscore_grade: '',
          }, language);

          return {
            barcode: p.barcode,
            product_name: p.product_name,
            brands: p.brand || '',
            image_url: p.image_url || '',
            healthScore: altScoreResult.score,
            scoreReason: altScoreResult.explanation,
          };
        });

      allCandidates = [...masterCandidates];
    }

    if (cachedProducts && cachedProducts.length > 0) {
      const cachedCandidates = cachedProducts
        .filter((p: any) => {
          if (!p.product_name) return false;

          const alternativeAnimalType = detectAnimalType({
            product_name: p.product_name,
            categories: p.categories || '',
            ingredients_text: p.ingredients_text || '',
          });

          const alternativeCategory = detectProductCategory({
            product_name: p.product_name,
            categories: p.categories || '',
          });

          const sameAnimalType = alternativeAnimalType === currentAnimalType;

          return sameAnimalType && matchesCategory(currentCategory, alternativeCategory);
        })
        .map((p: any) => {
          const altScoreResult = calculatePetFoodScore({
            product_name: p.product_name,
            brands: p.brands || '',
            ingredients_text: p.ingredients_text || '',
            nutriments: p.nutriments || {},
            categories: p.categories || '',
            nutriscore_grade: p.nutriscore_grade || '',
          }, language);

          return {
            barcode: p.barcode,
            product_name: p.product_name,
            brands: p.brands || '',
            image_url: p.image_url || '',
            healthScore: altScoreResult.score,
            scoreReason: altScoreResult.explanation,
          };
        });

      allCandidates = [...allCandidates, ...cachedCandidates];
    }

    const uniqueCandidates = Array.from(
      new Map(allCandidates.map(item => [item.barcode, item])).values()
    );

    const betterAlternatives = uniqueCandidates
      .filter((p: any) => p.healthScore > currentScore)
      .sort((a: any, b: any) => b.healthScore - a.healthScore);

    if (betterAlternatives.length > 0) {
      return betterAlternatives[0];
    }

    return null;
  } catch (error) {
    console.error('Error finding free alternative:', error);
    return null;
  }
}

export async function findBestPersonalizedAlternative(
  currentProduct: any,
  currentScore: number,
  petProfile: PetProfile | null,
  language: string
): Promise<{ alternative: AlternativeProduct | null; validationError: string | null }> {
  if (!petProfile) {
    return {
      alternative: null,
      validationError: language === 'es'
        ? 'No se ha encontrado perfil de mascota. Por favor, completa tu perfil en la sección de Perfil.'
        : 'Pet profile not found. Please complete your profile in the Profile section.'
    };
  }

  const currentAnimalType = detectAnimalType(currentProduct);

  if (currentAnimalType === 'unknown') {
    return { alternative: null, validationError: null };
  }

  const petType = String(petProfile.pet_type || '').toLowerCase();
  const normalizedPetType = petType === 'perro' ? 'dog' : petType === 'gato' ? 'cat' : petType;

  if (currentAnimalType !== normalizedPetType) {
    return {
      alternative: null,
      validationError: language === 'es'
        ? 'Este producto no corresponde a tu mascota. Para cambiar el tipo de animal, ve a Perfil, ajusta los datos de tu mascota y vuelve a escanear el producto.'
        : 'This product does not match your pet. To change the animal type, go to Profile, adjust your pet\'s data and scan the product again.'
    };
  }

  try {
    const currentCategory = detectProductCategory(currentProduct);
    const petAge = petProfile.age_years || 0;

    let desiredAgeCategory = 'adult';
    if (normalizedPetType === 'dog') {
      if (petAge < 1) desiredAgeCategory = 'puppy';
      else if (petAge >= 7) desiredAgeCategory = 'senior';
      else desiredAgeCategory = 'adult';
    } else if (normalizedPetType === 'cat') {
      if (petAge < 1) desiredAgeCategory = 'puppy';
      else if (petAge >= 7) desiredAgeCategory = 'senior';
      else desiredAgeCategory = 'adult';
    }

    const { data: masterProducts } = await supabase
      .from('products_master')
      .select('*')
      .neq('barcode', String(currentProduct.barcode || ''))
      .limit(500);

    const { data: cachedProducts } = await supabase
      .from('products_cache')
      .select('*')
      .neq('barcode', String(currentProduct.barcode || ''))
      .limit(100);

    let allCandidates: any[] = [];

    if (masterProducts && masterProducts.length > 0) {
      const masterCandidates = masterProducts
        .filter((p: any) => {
          if (!p.product_name) return false;

          const alternativeAnimalType = detectAnimalType({
            product_name: p.product_name,
            categories: '',
            ingredients_text: p.ingredients || '',
          });

          const alternativeCategory = detectProductCategory({
            product_name: p.product_name,
            categories: '',
          });

          const sameAnimalType = alternativeAnimalType === normalizedPetType;

          return sameAnimalType && matchesCategory(currentCategory, alternativeCategory);
        })
        .map((p: any) => {
          const nutriments: any = {};
          if (p.protein !== null && p.protein !== undefined) {
            nutriments.proteins_100g = p.protein;
          }
          if (p.fat !== null && p.fat !== undefined) {
            nutriments.fat_100g = p.fat;
          }
          if (p.fiber !== null && p.fiber !== undefined) {
            nutriments.fiber_100g = p.fiber;
          }
          if (p.carbohydrates !== null && p.carbohydrates !== undefined) {
            nutriments.carbohydrates_100g = p.carbohydrates;
          }
          if (p.energy !== null && p.energy !== undefined) {
            nutriments.energy_100g = p.energy;
          }

          const altScoreResult = calculatePetFoodScore({
            product_name: p.product_name,
            brands: p.brand || '',
            ingredients_text: p.ingredients || '',
            nutriments: nutriments,
            categories: '',
            nutriscore_grade: '',
          }, language);

          const alternativeAgeCategory = detectAgeCategory({
            product_name: p.product_name,
            categories: '',
          });

          const ageMatch = alternativeAgeCategory === desiredAgeCategory || alternativeAgeCategory === 'unknown';

          return {
            barcode: p.barcode,
            product_name: p.product_name,
            brands: p.brand || '',
            image_url: p.image_url || '',
            healthScore: altScoreResult.score,
            scoreReason: altScoreResult.explanation,
            ageCategory: alternativeAgeCategory,
            ageMatch: ageMatch,
          };
        });

      allCandidates = [...masterCandidates];
    }

    if (cachedProducts && cachedProducts.length > 0) {
      const cachedCandidates = cachedProducts
        .filter((p: any) => {
          if (!p.product_name) return false;

          const alternativeAnimalType = detectAnimalType({
            product_name: p.product_name,
            categories: p.categories || '',
            ingredients_text: p.ingredients_text || '',
          });

          const alternativeCategory = detectProductCategory({
            product_name: p.product_name,
            categories: p.categories || '',
          });

          const sameAnimalType = alternativeAnimalType === normalizedPetType;

          return sameAnimalType && matchesCategory(currentCategory, alternativeCategory);
        })
        .map((p: any) => {
          const altScoreResult = calculatePetFoodScore({
            product_name: p.product_name,
            brands: p.brands || '',
            ingredients_text: p.ingredients_text || '',
            nutriments: p.nutriments || {},
            categories: p.categories || '',
            nutriscore_grade: p.nutriscore_grade || '',
          }, language);

          const alternativeAgeCategory = detectAgeCategory({
            product_name: p.product_name,
            categories: p.categories || '',
          });

          const ageMatch = alternativeAgeCategory === desiredAgeCategory || alternativeAgeCategory === 'unknown';

          return {
            barcode: p.barcode,
            product_name: p.product_name,
            brands: p.brands || '',
            image_url: p.image_url || '',
            healthScore: altScoreResult.score,
            scoreReason: altScoreResult.explanation,
            ageCategory: alternativeAgeCategory,
            ageMatch: ageMatch,
          };
        });

      allCandidates = [...allCandidates, ...cachedCandidates];
    }

    const uniqueCandidates = Array.from(
      new Map(allCandidates.map(item => [item.barcode, item])).values()
    );

    const betterAlternatives = uniqueCandidates
      .filter((p: any) => p.healthScore > currentScore)
      .sort((a: any, b: any) => {
        if (a.ageMatch && !b.ageMatch) return -1;
        if (!a.ageMatch && b.ageMatch) return 1;
        return b.healthScore - a.healthScore;
      });

    if (betterAlternatives.length > 0) {
      const best = betterAlternatives[0];

      let personalizedReason = '';
      const petTypeName = normalizedPetType === 'dog'
        ? (language === 'es' ? 'perro' : 'dog')
        : (language === 'es' ? 'gato' : 'cat');

      const ageStage = desiredAgeCategory === 'puppy'
        ? (language === 'es' ? 'cachorro' : 'puppy')
        : desiredAgeCategory === 'senior'
        ? (language === 'es' ? 'senior' : 'senior')
        : (language === 'es' ? 'adulto' : 'adult');

      if (best.ageMatch && best.ageCategory !== 'unknown') {
        personalizedReason = language === 'es'
          ? `Esta alternativa encaja mejor con un ${petTypeName} ${ageStage} de ${petAge} años porque ofrece una fuente de proteína más clara y una composición más adecuada para su etapa de vida.`
          : `This alternative better matches a ${ageStage} ${petTypeName} of ${petAge} years because it offers a clearer protein source and a more suitable composition for their life stage.`;
      } else {
        personalizedReason = language === 'es'
          ? `Esta alternativa es mejor para tu ${petTypeName} de ${petAge} años porque presenta ingredientes de mayor calidad y mejor balance nutricional.`
          : `This alternative is better for your ${petAge}-year-old ${petTypeName} because it has higher quality ingredients and better nutritional balance.`;
      }

      return {
        alternative: {
          barcode: best.barcode,
          product_name: best.product_name,
          brands: best.brands,
          image_url: best.image_url,
          healthScore: best.healthScore,
          scoreReason: personalizedReason,
        },
        validationError: null,
      };
    }

    return { alternative: null, validationError: null };
  } catch (error) {
    console.error('Error finding personalized alternative:', error);
    return { alternative: null, validationError: null };
  }
}
