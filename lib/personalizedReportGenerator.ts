interface PetProfile {
  pet_type: string;
  age_years: number;
  breed?: string | null;
  pet_name?: string;
}

interface ProductData {
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  nutriments?: any;
  categories?: string;
}

interface IngredientAnalysis {
  name: string;
  rating: 'good' | 'medium' | 'bad';
  explanation: string;
}

interface PersonalizedReport {
  isValid: boolean;
  errorMessage?: string;
  ingredientQuality: string;
  suitability: string;
  ageRecommendation: string;
  advice: string[];
  detailedWarnings: string[];
  ingredientBreakdown: IngredientAnalysis[];
}

function detectProductAnimalType(productData: ProductData): string {
  const productNameLower = productData.product_name.toLowerCase();
  const categoriesLower = (productData.categories || '').toLowerCase();
  const ingredientsLower = (productData.ingredients_text || '').toLowerCase();
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
      combinedText.includes('goldfish') || combinedText.includes('pez')) {
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

  return 'unknown';
}

function normalizePetType(petType: string): string {
  const normalized = petType.toLowerCase().trim();

  if (normalized.includes('perro') || normalized.includes('dog')) return 'dog';
  if (normalized.includes('gato') || normalized.includes('cat')) return 'cat';
  if (normalized.includes('pájaro') || normalized.includes('ave') || normalized.includes('bird')) return 'bird';
  if (normalized.includes('pez') || normalized.includes('fish')) return 'fish';
  if (normalized.includes('conejo') || normalized.includes('rabbit')) return 'rabbit';
  if (normalized.includes('roedor') || normalized.includes('hamster') || normalized.includes('rodent')) return 'rodent';

  return normalized;
}

function getLifeStage(petType: string, age: number, language: string): { stage: string; description: string } {
  if (petType === 'dog') {
    if (age < 1) {
      return {
        stage: language === 'es' ? 'Cachorro' : 'Puppy',
        description: language === 'es'
          ? 'Etapa de crecimiento donde necesita nutrición especial para desarrollar huesos y músculos fuertes.'
          : 'Growth stage where special nutrition is needed to develop strong bones and muscles.'
      };
    } else if (age >= 1 && age <= 7) {
      return {
        stage: language === 'es' ? 'Adulto' : 'Adult',
        description: language === 'es'
          ? 'Etapa de madurez donde necesita alimentación balanceada para mantener su peso y energía.'
          : 'Maturity stage where balanced nutrition is needed to maintain weight and energy.'
      };
    } else {
      return {
        stage: language === 'es' ? 'Senior' : 'Senior',
        description: language === 'es'
          ? 'Etapa senior donde necesita alimento especial para cuidar sus articulaciones y órganos.'
          : 'Senior stage where special food is needed to care for joints and organs.'
      };
    }
  }

  if (petType === 'cat') {
    if (age < 1) {
      return {
        stage: language === 'es' ? 'Gatito' : 'Kitten',
        description: language === 'es'
          ? 'Etapa de crecimiento rápido donde necesita mucha proteína para desarrollarse bien.'
          : 'Rapid growth stage where lots of protein is needed for proper development.'
      };
    } else if (age >= 1 && age <= 7) {
      return {
        stage: language === 'es' ? 'Adulto' : 'Adult',
        description: language === 'es'
          ? 'Etapa adulta donde necesita dieta rica en proteína animal para mantener su salud.'
          : 'Adult stage where protein-rich diet is needed to maintain health.'
      };
    } else {
      return {
        stage: language === 'es' ? 'Senior' : 'Senior',
        description: language === 'es'
          ? 'Etapa senior donde necesita cuidado especial de riñones y articulaciones.'
          : 'Senior stage where special care for kidneys and joints is needed.'
      };
    }
  }

  return {
    stage: language === 'es' ? 'Adulto' : 'Adult',
    description: language === 'es'
      ? 'Etapa de mantenimiento con nutrición balanceada.'
      : 'Maintenance stage with balanced nutrition.'
  };
}

