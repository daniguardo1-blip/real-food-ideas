export interface NonFoodSafetyResult {
  score: number;
  warnings: string[];
  explanation: string;
  hasLimitedData: boolean;
}

interface RiskySubstance {
  keywords: string[];
  warning: {
    es: string;
    en: string;
  };
  penalty: number;
}

const RISKY_SUBSTANCES: RiskySubstance[] = [
  {
    keywords: ['paraben', 'methylparaben', 'propylparaben', 'butylparaben'],
    warning: {
      es: 'Contiene parabenos (posibles disruptores endocrinos)',
      en: 'Contains parabens (possible endocrine disruptors)',
    },
    penalty: 15,
  },
  {
    keywords: ['phthalate', 'ftalato', 'dehp', 'dbp', 'bbp'],
    warning: {
      es: 'Contiene ftalatos (tóxicos para el sistema reproductivo)',
      en: 'Contains phthalates (toxic to reproductive system)',
    },
    penalty: 20,
  },
  {
    keywords: ['sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles', 'lauril sulfato'],
    warning: {
      es: 'Contiene sulfatos agresivos (pueden irritar la piel)',
      en: 'Contains harsh sulfates (may irritate skin)',
    },
    penalty: 10,
  },
  {
    keywords: ['formaldehyde', 'formaldehído', 'dmdm hydantoin', 'quaternium-15'],
    warning: {
      es: 'Contiene liberadores de formaldehído (cancerígeno)',
      en: 'Contains formaldehyde releasers (carcinogenic)',
    },
    penalty: 25,
  },
  {
    keywords: ['triclosan', 'triclosán'],
    warning: {
      es: 'Contiene triclosán (disruptor endocrino y antibacteriano innecesario)',
      en: 'Contains triclosan (endocrine disruptor and unnecessary antibacterial)',
    },
    penalty: 18,
  },
  {
    keywords: ['artificial fragrance', 'parfum', 'fragrance', 'perfume'],
    warning: {
      es: 'Contiene fragancias artificiales (pueden causar alergias)',
      en: 'Contains artificial fragrances (may cause allergies)',
    },
    penalty: 8,
  },
  {
    keywords: ['bha', 'bht', 'butylated hydroxyanisole', 'butylated hydroxytoluene'],
    warning: {
      es: 'Contiene BHA/BHT (posibles carcinógenos)',
      en: 'Contains BHA/BHT (possible carcinogens)',
    },
    penalty: 15,
  },
  {
    keywords: ['mineral oil', 'petrolatum', 'paraffin', 'aceite mineral', 'petrolato'],
    warning: {
      es: 'Contiene derivados del petróleo (pueden obstruir poros)',
      en: 'Contains petroleum derivatives (may clog pores)',
    },
    penalty: 7,
  },
  {
    keywords: ['propylene glycol', 'propilenglicol'],
    warning: {
      es: 'Contiene propilenglicol (puede causar irritación)',
      en: 'Contains propylene glycol (may cause irritation)',
    },
    penalty: 8,
  },
  {
    keywords: ['dea', 'tea', 'mea', 'diethanolamine', 'triethanolamine'],
    warning: {
      es: 'Contiene etanolaminas (irritantes y posibles carcinógenos)',
      en: 'Contains ethanolamines (irritants and possible carcinogens)',
    },
    penalty: 12,
  },
];

