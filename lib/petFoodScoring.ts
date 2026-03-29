export interface ProductData {
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  nutriments?: any;
  categories?: string;
  nutriscore_grade?: string;
}

export interface ScoringResult {
  score: number;
  label: string;
  explanation: string;
  productType: 'complete' | 'treat' | 'veterinary' | 'complementary' | 'unknown';
  badge?: string;
  notice?: string;
  hasEnoughData: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export function calculatePetFoodScore(product: ProductData, language: string = 'es'): ScoringResult {
  let score = 50;
  let hasNutritionalData = false;
  let hasIngredientData = false;
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  const productName = (product.product_name || '').toLowerCase();
  const brands = (product.brands || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const nutriments = product.nutriments || {};

  const productType = detectProductType(productName, categories, ingredientsText);

  if (ingredientsText.length > 10) {
    hasIngredientData = true;
  }

  const protein = parseFloat(nutriments.proteins_100g) || 0;
  const fat = parseFloat(nutriments.fat_100g) || 0;
  const fiber = parseFloat(nutriments.fiber_100g) || 0;
  const ash = parseFloat(nutriments.ash_100g) || 0;

  if (protein > 0 || fat > 0 || fiber > 0) {
    hasNutritionalData = true;
  }

  if (!hasNutritionalData && !hasIngredientData) {
    return {
      score: 0,
      label: language === 'es' ? 'Datos insuficientes' : 'Insufficient data',
      explanation: language === 'es'
        ? 'Este producto todavía no tiene suficiente información en nuestra base de datos para calcular una puntuación fiable.'
        : 'This product does not yet have enough information in our database to calculate a reliable score.',
      productType,
      hasEnoughData: false,
      confidence: 'low',
    };
  }

  if (hasNutritionalData) {
    if (productType === 'treat') {
      if (protein >= 15 && protein <= 35) {
        score += 10;
        positiveFactors.push(language === 'es' ? 'buen nivel de proteína para snack' : 'good protein level for treat');
      }
      if (fat >= 8 && fat <= 25) {
        score += 10;
        positiveFactors.push(language === 'es' ? 'grasa equilibrada' : 'balanced fat');
      }
    } else {
      if (protein >= 30) {
        score += 20;
        positiveFactors.push(language === 'es' ? 'alto contenido de proteína' : 'high protein content');
      } else if (protein >= 25) {
        score += 15;
        positiveFactors.push(language === 'es' ? 'buen nivel de proteína' : 'good protein level');
      } else if (protein >= 18) {
        score += 5;
      } else if (protein > 0 && protein < 18) {
        score -= 10;
        negativeFactors.push(language === 'es' ? 'bajo contenido de proteína' : 'low protein content');
      }

      if (fat >= 12 && fat <= 22) {
        score += 15;
        positiveFactors.push(language === 'es' ? 'nivel óptimo de grasa' : 'optimal fat level');
      } else if (fat >= 8 && fat <= 28) {
        score += 8;
      } else if (fat > 28) {
        score -= 8;
        negativeFactors.push(language === 'es' ? 'contenido de grasa muy alto' : 'very high fat content');
      } else if (fat > 0 && fat < 8) {
        score -= 5;
        negativeFactors.push(language === 'es' ? 'contenido de grasa bajo' : 'low fat content');
      }

      if (fiber >= 2 && fiber <= 5) {
        score += 8;
        positiveFactors.push(language === 'es' ? 'fibra equilibrada' : 'balanced fiber');
      } else if (fiber > 8) {
        score -= 5;
      }

      if (ash > 0 && ash <= 8) {
        score += 5;
      } else if (ash > 10) {
        score -= 8;
        negativeFactors.push(language === 'es' ? 'alto contenido de cenizas' : 'high ash content');
      }
    }
  }

  if (hasIngredientData) {
    if (ingredientsText.match(/\b(chicken|pollo|beef|ternera|res|salmon|salmón|fish|pescado|turkey|pavo|lamb|cordero|duck|pato)\b/)) {
      score += 12;
      positiveFactors.push(language === 'es' ? 'carne identificada' : 'identified meat');
    }

    if (ingredientsText.match(/\b(fresh|fresco|dehidratado|dehydrated)\s+(chicken|pollo|beef|ternera|salmon|salmón|fish|pescado)/)) {
      score += 8;
      positiveFactors.push(language === 'es' ? 'ingredientes de calidad' : 'quality ingredients');
    }

    if (ingredientsText.match(/\b(by-product|subproduct|subproducto|derivatives|derivados)\b/)) {
      score -= 15;
      negativeFactors.push(language === 'es' ? 'subproductos animales' : 'animal by-products');
    }

    const cerealMatches = ingredientsText.match(/\b(cereal|grain|wheat|trigo|corn|maíz|rice|arroz|soy|soja)\b/g);
    if (cerealMatches && cerealMatches.length >= 3) {
      score -= 12;
      negativeFactors.push(language === 'es' ? 'muchos cereales/rellenos' : 'many cereals/fillers');
    } else if (cerealMatches && cerealMatches.length >= 1) {
      score -= 5;
      negativeFactors.push(language === 'es' ? 'contiene cereales' : 'contains cereals');
    }

    if (ingredientsText.match(/\b(artificial color|colorant|colorante artificial|e[0-9]{3})\b/)) {
      score -= 10;
      negativeFactors.push(language === 'es' ? 'colorantes artificiales' : 'artificial colorants');
    }

    if (ingredientsText.match(/\b(bha|bht|preservative|conservante)\b/)) {
      score -= 10;
      negativeFactors.push(language === 'es' ? 'conservantes artificiales' : 'artificial preservatives');
    }

    if (ingredientsText.match(/\b(sugar|azúcar|syrup|jarabe|caramel|caramelo)\b/)) {
      score -= 8;
      negativeFactors.push(language === 'es' ? 'azúcares añadidos' : 'added sugars');
    }

    if (ingredientsText.match(/\b(meat and animal derivatives|carne y subproductos|vegetable protein extracts)\b/)) {
      score -= 12;
      negativeFactors.push(language === 'es' ? 'ingredientes vagos' : 'vague ingredients');
    }

    if (categories.match(/\b(complete|completo|balanced|equilibrado)\b/) && productType !== 'treat') {
      score += 10;
      positiveFactors.push(language === 'es' ? 'alimento completo' : 'complete food');
    }
  }

  score = Math.max(0, Math.min(100, score));

  const label = getScoreLabel(score, productType, language);
  const explanation = generateExplanation(score, productType, positiveFactors, negativeFactors, language);
  const { badge, notice } = getProductTypeInfo(productType, language);

  const confidence = hasNutritionalData && hasIngredientData ? 'high' : hasNutritionalData || hasIngredientData ? 'medium' : 'low';

  return {
    score,
    label,
    explanation,
    productType,
    badge,
    notice,
    hasEnoughData: true,
    confidence,
  };
}

function detectProductType(productName: string, categories: string, ingredients: string): 'complete' | 'treat' | 'veterinary' | 'complementary' | 'unknown' {
  const allText = `${productName} ${categories} ${ingredients}`.toLowerCase();

  if (allText.match(/\b(veterinary|veterinaria|prescription|veterinary diet|dieta veterinaria|urinary|renal|gastro|hypoallergenic|hipoalergénico)\b/)) {
    return 'veterinary';
  }

  if (allText.match(/\b(treat|premio|snack|chuche|reward|dental|stick|hueso|bone|chew|masticable)\b/)) {
    return 'treat';
  }

  if (allText.match(/\b(complementary|complementario|supplement|suplemento)\b/)) {
    return 'complementary';
  }

  if (allText.match(/\b(complete|completo|balanced|equilibrado|adult|adulto|puppy|cachorro|kitten|gatito)\b/)) {
    return 'complete';
  }

  return 'unknown';
}

function getScoreLabel(score: number, productType: string, language: string): string {
  if (score === 0) {
    return language === 'es' ? 'Datos insuficientes' : 'Insufficient data';
  }

  if (productType === 'veterinary') {
    if (language === 'es') {
      return score >= 70 ? 'Fórmula especializada' : 'Fórmula específica';
    } else {
      return score >= 70 ? 'Specialized formula' : 'Specific formula';
    }
  }

  if (score >= 90) return language === 'es' ? 'Excelente' : 'Excellent';
  if (score >= 75) return language === 'es' ? 'Bueno' : 'Good';
  if (score >= 55) return language === 'es' ? 'Promedio' : 'Average';
  if (score >= 35) return language === 'es' ? 'Bajo' : 'Low';
  return language === 'es' ? 'Pobre' : 'Poor';
}

function generateExplanation(
  score: number,
  productType: string,
  positiveFactors: string[],
  negativeFactors: string[],
  language: string
): string {
  if (score === 0) {
    return language === 'es'
      ? 'No hay suficiente información nutricional o de ingredientes para evaluar este producto.'
      : 'Not enough nutritional or ingredient information to evaluate this product.';
  }

  if (productType === 'veterinary') {
    return language === 'es'
      ? 'Este es un alimento veterinario especializado. Debe administrarse según las recomendaciones de tu veterinario.'
      : 'This is a specialized veterinary food. It should be administered according to your veterinarian\'s recommendations.';
  }

  if (productType === 'treat') {
    if (language === 'es') {
      if (negativeFactors.length > 0) {
        return `Producto premio con algunos aspectos a mejorar: ${negativeFactors.slice(0, 2).join(', ')}.`;
      }
      if (positiveFactors.length > 0) {
        return `Snack con características aceptables: ${positiveFactors.slice(0, 2).join(', ')}.`;
      }
      return 'Producto premio. Usar como complemento, no como alimento principal.';
    } else {
      if (negativeFactors.length > 0) {
        return `Treat product with some areas for improvement: ${negativeFactors.slice(0, 2).join(', ')}.`;
      }
      if (positiveFactors.length > 0) {
        return `Treat with acceptable characteristics: ${positiveFactors.slice(0, 2).join(', ')}.`;
      }
      return 'Treat product. Use as a complement, not as main food.';
    }
  }

  if (language === 'es') {
    if (score >= 75) {
      const reasons = positiveFactors.slice(0, 2).join(', ');
      return reasons ? `Buena calidad nutricional: ${reasons}.` : 'Producto con buena calidad nutricional general.';
    }
    if (score >= 55) {
      const mainIssue = negativeFactors.length > 0 ? negativeFactors[0] : '';
      const mainBenefit = positiveFactors.length > 0 ? positiveFactors[0] : '';
      if (mainIssue && mainBenefit) {
        return `Calidad aceptable pero contiene: ${mainIssue}.`;
      }
      return 'Calidad nutricional promedio, puede mejorarse.';
    }
    if (negativeFactors.length >= 2) {
      return `Calidad limitada debido a: ${negativeFactors.slice(0, 2).join(', ')}.`;
    }
    return 'Calidad nutricional baja. Considera opciones con mejores ingredientes.';
  } else {
    if (score >= 75) {
      const reasons = positiveFactors.slice(0, 2).join(', ');
      return reasons ? `Good nutritional quality: ${reasons}.` : 'Product with good overall nutritional quality.';
    }
    if (score >= 55) {
      const mainIssue = negativeFactors.length > 0 ? negativeFactors[0] : '';
      const mainBenefit = positiveFactors.length > 0 ? positiveFactors[0] : '';
      if (mainIssue && mainBenefit) {
        return `Acceptable quality but contains: ${mainIssue}.`;
      }
      return 'Average nutritional quality, could be improved.';
    }
    if (negativeFactors.length >= 2) {
      return `Limited quality due to: ${negativeFactors.slice(0, 2).join(', ')}.`;
    }
    return 'Low nutritional quality. Consider options with better ingredients.';
  }
}

function getProductTypeInfo(productType: string, language: string): { badge?: string; notice?: string } {
  if (productType === 'veterinary') {
    return {
      badge: language === 'es' ? 'Dieta veterinaria' : 'Veterinary diet',
      notice: language === 'es'
        ? 'Este alimento puede ser adecuado para tu mascota porque ha sido recetado por tu veterinario.'
        : 'This food may be suitable for your pet because it has been prescribed by your veterinarian.',
    };
  }

  if (productType === 'treat') {
    return {
      badge: language === 'es' ? 'Snack / Premio' : 'Snack / Treat',
      notice: language === 'es'
        ? 'Este producto es un alimento premio. Lo recomendable es ofrecer una pequeña cantidad al día y complementarlo con un alimento base completo y equilibrado.'
        : 'This product is a treat. It is recommended to offer a small amount per day and complement it with a complete and balanced main food.',
    };
  }

  if (productType === 'complementary') {
    return {
      badge: language === 'es' ? 'Complementario' : 'Complementary',
      notice: language === 'es'
        ? 'Este es un alimento complementario. Debe combinarse con un alimento completo para asegurar una dieta equilibrada.'
        : 'This is a complementary food. It should be combined with a complete food to ensure a balanced diet.',
    };
  }

  return {};
}