function generateAgeBasedAnalysis(
  petProfile: PetProfile,
  productData: ProductData,
  score: number,
  language: string
): string {
  const age = petProfile.age_years;
  const petType = normalizePetType(petProfile.pet_type);
  const productName = productData.product_name.toLowerCase();
  const categories = (productData.categories || '').toLowerCase();
  const combined = `${productName} ${categories}`;
  const lifeStage = getLifeStage(petType, age, language);

  let sections: string[] = [];

  sections.push(
    language === 'es'
      ? `Etapa de vida: ${lifeStage.stage}`
      : `Life stage: ${lifeStage.stage}`
  );

  sections.push(lifeStage.description);

  if (petType === 'dog') {
    if (age < 1) {
      const ageMonths = Math.round(age * 12);
      if (combined.includes('puppy') || combined.includes('cachorro') || combined.includes('junior')) {
        sections.push(
          language === 'es'
            ? `Para cachorro de ${ageMonths} meses: Este alimento está bien hecho para cachorros. Tiene suficiente proteína y grasa para que crezca sano. Dale de comer 3-4 veces al día y pésalo cada semana para ver que crece bien.`
            : `For ${ageMonths}-month-old puppy: This food is well made for puppies. Has enough protein and fat for healthy growth. Feed 3-4 times daily and weigh weekly to check proper growth.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `ADVERTENCIA: Este alimento no es para cachorros de ${ageMonths} meses. Los cachorros necesitan alta proteína y grasa para crecer bien. Sin esto pueden tener problemas en huesos, cerebro y defensas. Busca un alimento especial para cachorros certificado.`
            : `WARNING: This food is not for ${ageMonths}-month-old puppies. Puppies need high protein and fat to grow properly. Without this they may have problems with bones, brain and immune system. Look for certified puppy food.`
        );
      }
    } else if (age >= 1 && age <= 7) {
      if (combined.includes('adult') || combined.includes('adulto')) {
        sections.push(
          language === 'es'
            ? `Para adulto de ${age} años: Este alimento es bueno para perros adultos. Tiene buena proteína y grasa, más omega-3 y omega-6 para la piel y el pelaje. Dale de comer 2 veces al día y ajusta la cantidad según su peso.`
            : `For ${age}-year-old adult: This food is good for adult dogs. Has good protein and fat, plus omega-3 and omega-6 for skin and coat. Feed 2 times daily and adjust amount by weight.`
        );
      } else if (combined.includes('senior') || combined.includes('7+')) {
        sections.push(
          language === 'es'
            ? `Este alimento es para perros mayores pero tu perro de ${age} años todavía es adulto. Los alimentos senior tienen menos calorías y pueden no darle energía suficiente si es activo. Úsalo solo si está con sobrepeso o es poco activo.`
            : `This food is for senior dogs but your ${age}-year-old is still an adult. Senior foods have fewer calories and may not provide enough energy if active. Use only if overweight or not very active.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `Para adulto de ${age} años: Necesita proteína de carne, grasa moderada y vitaminas A, D, E. La carne debe ser el primer ingrediente. Llévalo al veterinario una vez al año.`
            : `For ${age}-year-old adult: Needs meat protein, moderate fat and vitamins A, D, E. Meat should be the first ingredient. Take to vet once a year.`
        );
      }
    } else {
      if (combined.includes('senior') || combined.includes('7+') || combined.includes('8+')) {
        sections.push(
          language === 'es'
            ? `Para senior de ${age} años: Este alimento está bien hecho para perros mayores. Tiene proteína fácil de digerir, menos grasa y suplementos para las articulaciones. Dale un poco menos de comida que cuando era adulto y divide en 2-3 comidas pequeñas. Llévalo al veterinario cada 6 meses.`
            : `For ${age}-year-old senior: This food is well made for senior dogs. Has easy-to-digest protein, less fat and joint supplements. Give a bit less food than when adult and divide into 2-3 small meals. Take to vet every 6 months.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `IMPORTANTE: Tu perro de ${age} años necesita alimento especial para mayores. A esta edad baja su energía, pierde músculo y los riñones trabajan menos. Busca alimento senior con proteína fácil de digerir, poco fósforo y suplementos para articulaciones. Consulta con tu veterinario antes de cambiar.`
            : `IMPORTANT: Your ${age}-year-old dog needs special senior food. At this age energy decreases, muscle is lost and kidneys work less. Look for senior food with easy-to-digest protein, low phosphorus and joint supplements. Consult your vet before changing.`
        );
      }
    }
  }

  if (petType === 'cat') {
    if (age < 1) {
      const ageMonths = Math.round(age * 12);
      if (combined.includes('kitten') || combined.includes('gatito')) {
        sections.push(
          language === 'es'
            ? `Para gatito de ${ageMonths} meses: Este alimento está bien para gatitos. Tiene proteína de carne, grasa, taurina que los gatos necesitan obligatoriamente, y DHA para los ojos y el cerebro. Deja que coma lo que quiera hasta los 6 meses, luego dale 3-4 comidas al día. Asegúrate de que tome mucha agua.`
            : `For ${ageMonths}-month-old kitten: This food is good for kittens. Has meat protein, fat, taurine which cats absolutely need, and DHA for eyes and brain. Let eat as much as wants until 6 months, then give 3-4 meals daily. Make sure they drink lots of water.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `ALERTA: Este alimento no sirve para gatito de ${ageMonths} meses. Los gatos son carnívoros estrictos y necesitan nutrientes que solo vienen de la carne (taurina, arginina, vitamina A). Sin esto puede tener problemas graves de corazón, vista y cerebro. Busca alimento especial para gatitos certificado y llévalo al veterinario.`
            : `ALERT: This food doesn't work for ${ageMonths}-month-old kitten. Cats are strict carnivores and need nutrients that only come from meat (taurine, arginine, vitamin A). Without this they may have serious heart, vision and brain problems. Look for certified kitten food and take to vet.`
        );
      }
    } else if (age >= 1 && age <= 7) {
      if (combined.includes('adult') || combined.includes('adulto')) {
        sections.push(
          language === 'es'
            ? `Para gato adulto de ${age} años: Este alimento es bueno para gatos. Tiene proteína de carne, grasa moderada, poca azúcar y taurina. Los gatos necesitan mucha proteína. Dale 2 comidas principales más acceso a alimento seco, ya que les gusta comer poquito muchas veces.`
            : `For ${age}-year-old adult cat: This food is good for cats. Has meat protein, moderate fat, little sugar and taurine. Cats need lots of protein. Give 2 main meals plus access to dry food, as they like to eat small amounts many times.`
        );
      } else if (combined.includes('steril') || combined.includes('esterilizado')) {
        sections.push(
          language === 'es'
            ? `Para gato de ${age} años castrado: Si está castrado, este alimento es bueno porque tiene menos calorías, L-carnitina para quemar grasa y fibra para sentirse lleno. Si NO está castrado y es activo, mejor usa alimento normal para adultos.`
            : `For ${age}-year-old neutered cat: If neutered, this food is good because it has fewer calories, L-carnitine to burn fat and fiber to feel full. If NOT neutered and active, better use normal adult food.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `Para gato de ${age} años: Necesita proteína de carne, NUNCA de plantas porque los gatos no pueden usarla. Necesita suficiente taurina para el corazón, vitamina A ya hecha y grasa de animales. Dale mucha agua para cuidar los riñones.`
            : `For ${age}-year-old cat: Needs meat protein, NEVER from plants because cats can't use it. Needs enough taurine for heart, pre-formed vitamin A and animal fat. Give lots of water to care for kidneys.`
        );
      }
    } else {
      if (combined.includes('senior') || combined.includes('7+') || combined.includes('8+')) {
        sections.push(
          language === 'es'
            ? `Para gato senior de ${age} años: Este alimento es bueno para gatos mayores. Tiene proteína alta fácil de digerir para que no pierda músculo, muy poco fósforo para cuidar los riñones y antioxidantes. Los gatos mayores necesitan mantener la proteína alta (diferente a los perros), buena cantidad de taurina y omega-3 para la artritis. Llévalo al veterinario cada 4-6 meses.`
            : `For ${age}-year-old senior cat: This food is good for senior cats. Has high easy-to-digest protein to avoid losing muscle, very low phosphorus to care for kidneys and antioxidants. Senior cats need to maintain high protein (different from dogs), good amount of taurine and omega-3 for arthritis. Take to vet every 4-6 months.`
        );
      } else {
        sections.push(
          language === 'es'
            ? `IMPORTANTE: Tu gato de ${age} años necesita alimento senior urgente. A esta edad muchos gatos tienen problemas de riñones sin síntomas, riesgo de tiroides, pérdida de músculo y artritis. Busca alimento senior con muy poco fósforo, proteína alta fácil de digerir y mucha taurina. ANTES de cambiar, llévalo al veterinario para un chequeo completo.`
            : `IMPORTANT: Your ${age}-year-old cat needs senior food urgently. At this age many cats have kidney problems without symptoms, thyroid risk, muscle loss and arthritis. Look for senior food with very low phosphorus, high easy-to-digest protein and lots of taurine. BEFORE changing, take to vet for complete checkup.`
        );
      }
    }
  }

  return sections.join('\n\n');
}

