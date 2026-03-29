import { supabase } from './supabaseClient';
import { enrichProductData, saveEnrichedProduct } from './productEnrichment';

interface ProductData {
  product_name: string;
  brands: string;
  image_url: string;
  ingredients_text: string;
  nutriments: any;
  nutriscore_grade: string;
  categories?: string;
  protein?: number;
  fat?: number;
  fiber?: number;
  ash?: number;
  energy?: number;
  product_type?: string;
  is_veterinary_food?: boolean;
  is_snack?: boolean;
  data_confidence?: string;
}

interface ProductLookupResult {
  found: boolean;
  product?: ProductData;
  source?: string;
}

function isValidProduct(product: ProductData): boolean {
  const hasName = !!(product.product_name && product.product_name.trim().length > 0);
  const hasBrandOrCategory =
    !!(product.brands && product.brands.trim().length > 0) ||
    !!(product.categories && product.categories.trim().length > 0);

  return hasName && hasBrandOrCategory;
}

function isValidProductMaster(product: ProductData): boolean {
  const hasName = !!(product.product_name && product.product_name.trim().length > 0);
  const hasBrand = !!(product.brands && product.brands.trim().length > 0);

  return hasName || hasBrand;
}

export async function lookupProduct(barcode: string): Promise<ProductLookupResult> {
  try {
    // 1. Check products_master first
    const masterResult = await lookupProductsMaster(barcode);
    if (masterResult.found && masterResult.product && isValidProductMaster(masterResult.product)) {
      return masterResult;
    }

    // 2. Check pet_food_products (NEW - High priority curated database)
    const petFoodResult = await lookupPetFoodProducts(barcode);
    if (petFoodResult.found && petFoodResult.product && isValidProduct(petFoodResult.product)) {
      console.log('Found in pet_food_products');
      // Auto-save to products_master in background for faster future lookups
      saveToProductsMaster(barcode, petFoodResult.product, petFoodResult.source || 'Pet Food Products').catch(err =>
        console.error('Background save to products_master failed:', err)
      );
      return petFoodResult;
    }

    // 3. Check approved user submitted products
    const userSubmittedResult = await lookupUserSubmittedProducts(barcode);
    if (userSubmittedResult.found && userSubmittedResult.product && isValidProduct(userSubmittedResult.product)) {
      // Auto-save to products_master in background
      saveToProductsMaster(barcode, userSubmittedResult.product, userSubmittedResult.source || 'User Submitted').catch(err =>
        console.error('Background save to products_master failed:', err)
      );
      return userSubmittedResult;
    }

    // 4. Check products_cache
    const cachedResult = await lookupCachedProduct(barcode);
    if (cachedResult.found && cachedResult.product && isValidProduct(cachedResult.product)) {
      // Auto-save to products_master in background
      saveToProductsMaster(barcode, cachedResult.product, cachedResult.source || 'Cache').catch(err =>
        console.error('Background save to products_master failed:', err)
      );
      return cachedResult;
    }

    // 5-9. External APIs as fallback
    let result: ProductLookupResult = { found: false };

    const opffResult = await lookupOpenPetFoodFacts(barcode);
    if (opffResult.found && opffResult.product && isValidProduct(opffResult.product)) {
      result = opffResult;
    } else {
      const offResult = await lookupOpenFoodFacts(barcode);
      if (offResult.found && offResult.product && isValidProduct(offResult.product)) {
        result = offResult;
      } else {
        const upcResult = await lookupUPCItemDB(barcode);
        if (upcResult.found && upcResult.product && isValidProduct(upcResult.product)) {
          result = upcResult;
        } else {
          const barcodeResult = await lookupBarcodeLookup(barcode);
          if (barcodeResult.found && barcodeResult.product && isValidProduct(barcodeResult.product)) {
            result = barcodeResult;
          }
        }
      }
    }

    if (result.found && result.product) {
      const enrichedProduct = await enrichProductData(barcode, result.product, result.source || 'unknown');
      await saveEnrichedProduct(barcode, enrichedProduct, result.source || 'unknown');

      // Save to products_master for future lookups
      await saveToProductsMaster(barcode, enrichedProduct, result.source || 'unknown');

      return {
        found: true,
        product: enrichedProduct,
        source: result.source,
      };
    }

    return { found: false };
  } catch (error) {
    console.error('Product lookup error:', error);
    return { found: false };
  }
}