const POSITIVE_INDICATORS: Array<{
  keywords: string[];
  bonus: number;
}> = [
  {
    keywords: ['natural', 'organic', 'bio', 'ecológico', 'orgánico', 'natural'],
    bonus: 5,
  },
  {
    keywords: ['hypoallergenic', 'hipoalergénico'],
    bonus: 8,
  },
  {
    keywords: ['dermatologically tested', 'dermatológicamente probado', 'veterinary tested'],
    bonus: 10,
  },
  {
    keywords: ['no parabens', 'paraben free', 'sin parabenos'],
    bonus: 8,
  },
  {
    keywords: ['no sulfates', 'sulfate free', 'sin sulfatos'],
    bonus: 8,
  },
  {
    keywords: ['cruelty free', 'no animal testing', 'sin crueldad animal'],
    bonus: 5,
  },
  {
    keywords: ['biodegradable', 'biodegradable'],
    bonus: 7,
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function calculateNonFoodSafetyScore(
  product: any,
  language: string
): NonFoodSafetyResult {
  const lang = (language === 'es' ? 'es' : 'en') as 'es' | 'en';
  let score = 60;
  const warnings: string[] = [];
  let hasLimitedData = false;

  const ingredientsText = normalizeText(
    [
      product.ingredients_text,
      product.ingredients,
      product.composition,
      product.materials,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
  );

  const productName = normalizeText(product.product_name || '');
  const combinedText = `${ingredientsText} ${productName}`;

  if (!ingredientsText || ingredientsText.length < 10) {
    hasLimitedData = true;
    score = 50;
  }

  for (const substance of RISKY_SUBSTANCES) {
    const found = substance.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      return combinedText.includes(normalizedKeyword);
    });

    if (found) {
      score -= substance.penalty;
      warnings.push(substance.warning[lang]);
    }
  }

  for (const indicator of POSITIVE_INDICATORS) {
    const found = indicator.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      return combinedText.includes(normalizedKeyword);
    });

    if (found) {
      score += indicator.bonus;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let explanation = '';
  if (lang === 'es') {
    if (score >= 75) {
      explanation = 'Este producto parece tener una composición segura y pocos ingredientes preocupantes.';
    } else if (score >= 50) {
      explanation =
        'Este producto puede contener algunos ingredientes que requieren precaución. Revisa las advertencias.';
    } else {
      explanation =
        'Este producto contiene varios ingredientes potencialmente problemáticos. Considera alternativas más seguras.';
    }

    if (hasLimitedData) {
      explanation =
        'No hay suficiente información para un análisis completo. La puntuación se basa en datos limitados.';
    }
  } else {
    if (score >= 75) {
      explanation = 'This product appears to have a safe composition with few concerning ingredients.';
    } else if (score >= 50) {
      explanation =
        'This product may contain some ingredients that require caution. Review the warnings.';
    } else {
      explanation =
        'This product contains several potentially problematic ingredients. Consider safer alternatives.';
    }

    if (hasLimitedData) {
      explanation =
        'Not enough information for a complete analysis. Score is based on limited data.';
    }
  }

  return {
    score,
    warnings,
    explanation,
    hasLimitedData,
  };
}

export function detectProductType(product: any): 'food' | 'non-food' {
  if (
    product.nutriments ||
    product.nutrient_levels ||
    product.nutrition_grades ||
    product.nutriscore_score ||
    product.nutriscore_grade
  ) {
    return 'food';
  }

  const foodKeywords = [
    'kcal',
    'calories',
    'protein',
    'fat',
    'carbohydrate',
    'proteína',
    'grasa',
    'carbohidrato',
    'nutrition',
    'nutrición',
  ];

  const productText = normalizeText(
    [product.product_name, product.ingredients_text, product.categories]
      .filter(Boolean)
      .join(' ')
  );

  const isFoodByKeywords = foodKeywords.some((keyword) =>
    productText.includes(normalizeText(keyword))
  );

  if (isFoodByKeywords) {
    return 'food';
  }

  const nonFoodKeywords = [
    'shampoo',
    'champú',
    'toy',
    'juguete',
    'collar',
    'leash',
    'correa',
    'bed',
    'cama',
    'cleaning',
    'limpieza',
    'hygiene',
    'higiene',
    'accessory',
    'accesorio',
    'brush',
    'cepillo',
  ];

  const isNonFoodByKeywords = nonFoodKeywords.some((keyword) =>
    productText.includes(normalizeText(keyword))
  );

  if (isNonFoodByKeywords) {
    return 'non-food';
  }

  return 'food';
}

export function getProductCategory(product: any): string {
  const text = normalizeText(
    [product.product_name, product.categories, product.description].filter(Boolean).join(' ')
  );

  const categories = [
    {
      keywords: ['shampoo', 'champú', 'conditioner', 'acondicionador', 'grooming'],
      name: { es: 'champú', en: 'shampoo' },
    },
    {
      keywords: ['toy', 'juguete', 'ball', 'pelota', 'chew'],
      name: { es: 'juguete', en: 'toy' },
    },
    {
      keywords: ['collar', 'leash', 'correa', 'harness', 'arnés'],
      name: { es: 'collar/correa', en: 'collar/leash' },
    },
    {
      keywords: ['bed', 'cama', 'blanket', 'manta'],
      name: { es: 'cama', en: 'bed' },
    },
    {
      keywords: ['cleaning', 'limpieza', 'cleaner', 'limpiador', 'disinfect'],
      name: { es: 'limpieza', en: 'cleaning' },
    },
    {
      keywords: ['brush', 'cepillo', 'comb', 'peine'],
      name: { es: 'cepillo', en: 'brush' },
    },
    {
      keywords: ['bowl', 'cuenco', 'feeder', 'comedero'],
      name: { es: 'comedero', en: 'bowl' },
    },
  ];

  for (const category of categories) {
    const found = category.keywords.some((keyword) => text.includes(normalizeText(keyword)));
    if (found) {
      return category.name.es;
    }
  }

  return 'accesorio';
}

export function generateNonFoodAlternative(
  product: any,
  language: string
): { name: string; reason: string } {
  const lang = (language === 'es' ? 'es' : 'en') as 'es' | 'en';
  const category = getProductCategory(product);

  const alternatives: Record<string, { name: { es: string; en: string }; reason: { es: string; en: string } }> = {
    champú: {
      name: {
        es: 'Champú hipoalergénico natural',
        en: 'Natural hypoallergenic shampoo',
      },
      reason: {
        es: 'Sin sulfatos, parabenos ni fragancias artificiales. Formulación suave con ingredientes naturales.',
        en: 'No sulfates, parabens or artificial fragrances. Gentle formulation with natural ingredients.',
      },
    },
    juguete: {
      name: {
        es: 'Juguete de caucho natural certificado',
        en: 'Certified natural rubber toy',
      },
      reason: {
        es: 'Material no tóxico, libre de BPA y ftalatos. Seguro para masticar.',
        en: 'Non-toxic material, BPA and phthalate free. Safe for chewing.',
      },
    },
    'collar/correa': {
      name: {
        es: 'Collar de materiales orgánicos',
        en: 'Organic material collar',
      },
      reason: {
        es: 'Fabricado con materiales naturales sin químicos dañinos.',
        en: 'Made with natural materials without harmful chemicals.',
      },
    },
    cama: {
      name: {
        es: 'Cama con relleno ecológico',
        en: 'Bed with eco-friendly filling',
      },
      reason: {
        es: 'Tejidos orgánicos certificados, sin retardantes de llama tóxicos.',
        en: 'Certified organic fabrics, no toxic flame retardants.',
      },
    },
    limpieza: {
      name: {
        es: 'Limpiador enzimático natural',
        en: 'Natural enzymatic cleaner',
      },
      reason: {
        es: 'Biodegradable, sin químicos agresivos. Seguro para mascotas y el medio ambiente.',
        en: 'Biodegradable, no harsh chemicals. Safe for pets and environment.',
      },
    },
    cepillo: {
      name: {
        es: 'Cepillo de bambú con cerdas naturales',
        en: 'Bamboo brush with natural bristles',
      },
      reason: {
        es: 'Materiales sostenibles y cerdas suaves para la piel.',
        en: 'Sustainable materials and gentle bristles for skin.',
      },
    },
  };

  const alternative = alternatives[category] || {
    name: {
      es: 'Producto certificado ecológico',
      en: 'Certified eco-friendly product',
    },
    reason: {
      es: 'Busca productos con certificaciones de seguridad y materiales naturales.',
      en: 'Look for products with safety certifications and natural materials.',
    },
  };

  return {
    name: alternative.name[lang],
    reason: alternative.reason[lang],
  };
}
