import { supabase } from './supabaseClient';

interface EnrichedProductData {
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
  data_confidence?: 'high' | 'medium' | 'low';
  enrichment_source?: string;
}

function capitalizeFirstLetter(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeProductData(product: EnrichedProductData): EnrichedProductData {
  return {
    ...product,
    product_name: capitalizeFirstLetter(product.product_name || ''),
    brands: product.brands || '',
    ingredients_text: product.ingredients_text || '',
    image_url: product.image_url || '',
  };
}

export async function enrichProductData(
  barcode: string,
  baseProduct: any,
  source: string
): Promise<EnrichedProductData> {
  let enrichedData: EnrichedProductData = {
    ...baseProduct,
    data_confidence: 'medium',
  };

  enrichedData = extractNutritionFromNutriments(enrichedData);
  enrichedData = detectProductType(enrichedData);
  enrichedData = await attemptWebEnrichment(barcode, enrichedData);
  enrichedData = normalizeProductData(enrichedData);

  return enrichedData;
}

function extractNutritionFromNutriments(product: EnrichedProductData): EnrichedProductData {
  const nutriments = product.nutriments || {};

  const protein = parseFloat(nutriments.proteins_100g || nutriments.proteins || nutriments.protein_100g || 0);
  const fat = parseFloat(nutriments.fat_100g || nutriments.fat || nutriments['total-fat_100g'] || 0);
  const fiber = parseFloat(nutriments.fiber_100g || nutriments.fiber || nutriments['dietary-fiber_100g'] || 0);
  const ash = parseFloat(nutriments.ash_100g || nutriments.ash || nutriments.minerals_100g || 0);
  const energy = parseFloat(nutriments.energy_100g || nutriments['energy-kcal_100g'] || nutriments.energy || 0);

  return {
    ...product,
    protein: protein > 0 ? protein : undefined,
    fat: fat > 0 ? fat : undefined,
    fiber: fiber > 0 ? fiber : undefined,
    ash: ash > 0 ? ash : undefined,
    energy: energy > 0 ? energy : undefined,
  };
}

function detectProductType(product: EnrichedProductData): EnrichedProductData {
  const name = (product.product_name || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const ingredients = (product.ingredients_text || '').toLowerCase();
  const combined = `${name} ${categories} ${ingredients}`;

  const isVeterinaryFood =
    combined.includes('veterinary') ||
    combined.includes('prescription') ||
    combined.includes('vet diet') ||
    combined.includes('therapeutic') ||
    combined.includes('clinical') ||
    combined.includes('medicado') ||
    combined.includes('veterinario');

  const isSnack =
    combined.includes('treat') ||
    combined.includes('premio') ||
    combined.includes('reward') ||
    combined.includes('snack') ||
    combined.includes('golosina') ||
    combined.includes('dental') ||
    combined.includes('chew') ||
    combined.includes('stick') ||
    combined.includes('bone') ||
    combined.includes('masticable') ||
    combined.includes('complementary') ||
    combined.includes('complementario');

  let productType = 'complete food';
  if (isVeterinaryFood) {
    productType = 'veterinary diet';
  } else if (isSnack) {
    productType = 'treat/snack';
  } else if (combined.includes('puppy') || combined.includes('cachorro')) {
    productType = 'puppy food';
  } else if (combined.includes('senior') || combined.includes('senior')) {
    productType = 'senior food';
  }

  return {
    ...product,
    is_veterinary_food: isVeterinaryFood,
    is_snack: isSnack,
    product_type: productType,
  };
}

async function attemptWebEnrichment(
  barcode: string,
  product: EnrichedProductData
): Promise<EnrichedProductData> {
  const hasMinimalNutrition = product.protein && product.fat;

  if (hasMinimalNutrition) {
    return {
      ...product,
      data_confidence: 'high',
    };
  }

  const brandName = product.brands || '';
  const productName = product.product_name || '';

  if (!brandName && !productName) {
    return {
      ...product,
      data_confidence: 'low',
    };
  }

  try {
    const searchQuery = `${brandName} ${productName} pet food nutrition ingredients guaranteed analysis`.trim();

    const enrichedFromWeb = await searchTrustedSources(searchQuery, barcode, product);

    if (enrichedFromWeb) {
      return {
        ...product,
        ...enrichedFromWeb,
        data_confidence: enrichedFromWeb.data_confidence || 'medium',
        enrichment_source: 'web search',
      };
    }
  } catch (error) {
    console.error('Web enrichment error:', error);
  }

  return {
    ...product,
    data_confidence: product.protein || product.fat ? 'medium' : 'low',
  };
}

async function searchTrustedSources(
  searchQuery: string,
  barcode: string,
  product: EnrichedProductData
): Promise<Partial<EnrichedProductData> | null> {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.EXPO_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google Search API credentials not configured');
    return null;
  }

  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=3`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error('Google Search API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    for (const item of data.items) {
      const pageUrl = item.link;
      const snippet = item.snippet || '';
      const title = item.title || '';

      if (isTrustedSource(pageUrl)) {
        const extractedData = await extractProductDataFromPage(pageUrl, snippet, title, product);

        if (extractedData && hasUsefulData(extractedData)) {
          return extractedData;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching trusted sources:', error);
    return null;
  }
}

function isTrustedSource(url: string): boolean {
  const trustedDomains = [
    'royalcanin.com',
    'purina.com',
    'hillspet.com',
    'iams.com',
    'pedigree.com',
    'whiskas.com',
    'eukanuba.com',
    'affinity-petcare.com',
    'mars.com',
    'nestle.com',
    'chewy.com',
    'petco.com',
    'petsmart.com',
    'amazon.com',
    'amazon.es',
    'zooplus.com',
    'tiendanimal.es',
    'kiwoko.com',
    'veterinaria.org',
  ];

  const lowerUrl = url.toLowerCase();
  return trustedDomains.some(domain => lowerUrl.includes(domain)) || lowerUrl.includes('.pdf');
}

async function extractProductDataFromPage(
  url: string,
  snippet: string,
  title: string,
  baseProduct: EnrichedProductData
): Promise<Partial<EnrichedProductData> | null> {
  try {
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PetFoodScanner/1.0)',
      },
    });

    if (!pageResponse.ok) {
      return extractDataFromSnippet(snippet, title, baseProduct);
    }

    const html = await pageResponse.text();

    return await extractDataWithAI(html, snippet, title, baseProduct);
  } catch (error) {
    console.error('Error fetching page:', error);
    return extractDataFromSnippet(snippet, title, baseProduct);
  }
}

async function extractDataWithAI(
  html: string,
  snippet: string,
  title: string,
  baseProduct: EnrichedProductData
): Promise<Partial<EnrichedProductData> | null> {
  const cleanText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000);

  const combinedText = `${title}\n${snippet}\n${cleanText}`;

  const extractedData = extractNutritionFromText(combinedText);

  if (hasUsefulData(extractedData)) {
    return {
      ...extractedData,
      data_confidence: 'medium',
    };
  }

  return null;
}

function extractDataFromSnippet(
  snippet: string,
  title: string,
  baseProduct: EnrichedProductData
): Partial<EnrichedProductData> | null {
  const combinedText = `${title} ${snippet}`;
  return extractNutritionFromText(combinedText);
}

function extractNutritionFromText(text: string): Partial<EnrichedProductData> {
  const lowerText = text.toLowerCase();
  const extractedData: Partial<EnrichedProductData> = {};

  const proteinMatch = text.match(/prote[ií]n[ae]?s?[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                       text.match(/crude protein[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                       text.match(/protein[:\s]+min[.\s]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (proteinMatch) {
    extractedData.protein = parseFloat(proteinMatch[1].replace(',', '.'));
  }

  const fatMatch = text.match(/gras[ae]s?[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                   text.match(/crude fat[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                   text.match(/fat[:\s]+min[.\s]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (fatMatch) {
    extractedData.fat = parseFloat(fatMatch[1].replace(',', '.'));
  }

  const fiberMatch = text.match(/fibra[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                     text.match(/crude fiber[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                     text.match(/fiber[:\s]+max[.\s]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (fiberMatch) {
    extractedData.fiber = parseFloat(fiberMatch[1].replace(',', '.'));
  }

  const ashMatch = text.match(/cenizas?[:\s]+(\d+(?:[.,]\d+)?)\s*%/i) ||
                   text.match(/ash[:\s]+max[.\s]*(\d+(?:[.,]\d+)?)\s*%/i) ||
                   text.match(/minerals?[:\s]+(\d+(?:[.,]\d+)?)\s*%/i);
  if (ashMatch) {
    extractedData.ash = parseFloat(ashMatch[1].replace(',', '.'));
  }

  const energyMatch = text.match(/energ[ií]a[:\s]+(\d+(?:[.,]\d+)?)\s*(?:kcal|cal)/i) ||
                      text.match(/calories?[:\s]+(\d+(?:[.,]\d+)?)\s*(?:kcal|cal)/i) ||
                      text.match(/(\d+(?:[.,]\d+)?)\s*kcal[\s/]+(?:100\s*g|kg)/i);
  if (energyMatch) {
    extractedData.energy = parseFloat(energyMatch[1].replace(',', '.'));
  }

  const ingredientsMatch = text.match(/ingredien(?:ts|tes)[:\s]+([^.]{20,500})/i);
  if (ingredientsMatch && ingredientsMatch[1].length > 20) {
    const ingredients = ingredientsMatch[1]
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);

    if (ingredients.includes(',') || ingredients.includes(';')) {
      extractedData.ingredients_text = ingredients;
    }
  }

  return extractedData;
}

function hasUsefulData(data: Partial<EnrichedProductData> | null): boolean {
  if (!data) return false;

  return !!(
    data.protein ||
    data.fat ||
    data.fiber ||
    data.ash ||
    data.energy ||
    (data.ingredients_text && data.ingredients_text.length > 20)
  );
}

export async function saveEnrichedProduct(
  barcode: string,
  product: EnrichedProductData,
  source: string
): Promise<void> {
  try {
    await supabase
      .from('products_cache')
      .upsert({
        barcode,
        product_name: product.product_name || '',
        brands: product.brands || '',
        image_url: product.image_url || '',
        ingredients_text: product.ingredients_text || '',
        nutriments: product.nutriments || {},
        nutriscore_grade: product.nutriscore_grade || '',
        categories: product.categories || '',
        protein: product.protein,
        fat: product.fat,
        fiber: product.fiber,
        ash: product.ash,
        energy: product.energy,
        product_type: product.product_type || '',
        is_veterinary_food: product.is_veterinary_food || false,
        is_snack: product.is_snack || false,
        data_confidence: product.data_confidence || 'medium',
        enrichment_source: product.enrichment_source || source,
        enriched_at: new Date().toISOString(),
        source,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'barcode'
      });
  } catch (error) {
    console.error('Error saving enriched product:', error);
  }
}

export function hasMinimalDataForScoring(product: any): boolean {
  return !!(
    product.ingredients_text ||
    product.protein ||
    product.fat ||
    (product.nutriments && Object.keys(product.nutriments).length > 0)
  );
}