async function lookupProductsMaster(barcode: string): Promise<ProductLookupResult> {
  try {
    const { data, error } = await supabase
      .from('products_master')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error || !data) {
      return { found: false };
    }

    const nutriments: any = {};
    if (data.protein !== null && data.protein !== undefined) {
      nutriments.proteins_100g = data.protein;
    }
    if (data.fat !== null && data.fat !== undefined) {
      nutriments.fat_100g = data.fat;
    }
    if (data.fiber !== null && data.fiber !== undefined) {
      nutriments.fiber_100g = data.fiber;
    }
    if (data.carbohydrates !== null && data.carbohydrates !== undefined) {
      nutriments.carbohydrates_100g = data.carbohydrates;
    }
    if (data.energy !== null && data.energy !== undefined) {
      nutriments.energy_100g = data.energy;
    }

    return {
      found: true,
      product: {
        product_name: data.product_name || '',
        brands: data.brand || '',
        image_url: data.image_url || '',
        ingredients_text: data.ingredients || '',
        nutriments: nutriments,
        nutriscore_grade: '',
        categories: '',
      },
      source: data.source || 'Products Master',
    };
  } catch (error) {
    console.error('Products master lookup error:', error);
    return { found: false };
  }
}

async function lookupPetFoodProducts(barcode: string): Promise<ProductLookupResult> {
  try {
    const { data, error } = await supabase
      .from('pet_food_products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error) {
      console.error('Pet food products lookup error:', error);
      return { found: false };
    }

    if (!data) {
      return { found: false };
    }

    const nutriments: any = {};
    if (data.protein !== null && data.protein !== undefined) {
      nutriments.proteins_100g = parseFloat(String(data.protein));
    }
    if (data.fat !== null && data.fat !== undefined) {
      nutriments.fat_100g = parseFloat(String(data.fat));
    }
    if (data.fiber !== null && data.fiber !== undefined) {
      nutriments.fiber_100g = parseFloat(String(data.fiber));
    }
    if (data.carbohydrates !== null && data.carbohydrates !== undefined) {
      nutriments.carbohydrates_100g = parseFloat(String(data.carbohydrates));
    }
    if (data.energy !== null && data.energy !== undefined) {
      nutriments.energy_100g = parseFloat(String(data.energy));
    }
    if (data.ash !== null && data.ash !== undefined) {
      nutriments.ash_100g = parseFloat(String(data.ash));
    }

    return {
      found: true,
      product: {
        product_name: data.product_name || '',
        brands: data.brand || '',
        image_url: data.image_url || '',
        ingredients_text: data.ingredients || '',
        nutriments: nutriments,
        nutriscore_grade: data.nutriscore_grade || '',
        categories: data.categories || '',
        protein: data.protein ? parseFloat(String(data.protein)) : undefined,
        fat: data.fat ? parseFloat(String(data.fat)) : undefined,
        fiber: data.fiber ? parseFloat(String(data.fiber)) : undefined,
        ash: data.ash ? parseFloat(String(data.ash)) : undefined,
        energy: data.energy ? parseFloat(String(data.energy)) : undefined,
        is_veterinary_food: data.is_veterinary_food || false,
        is_snack: data.is_snack || false,
        data_confidence: 'high',
      },
      source: data.data_source || 'Pet Food Products',
    };
  } catch (error) {
    console.error('Pet food products lookup error:', error);
    return { found: false };
  }
}

async function lookupCachedProduct(barcode: string): Promise<ProductLookupResult> {
  try {
    const { data, error } = await supabase
      .from('products_cache')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error || !data) {
      return { found: false };
    }

    return {
      found: true,
      product: {
        product_name: data.product_name || '',
        brands: data.brands || '',
        image_url: data.image_url || '',
        ingredients_text: data.ingredients_text || '',
        nutriments: data.nutriments || {},
        nutriscore_grade: data.nutriscore_grade || '',
        categories: data.categories || '',
        protein: data.protein,
        fat: data.fat,
        fiber: data.fiber,
        ash: data.ash,
        energy: data.energy,
        product_type: data.product_type,
        is_veterinary_food: data.is_veterinary_food,
        is_snack: data.is_snack,
        data_confidence: data.data_confidence,
      },
      source: `${data.source} (Cached)`,
    };
  } catch (error) {
    console.error('Cache lookup error:', error);
    return { found: false };
  }
}