function analyzeIndividualIngredients(
  ingredientsText: string,
  language: string
): IngredientAnalysis[] {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return [];
  }

  const ingredients = ingredientsText
    .split(',')
    .map(ing => ing.trim())
    .filter(ing => ing.length > 0)
    .slice(0, 10);

  const analyses: IngredientAnalysis[] = [];

  for (const ingredient of ingredients) {
    const lower = ingredient.toLowerCase();
    let rating: 'good' | 'medium' | 'bad' = 'medium';
    let explanation = '';

    if (
      lower.includes('chicken') || lower.includes('pollo') ||
      lower.includes('turkey') || lower.includes('pavo') ||
      lower.includes('salmon') || lower.includes('salmón') ||
      lower.includes('beef') || lower.includes('ternera') ||
      lower.includes('lamb') || lower.includes('cordero') ||
      lower.includes('duck') || lower.includes('pato') ||
      lower.includes('venison') || lower.includes('venado') ||
      lower.includes('rabbit') || lower.includes('conejo')
    ) {
      if (lower.includes('fresh') || lower.includes('fresco') ||
          lower.includes('deboned') || lower.includes('deshuesado') ||
          !lower.includes('meal') && !lower.includes('harina')) {
        rating = 'good';
        explanation = language === 'es'
          ? 'Proteína de carne fresca de buena calidad.'
          : 'Good quality fresh meat protein.';
      } else if (lower.includes('meal') || lower.includes('harina')) {
        rating = 'good';
        explanation = language === 'es'
          ? 'Fuente concentrada de proteína animal.'
          : 'Concentrated animal protein source.';
      }
    } else if (
      lower.includes('liver') || lower.includes('hígado') ||
      lower.includes('heart') || lower.includes('corazón') ||
      lower.includes('kidney') || lower.includes('riñón')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Órgano rico en nutrientes y vitaminas.'
        : 'Organ rich in nutrients and vitamins.';
    } else if (
      lower.includes('fish') || lower.includes('pescado') ||
      lower.includes('tuna') || lower.includes('atún') ||
      lower.includes('cod') || lower.includes('bacalao')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Buena fuente de proteína y omega-3.'
        : 'Good source of protein and omega-3.';
    } else if (
      lower.includes('egg') || lower.includes('huevo')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Proteína completa y fácil de digerir.'
        : 'Complete and easy-to-digest protein.';
    } else if (
      lower.includes('by-product') || lower.includes('subproducto') ||
      lower.includes('poultry by-product') || lower.includes('subproductos de ave')
    ) {
      rating = 'bad';
      explanation = language === 'es'
        ? 'Ingrediente de baja calidad, partes no especificadas.'
        : 'Low quality ingredient, unspecified parts.';
    } else if (
      lower.includes('meat and bone meal') || lower.includes('harina de carne y hueso') ||
      lower.includes('animal digest') || lower.includes('digest animal')
    ) {
      rating = 'bad';
      explanation = language === 'es'
        ? 'Ingrediente muy procesado de origen poco claro.'
        : 'Highly processed ingredient of unclear origin.';
    } else if (
      lower.includes('corn') || lower.includes('maíz') ||
      lower.includes('wheat') || lower.includes('trigo') ||
      lower.includes('soy') || lower.includes('soja')
    ) {
      rating = 'medium';
      explanation = language === 'es'
        ? 'Puede aportar energía, pero no es ideal como base.'
        : 'Can provide energy, but not ideal as base.';
    } else if (
      lower.includes('rice') || lower.includes('arroz') ||
      lower.includes('oat') || lower.includes('avena') ||
      lower.includes('barley') || lower.includes('cebada')
    ) {
      rating = 'medium';
      explanation = language === 'es'
        ? 'Fuente de carbohidratos aceptable.'
        : 'Acceptable carbohydrate source.';
    } else if (
      lower.includes('sweet potato') || lower.includes('batata') ||
      lower.includes('potato') || lower.includes('patata') ||
      lower.includes('pea') || lower.includes('guisante') ||
      lower.includes('lentil') || lower.includes('lenteja') ||
      lower.includes('chickpea') || lower.includes('garbanzo')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Buena fuente de fibra y carbohidratos.'
        : 'Good source of fiber and carbohydrates.';
    } else if (
      lower.includes('carrot') || lower.includes('zanahoria') ||
      lower.includes('pumpkin') || lower.includes('calabaza') ||
      lower.includes('spinach') || lower.includes('espinaca') ||
      lower.includes('broccoli') || lower.includes('brócoli')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Aporta vitaminas y fibra.'
        : 'Provides vitamins and fiber.';
    } else if (
      lower.includes('beet pulp') || lower.includes('pulpa de remolacha')
    ) {
      rating = 'medium';
      explanation = language === 'es'
        ? 'Fuente de fibra moderada.'
        : 'Moderate fiber source.';
    } else if (
      lower.includes('chicken fat') || lower.includes('grasa de pollo') ||
      lower.includes('fish oil') || lower.includes('aceite de pescado') ||
      lower.includes('flaxseed') || lower.includes('linaza') ||
      lower.includes('salmon oil') || lower.includes('aceite de salmón')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Grasa saludable con omega-3 y omega-6.'
        : 'Healthy fat with omega-3 and omega-6.';
    } else if (
      lower.includes('taurine') || lower.includes('taurina')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Aminoácido esencial para gatos.'
        : 'Essential amino acid for cats.';
    } else if (
      lower.includes('vitamin') || lower.includes('vitamina') ||
      lower.includes('mineral') || lower.includes('zinc') ||
      lower.includes('calcium') || lower.includes('calcio')
    ) {
      rating = 'good';
      explanation = language === 'es'
        ? 'Suplemento vitamínico o mineral necesario.'
        : 'Necessary vitamin or mineral supplement.';
    } else if (
      lower.includes('bha') || lower.includes('bht') ||
      lower.includes('ethoxyquin') || lower.includes('propylene glycol')
    ) {
      rating = 'bad';
      explanation = language === 'es'
        ? 'Conservante artificial poco recomendable.'
        : 'Artificial preservative not recommended.';
    } else if (
      lower.includes('artificial color') || lower.includes('colorante') ||
      lower.includes('red 40') || lower.includes('yellow 5') ||
      lower.includes('blue 2')
    ) {
      rating = 'bad';
      explanation = language === 'es'
        ? 'Colorante sin valor nutricional.'
        : 'Colorant with no nutritional value.';
    } else if (
      lower.includes('sugar') || lower.includes('azúcar') ||
      lower.includes('corn syrup') || lower.includes('jarabe')
    ) {
      rating = 'bad';
      explanation = language === 'es'
        ? 'Azúcar añadido innecesario.'
        : 'Unnecessary added sugar.';
    } else if (
      lower.includes('cellulose') || lower.includes('celulosa')
    ) {
      rating = 'medium';
      explanation = language === 'es'
        ? 'Relleno de fibra vegetal.'
        : 'Plant fiber filler.';
    } else {
      rating = 'medium';
      explanation = language === 'es'
        ? 'Ingrediente común, ni excelente ni problemático.'
        : 'Common ingredient, neither excellent nor problematic.';
    }

    analyses.push({
      name: ingredient,
      rating,
      explanation,
    });
  }

  return analyses;
}

