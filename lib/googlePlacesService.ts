interface PlaceSearchResult {
  id: string;
  displayName: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  websiteUri?: string;
  types?: string[];
  primaryType?: string;
}

interface TextSearchResponse {
  places: PlaceSearchResult[];
}

export interface Shelter {
  name: string;
  location: string;
  description: string;
  website?: string;
}

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const RELEVANT_SHELTER_TYPES = [
  'animal_shelter',
  'veterinary_care',
  'pet_store',
];

const RELEVANT_KEYWORDS = [
  'protectora',
  'refugio',
  'adopción',
  'adopcion',
  'rescue',
  'shelter',
  'animal',
  'animales',
  'acogida',
  'protección',
  'proteccion',
];

function isShelterRelevant(place: PlaceSearchResult): boolean {
  const name = place.displayName?.text?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType?.toLowerCase() || '';

  const hasRelevantType = types.some(type =>
    type.includes('animal') ||
    type.includes('shelter') ||
    type.includes('veterinary')
  ) || primaryType.includes('animal') || primaryType.includes('shelter');

  const hasRelevantKeyword = RELEVANT_KEYWORDS.some(keyword =>
    name.includes(keyword)
  );

  const excludeKeywords = ['tienda', 'store', 'shop', 'hotel', 'peluquería', 'grooming'];
  const hasExcludedKeyword = excludeKeywords.some(keyword =>
    name.includes(keyword)
  );

  if (hasExcludedKeyword && !hasRelevantKeyword) {
    return false;
  }

  return hasRelevantKeyword || hasRelevantType;
}

function generateDescription(place: PlaceSearchResult, language: string): string {
  const isSpanish = language === 'es';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  if (types.includes('animal_shelter') || primaryType.includes('animal_shelter')) {
    return isSpanish
      ? 'Refugio de animales. Adopción y protección de animales abandonados.'
      : 'Animal shelter. Adoption and protection of abandoned animals.';
  }

  const name = place.displayName?.text?.toLowerCase() || '';
  if (name.includes('protectora')) {
    return isSpanish
      ? 'Protectora de animales. Rescate, acogida y adopción de animales.'
      : 'Animal protection organization. Rescue, fostering and adoption of animals.';
  }

  if (name.includes('refugio')) {
    return isSpanish
      ? 'Refugio de animales. Centro de acogida y adopción.'
      : 'Animal refuge. Shelter and adoption center.';
  }

  if (name.includes('adopción') || name.includes('adopcion')) {
    return isSpanish
      ? 'Centro de adopción de animales de compañía.'
      : 'Companion animal adoption center.';
  }

  return isSpanish
    ? 'Organización dedicada al bienestar animal.'
    : 'Organization dedicated to animal welfare.';
}

export async function searchShelters(
  locationQuery: string,
  language: string,
  searchType: 'shelter' | 'veterinary' | 'grooming' = 'shelter'
): Promise<Shelter[]> {
  if (!PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    let queries: string[];

    if (searchType === 'veterinary') {
      queries = language === 'es'
        ? [
            `veterinario en ${locationQuery}`,
            `clínica veterinaria en ${locationQuery}`,
            `hospital veterinario en ${locationQuery}`,
          ]
        : [
            `veterinarian in ${locationQuery}`,
            `veterinary clinic in ${locationQuery}`,
            `animal hospital in ${locationQuery}`,
          ];
    } else if (searchType === 'grooming') {
      queries = language === 'es'
        ? [
            `peluquería canina en ${locationQuery}`,
            `peluquería para perros en ${locationQuery}`,
            `estética canina en ${locationQuery}`,
          ]
        : [
            `dog grooming in ${locationQuery}`,
            `pet grooming in ${locationQuery}`,
            `dog groomer in ${locationQuery}`,
          ];
    } else {
      queries = language === 'es'
        ? [
            `protectora animales en ${locationQuery}`,
            `refugio animales en ${locationQuery}`,
            `adopción perros gatos en ${locationQuery}`,
          ]
        : [
            `animal shelter in ${locationQuery}`,
            `pet rescue in ${locationQuery}`,
            `animal adoption in ${locationQuery}`,
          ];
    }

    const allResults: PlaceSearchResult[] = [];

    for (const query of queries) {
      const response = await fetch(TEXT_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.types,places.primaryType',
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: language === 'es' ? 'es' : 'en',
          maxResultCount: 10,
        }),
      });

      if (!response.ok) {
        console.error('Google Places API error:', response.status, await response.text());
        continue;
      }

      const data: TextSearchResponse = await response.json();

      if (data.places && data.places.length > 0) {
        allResults.push(...data.places);
      }
    }

    const uniquePlaces = new Map<string, PlaceSearchResult>();
    allResults.forEach(place => {
      if (place.id && !uniquePlaces.has(place.id)) {
        uniquePlaces.set(place.id, place);
      }
    });

    const maxResults = searchType === 'veterinary' ? 4 : searchType === 'grooming' ? 4 : 8;
    const relevantPlaces = Array.from(uniquePlaces.values())
      .filter(searchType === 'veterinary' || searchType === 'grooming' ? () => true : isShelterRelevant)
      .slice(0, maxResults);

    const getDescription = (place: PlaceSearchResult): string => {
      if (searchType === 'veterinary') {
        return language === 'es'
          ? 'Clínica veterinaria. Atención médica y servicios veterinarios.'
          : 'Veterinary clinic. Medical care and veterinary services.';
      }
      if (searchType === 'grooming') {
        return language === 'es'
          ? 'Peluquería canina. Servicios de estética y cuidado para perros.'
          : 'Dog grooming. Pet grooming and care services.';
      }
      return generateDescription(place, language);
    };

    const shelters: Shelter[] = relevantPlaces.map(place => ({
      name: place.displayName?.text || 'Unknown',
      location: place.formattedAddress || locationQuery,
      description: getDescription(place),
      website: place.websiteUri,
    }));

    return shelters;
  } catch (error) {
    console.error('Error searching shelters:', error);
    return [];
  }
}