async function lookupUserSubmittedProducts(barcode: string): Promise<ProductLookupResult> {
  try {
    const { data, error } = await supabase
      .from('user_submitted_products')
      .select('*')
      .eq('barcode', barcode)
      .eq('status', 'approved')
      .maybeSingle();

    if (error || !data) {
      return { found: false };
    }

    const ingredientsArray = Array.isArray(data.ingredients) ? data.ingredients : [];
    const ingredientsText = ingredientsArray.join(', ');

    const proteins = parseFloat(data.proteins || '0');
    const fat = parseFloat(data.fat || '0');
    const carbohydrates = parseFloat(data.carbohydrates || '0');

    return {
      found: true,
      product: {
        product_name: data.product_name || '',
        brands: data.brand || '',
        image_url: data.image_url || '',
        ingredients_text: ingredientsText,
        nutriments: {
          proteins_100g: proteins,
          fat_100g: fat,
          carbohydrates_100g: carbohydrates,
        },
        nutriscore_grade: '',
        categories: '',
      },
      source: 'User Submitted',
    };
  } catch (error) {
    console.error('User submitted products lookup error:', error);
    return { found: false };
  }
}


async function lookupOpenPetFoodFacts(barcode: string): Promise<ProductLookupResult> {
  try {
    const response = await fetch(
      `https://world.openpetfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const result = await response.json();

    if (result.status === 1 && result.product) {
      return {
        found: true,
        product: {
          product_name: result.product.product_name || '',
          brands: result.product.brands || '',
          image_url: result.product.image_url || '',
          ingredients_text: result.product.ingredients_text || '',
          nutriments: result.product.nutriments || {},
          nutriscore_grade: result.product.nutriscore_grade || '',
          categories: result.product.categories || '',
        },
        source: 'OpenPetFoodFacts',
      };
    }

    return { found: false };
  } catch (error) {
    console.error('OpenPetFoodFacts lookup error:', error);
    return { found: false };
  }
}

async function lookupOpenFoodFacts(barcode: string): Promise<ProductLookupResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const result = await response.json();

    if (result.status === 1 && result.product) {
      return {
        found: true,
        product: {
          product_name: result.product.product_name || '',
          brands: result.product.brands || '',
          image_url: result.product.image_url || '',
          ingredients_text: result.product.ingredients_text || '',
          nutriments: result.product.nutriments || {},
          nutriscore_grade: result.product.nutriscore_grade || '',
          categories: result.product.categories || '',
        },
        source: 'OpenFoodFacts',
      };
    }

    return { found: false };
  } catch (error) {
    console.error('OpenFoodFacts lookup error:', error);
    return { found: false };
  }
}

async function lookupUPCItemDB(barcode: string): Promise<ProductLookupResult> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`
    );
    const result = await response.json();

    if (result.code === 'OK' && result.items && result.items.length > 0) {
      const item = result.items[0];
      return {
        found: true,
        product: {
          product_name: item.title || item.brand || '',
          brands: item.brand || '',
          image_url: item.images && item.images.length > 0 ? item.images[0] : '',
          ingredients_text: item.description || '',
          nutriments: {},
          nutriscore_grade: '',
          categories: item.category || '',
        },
        source: 'UPCitemDB',
      };
    }

    return { found: false };
  } catch (error) {
    console.error('UPCitemDB lookup error:', error);
    return { found: false };
  }
}