export function generatePersonalizedReport(
  petProfile: PetProfile | null,
  productData: ProductData,
  score: number,
  language: string
): PersonalizedReport {
  if (!petProfile) {
    return {
      isValid: false,
      errorMessage: language === 'es'
        ? 'No se encontró información de tu mascota. Ve a Perfil y completa los datos de tu mascota para obtener informes personalizados.'
        : 'Pet information not found. Go to Profile and complete your pet data to get personalized reports.',
      ingredientQuality: '',
      suitability: '',
      ageRecommendation: '',
      advice: [],
      detailedWarnings: [],
      ingredientBreakdown: [],
    };
  }

  const productAnimalType = detectProductAnimalType(productData);
  const userPetType = normalizePetType(petProfile.pet_type);
  const normalizedPetType = userPetType;

  if (productAnimalType !== 'unknown' && userPetType !== productAnimalType) {
    return {
      isValid: false,
      errorMessage: language === 'es'
        ? 'Este producto no corresponde a tu mascota. Para cambiar el tipo de animal, ve a Perfil, ajusta los datos de tu mascota y vuelve a escanear el producto.'
        : 'This product does not match your pet. To change the animal type, go to Profile, adjust your pet data and scan the product again.',
      ingredientQuality: '',
      suitability: '',
      ageRecommendation: '',
      advice: [],
      detailedWarnings: [],
      ingredientBreakdown: [],
    };
  }

  const ingredientsLower = (productData.ingredients_text || '').toLowerCase();
  const productName = productData.product_name.toLowerCase();
  const categories = (productData.categories || '').toLowerCase();

  let ingredientQuality = '';
  const advice: string[] = [];
  const detailedWarnings: string[] = [];
  const ingredientBreakdown = analyzeIndividualIngredients(productData.ingredients_text || '', language);

  if (score >= 85) {
    ingredientQuality = language === 'es'
      ? `Calificación: EXCELENTE (${score}/100)\n\nLos ingredientes son de muy buena calidad. Los primeros tres son carnes bien identificadas (como pollo fresco, vísceras específicas o harinas de carne). Esto significa que tu mascota va a aprovechar bien los nutrientes.`
      : `Rating: EXCELLENT (${score}/100)\n\nVery good quality ingredients. First three are well-identified meats (like fresh chicken, specific organs or meat meals). This means your pet will absorb nutrients well.`;
  } else if (score >= 70) {
    ingredientQuality = language === 'es'
      ? `Calificación: BUENO (${score}/100)\n\nLa calidad es aceptable. Tiene proteínas identificables al inicio, aunque incluye algunos ingredientes procesados. Cumple con lo necesario para tu ${petProfile.pet_type} de ${petProfile.age_years} años.`
      : `Rating: GOOD (${score}/100)\n\nAcceptable quality. Has identifiable proteins at the start, though includes some processed ingredients. Meets what's needed for your ${petProfile.age_years}-year-old ${petProfile.pet_type}.`;
  } else if (score >= 55) {
    ingredientQuality = language === 'es'
      ? `Calificación: REGULAR (${score}/100)\n\nLa calidad es media. Incluye subproductos genéricos o cereales en las primeras posiciones. Cumple lo mínimo legal, pero podrías buscar algo mejor cuando puedas.`
      : `Rating: FAIR (${score}/100)\n\nMedium quality. Includes generic by-products or grains in first positions. Meets legal minimum, but you could look for something better when you can.`;
  } else {
    ingredientQuality = language === 'es'
      ? `Calificación: DEFICIENTE (${score}/100)\n\nLa calidad es baja. Los primeros ingredientes son subproductos poco claros, cereales de relleno o proteínas de bajo valor. A largo plazo esto puede afectar la salud de tu mascota. Te recomendamos cambiar a algo mejor.`
      : `Rating: POOR (${score}/100)\n\nLow quality. First ingredients are unclear by-products, filler grains or low-value proteins. Long-term this can affect your pet's health. We recommend changing to something better.`;
  }

  let suitability = '';

  const ageRecommendation = generateAgeBasedAnalysis(petProfile, productData, score, language);

  if (score >= 85) {
    advice.push(
      language === 'es'
        ? `Si tu ${petProfile.pet_type} digiere bien, tiene buen peso, pelo brillante y buena energía, sigue con este alimento.`
        : `If your ${petProfile.pet_type} digests well, has good weight, shiny coat and good energy, continue with this food.`
    );
  } else if (score >= 70) {
    advice.push(
      language === 'es'
        ? `Cuando puedas, busca opciones con más carne en las primeras posiciones.`
        : `When you can, look for options with more meat in first positions.`
    );
  } else {
    advice.push(
      language === 'es'
        ? `Te recomendamos cambiar a un alimento mejor. Si decides hacerlo, hazlo poco a poco mezclando el nuevo con el actual durante 2-4 semanas.`
        : `We recommend changing to better food. If you decide to do it, do it gradually by mixing the new with the current over 2-4 weeks.`
    );
  }

  advice.push(
    language === 'es'
      ? `Asegúrate de que siempre tenga agua fresca disponible. Necesita mínimo ${normalizedPetType === 'cat' ? '50-70ml por kilo al día' : '60-80ml por kilo al día'}.`
      : `Make sure they always have fresh water available. Needs minimum ${normalizedPetType === 'cat' ? '50-70ml per kg daily' : '60-80ml per kg daily'}.`
  );

  advice.push(
    language === 'es'
      ? `Lleva a tu ${petProfile.pet_type} al veterinario si notas cambios en apetito, vómito, diarrea, peso, sed excesiva o comportamiento. Te recomendamos un chequeo anual.`
      : `Take your ${petProfile.pet_type} to the vet if you notice changes in appetite, vomiting, diarrhea, weight, excessive thirst or behavior. We recommend an annual checkup.`
  );

  if (ingredientsLower.includes('artificial') || ingredientsLower.includes('bha') || ingredientsLower.includes('bht')) {
    detailedWarnings.push(
      language === 'es'
        ? `⚠️ CONSERVANTES ARTIFICIALES\n\nEste producto tiene conservantes químicos (BHA, BHT o etoxiquina) que pueden afectar el hígado y las hormonas. Es mejor buscar alimentos con conservantes naturales como vitamina E, vitamina C o extracto de romero.`
        : `⚠️ ARTIFICIAL PRESERVATIVES\n\nThis product has chemical preservatives (BHA, BHT or ethoxyquin) that can affect the liver and hormones. It's better to look for foods with natural preservatives like vitamin E, vitamin C or rosemary extract.`
    );
  }

  if (ingredientsLower.includes('color') || ingredientsLower.includes('dye')) {
    detailedWarnings.push(
      language === 'es'
        ? `⚠️ COLORANTES ARTIFICIALES\n\nLos colorantes se añaden solo para que se vea bonito, pero no ayudan a tu ${petProfile.pet_type}. Pueden causar alergias y problemas de piel o digestivos. Mejor busca alimentos sin colorantes, el color natural (café o beige) indica ingredientes reales.`
        : `⚠️ ARTIFICIAL COLORINGS\n\nColorants are added only to look pretty, but don't help your ${petProfile.pet_type}. They can cause allergies and skin or digestive problems. Better look for foods without colorants, natural color (brown or beige) indicates real ingredients.`
    );
  }

  if (ingredientsLower.includes('sugar') || ingredientsLower.includes('corn syrup')) {
    detailedWarnings.push(
      language === 'es'
        ? `⚠️ AZÚCARES AÑADIDOS\n\nEste producto tiene azúcares añadidos (azúcar, jarabe de maíz, fructosa o dextrosa). Los carnívoros no necesitan estos azúcares y pueden causar sobrepeso, problemas dentales y diabetes. ${normalizedPetType === 'cat' ? 'Los gatos no procesan bien los azúcares y esto aumenta mucho el riesgo de diabetes.' : 'En perros mayores, se tolera menos el azúcar.'} Te recomendamos evitar alimentos con azúcares añadidos.`
        : `⚠️ ADDED SUGARS\n\nThis product has added sugars (sugar, corn syrup, fructose or dextrose). Carnivores don't need these sugars and they can cause overweight, dental problems and diabetes. ${normalizedPetType === 'cat' ? 'Cats don\'t process sugars well and this greatly increases diabetes risk.' : 'In senior dogs, sugar tolerance is lower.'} We recommend avoiding foods with added sugars.`
    );
  }

  if (ingredientsLower.includes('by-product') || ingredientsLower.includes('meal')) {
    detailedWarnings.push(
      language === 'es'
        ? `⚠️ SUBPRODUCTOS GENÉRICOS\n\nEste producto tiene subproductos genéricos (como "subproductos de carne" o "harinas de carne"). Cuando no dice exactamente qué parte del animal es, puede incluir desde vísceras buenas hasta partes de muy bajo valor. Es mejor buscar alimentos con proteínas específicas como "pollo sin hueso", "harina de salmón" o "hígado de cordero".`
        : `⚠️ GENERIC BY-PRODUCTS\n\nThis product has generic by-products (like "meat by-products" or "meat meals"). When it doesn't say exactly what animal part it is, it can include from good organs to very low value parts. It's better to look for foods with specific proteins like "deboned chicken", "salmon meal" or "lamb liver".`
    );
  }

  if (ingredientsLower.includes('corn') || ingredientsLower.includes('wheat') || ingredientsLower.includes('soy')) {
    const grainCount = (ingredientsLower.match(/corn|wheat|soy|rice/g) || []).length;
    if (grainCount >= 3) {
      detailedWarnings.push(
        language === 'es'
          ? `⚠️ MUCHOS CEREALES\n\nEste producto tiene varios cereales en posiciones principales (maíz, trigo, soja, arroz). Cuando hay muchos cereales significa mucha proteína vegetal, y las proteínas de plantas no tienen todos los nutrientes que los carnívoros necesitan. ${normalizedPetType === 'cat' ? 'Los gatos son carnívoros obligados y las dietas con muchos cereales pueden causar falta de taurina (que es importante para el corazón).' : 'Las dietas con exceso de cereales dan menos proteína de calidad para mantener el músculo.'} Busca alimentos con carnes específicas en las primeras 3 posiciones.`
          : `⚠️ MANY GRAINS\n\nThis product has several grains in main positions (corn, wheat, soy, rice). When there are many grains it means lots of plant protein, and plant proteins don't have all the nutrients that carnivores need. ${normalizedPetType === 'cat' ? 'Cats are obligate carnivores and diets with many grains can cause taurine deficiency (which is important for the heart).' : 'Diets with excess grains provide less quality protein to maintain muscle.'} Look for foods with specific meats in the first 3 positions.`
      );
    }
  }

  return {
    isValid: true,
    ingredientQuality,
    suitability,
    ageRecommendation,
    advice,
    detailedWarnings,
    ingredientBreakdown,
  };
}

export type { IngredientAnalysis };
