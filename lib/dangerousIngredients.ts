export const DANGEROUS_INGREDIENTS = {
  dogs: [
    'chocolate',
    'xylitol',
    'grapes',
    'raisins',
    'onions',
    'garlic',
    'macadamia nuts',
    'avocado',
    'alcohol',
    'caffeine',
    'raw yeast dough',
    'salt',
    'artificial sweeteners',
    'propylene glycol',
    'ethoxyquin',
    'BHA',
    'BHT',
    'corn syrup',
    'food dyes',
    'by-products',
  ],
  cats: [
    'onions',
    'garlic',
    'chocolate',
    'xylitol',
    'grapes',
    'raisins',
    'alcohol',
    'caffeine',
    'raw fish',
    'raw eggs',
    'milk',
    'dairy products',
    'artificial sweeteners',
    'propylene glycol',
    'ethoxyquin',
    'BHA',
    'BHT',
    'corn syrup',
    'food dyes',
    'by-products',
  ],
  fish: [
    'bread',
    'crackers',
    'pasta',
    'chocolate',
    'garlic',
    'onions',
  ],
  birds: [
    'avocado',
    'chocolate',
    'salt',
    'caffeine',
    'alcohol',
    'onions',
    'garlic',
    'fruit pits',
    'apple seeds',
    'xylitol',
  ],
  rabbits: [
    'chocolate',
    'avocado',
    'fruit pits',
    'tomato leaves',
    'iceberg lettuce',
    'rhubarb',
    'onions',
    'garlic',
    'potatoes',
    'beans',
  ],
  reptiles: [
    'avocado',
    'rhubarb',
    'onions',
    'garlic',
    'chocolate',
  ],
};

export interface DangerousIngredientCheck {
  found: boolean;
  ingredients: string[];
  petTypes: string[];
}

export const checkDangerousIngredients = (
  ingredients: string[],
  petType?: string
): DangerousIngredientCheck => {
  const dangerous: string[] = [];
  const affectedPetTypes: string[] = [];

  const ingredientsList = ingredients.map(i => i.toLowerCase());

  const petTypesToCheck = petType
    ? [petType.toLowerCase()]
    : Object.keys(DANGEROUS_INGREDIENTS);

  petTypesToCheck.forEach(type => {
    const dangerousForPet = DANGEROUS_INGREDIENTS[type as keyof typeof DANGEROUS_INGREDIENTS] || [];

    dangerousForPet.forEach(dangerousItem => {
      ingredientsList.forEach(ingredient => {
        if (ingredient.includes(dangerousItem.toLowerCase()) && !dangerous.includes(dangerousItem)) {
          dangerous.push(dangerousItem);
          if (!affectedPetTypes.includes(type)) {
            affectedPetTypes.push(type);
          }
        }
      });
    });
  });

  return {
    found: dangerous.length > 0,
    ingredients: dangerous,
    petTypes: affectedPetTypes,
  };
};

export const getDangerousIngredientsForPet = (petType: string): string[] => {
  const type = petType.toLowerCase();
  return DANGEROUS_INGREDIENTS[type as keyof typeof DANGEROUS_INGREDIENTS] || [];
};