async function lookupBarcodeLookup(barcode: string): Promise<ProductLookupResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}`
    );
    const result = await response.json();

    if (result.status === 1 && result.product) {
      return {
        found: true,
        product: {
          product_name: result.product.product_name || result.product.generic_name || '',
          brands: result.product.brands || '',
          image_url: result.product.image_front_url || result.product.image_url || '',
          ingredients_text: result.product.ingredients_text || '',
          nutriments: result.product.nutriments || {},
          nutriscore_grade: result.product.nutriscore_grade || '',
          categories: result.product.categories || '',
        },
        source: 'BarcodeLookup',
      };
    }

    return { found: false };
  } catch (error) {
    console.error('BarcodeLookup lookup error:', error);
    return { found: false };
  }
}

export function calculateHealthScore(product: ProductData): number {
  if (product.nutriscore_grade) {
    const gradeMap: { [key: string]: number } = {
      'a': 95,
      'b': 85,
      'c': 70,
      'd': 50,
      'e': 30,
    };
    return gradeMap[product.nutriscore_grade.toLowerCase()] || 0;
  }

  const nutriments = product.nutriments || {};
  let score = 50;

  if (nutriments.proteins_100g) {
    const protein = parseFloat(nutriments.proteins_100g);
    if (protein >= 25) score += 20;
    else if (protein >= 18) score += 10;
  }

  if (nutriments.fat_100g) {
    const fat = parseFloat(nutriments.fat_100g);
    if (fat >= 10 && fat <= 20) score += 15;
    else if (fat < 5 || fat > 30) score -= 10;
  }

  if (nutriments.carbohydrates_100g) {
    const carbs = parseFloat(nutriments.carbohydrates_100g);
    if (carbs < 30) score += 10;
    else if (carbs > 50) score -= 15;
  }

  if (nutriments['fiber_100g']) {
    const fiber = parseFloat(nutriments['fiber_100g']);
    if (fiber >= 3 && fiber <= 8) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function detectProductType(product: ProductData): {
  isVeterinaryDiet: boolean;
  isTreat: boolean;
  isSnack: boolean;
} {
  const name = product.product_name.toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const combined = `${name} ${categories}`;

  const isVeterinaryDiet =
    combined.includes('veterinary') ||
    combined.includes('prescription') ||
    combined.includes('vet diet') ||
    combined.includes('therapeutic') ||
    combined.includes('clinical') ||
    combined.includes('medicado');

  const isTreat =
    combined.includes('treat') ||
    combined.includes('premio') ||
    combined.includes('reward') ||
    combined.includes('snack') ||
    combined.includes('golosina');

  const isSnack =
    combined.includes('dental') ||
    combined.includes('chew') ||
    combined.includes('stick') ||
    combined.includes('bone') ||
    combined.includes('masticable');

  return {
    isVeterinaryDiet,
    isTreat: isTreat || isSnack,
    isSnack,
  };
}

export function detectPetSpecies(product: ProductData): 'dog' | 'cat' | 'unknown' {
  const name = product.product_name.toLowerCase();
  const brands = (product.brands || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const ingredients = (product.ingredients_text || '').toLowerCase();
  const combined = `${name} ${brands} ${categories} ${ingredients}`;

  const dogKeywords = ['dog', 'perro', 'canine', 'canino', 'puppy', 'cachorro'];
  const catKeywords = ['cat', 'gato', 'feline', 'felino', 'kitten', 'gatito'];

  const hasDogKeyword = dogKeywords.some(keyword => combined.includes(keyword));
  const hasCatKeyword = catKeywords.some(keyword => combined.includes(keyword));

  if (hasDogKeyword && !hasCatKeyword) {
    return 'dog';
  }
  if (hasCatKeyword && !hasDogKeyword) {
    return 'cat';
  }

  return 'unknown';
}

async function saveToProductsMaster(barcode: string, product: ProductData, source: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('products_master')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    const nutriments = product.nutriments || {};

    const newData = {
      barcode: barcode,
      product_name: product.product_name || null,
      brand: product.brands || null,
      ingredients: product.ingredients_text || null,
      protein: nutriments.proteins_100g || product.protein || null,
      fat: nutriments.fat_100g || product.fat || null,
      fiber: nutriments.fiber_100g || product.fiber || null,
      carbohydrates: nutriments.carbohydrates_100g || null,
      energy: nutriments.energy_100g || product.energy || null,
      image_url: product.image_url || null,
      source: source,
    };

    if (!existing) {
      await supabase.from('products_master').insert(newData);
    } else {
      const updates: any = {};
      let hasUpdates = false;

      if (!existing.product_name && newData.product_name) {
        updates.product_name = newData.product_name;
        hasUpdates = true;
      }
      if (!existing.brand && newData.brand) {
        updates.brand = newData.brand;
        hasUpdates = true;
      }
      if (!existing.ingredients && newData.ingredients) {
        updates.ingredients = newData.ingredients;
        hasUpdates = true;
      }
      if (!existing.protein && newData.protein) {
        updates.protein = newData.protein;
        hasUpdates = true;
      }
      if (!existing.fat && newData.fat) {
        updates.fat = newData.fat;
        hasUpdates = true;
      }
      if (!existing.fiber && newData.fiber) {
        updates.fiber = newData.fiber;
        hasUpdates = true;
      }
      if (!existing.carbohydrates && newData.carbohydrates) {
        updates.carbohydrates = newData.carbohydrates;
        hasUpdates = true;
      }
      if (!existing.energy && newData.energy) {
        updates.energy = newData.energy;
        hasUpdates = true;
      }
      if (!existing.image_url && newData.image_url) {
        updates.image_url = newData.image_url;
        hasUpdates = true;
      }

      if (hasUpdates) {
        await supabase
          .from('products_master')
          .update(updates)
          .eq('barcode', barcode);
      }
    }
  } catch (error) {
    console.error('Error saving to products_master:', error);
  }
}
