import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Sparkles } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import { supabase } from '@/lib/supabaseClient';

interface Recipe {
  title: string;
  ingredients: string;
  preparation: string;
  tip: string;
}

export default function RecipeIdeas() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile, loading: profileLoading } = usePetProfile();
  const [petType, setPetType] = useState('');
  const [petAge, setPetAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasFavorites, setHasFavorites] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    loadUser();
    checkFavorites();
  }, []);

  useEffect(() => {
    if (profileLoading) {
      console.log('[RecipeIdeas] Loading pet profile...');
      return;
    }

    if (profileChecked) return;

    console.log('[RecipeIdeas] Pet profile loaded:', petProfile);

    if (petProfile) {
      if (petProfile.pet_type) {
        console.log('[RecipeIdeas] Prefilling pet type:', petProfile.pet_type);
        setPetType(petProfile.pet_type);
      }
      if (petProfile.age_years) {
        console.log('[RecipeIdeas] Prefilling age:', petProfile.age_years);
        setPetAge(petProfile.age_years.toString());
      }
      if (petProfile.additional_info) {
        console.log('[RecipeIdeas] Prefilling additional info:', petProfile.additional_info);
        setAdditionalInfo(petProfile.additional_info);
      }
    }

    setProfileChecked(true);
  }, [profileLoading, petProfile, profileChecked]);

  useEffect(() => {
    if (recipe && userId) {
      checkIfRecipeIsFavorited();
    }
  }, [recipe, userId]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
    }
  };

  const checkFavorites = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: favorites } = await supabase
      .from('recipe_favorites')
      .select('id')
      .eq('user_id', data.user.id)
      .limit(1);

    setHasFavorites(!!(favorites && favorites.length > 0));
  };

  const checkIfRecipeIsFavorited = async () => {
    if (!recipe || !userId) return;

    const { data } = await supabase
      .from('recipe_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('title', recipe.title)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const generateRecipe = async () => {
    if (!petType.trim() || !petAge.trim()) {
      Alert.alert(
        language === 'es' ? 'Campos requeridos' : 'Required fields',
        language === 'es'
          ? 'Por favor completa el tipo de mascota y la edad.'
          : 'Please complete pet type and age.'
      );
      return;
    }

    setIsGenerating(true);
    setIsFavorite(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const generatedRecipe = generateContextualRecipe(petType, petAge, additionalInfo, language);

      setRecipe(generatedRecipe);
      setShowForm(false);
    } catch (error) {
      console.error('Error generating recipe:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo generar la receta. Inténtalo de nuevo.'
          : 'Could not generate recipe. Try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContextualRecipe = (pet: string, age: string, notes: string, lang: string): Recipe => {
    const isSpanish = lang === 'es';
    const petLower = pet.toLowerCase();
    const ageLower = age.toLowerCase();
    const isDog = petLower.includes('perr') || petLower.includes('dog');
    const isCat = petLower.includes('gat') || petLower.includes('cat');
    const isPuppy = ageLower.includes('cachorro') || ageLower.includes('puppy') || ageLower.includes('joven') || ageLower.includes('young');
    const isSenior = ageLower.includes('senior') || ageLower.includes('mayor') || ageLower.includes('anciano') || ageLower.includes('old');

    const recipeVariations = [
      Math.floor(Math.random() * 1000),
      Date.now() % 1000
    ];
    const variation = recipeVariations[0];

    if (isDog) {
      if (isPuppy) {
        return isSpanish ? {
          title: `Receta nutritiva para cachorro`,
          ingredients: `• 250g de carne magra de ternera o pollo\n• 80g de arroz blanco cocido\n• 40g de calabaza cocida\n• 30g de espinacas cocidas\n• 1 cucharadita de aceite de pescado\n• Suplemento vitamínico para cachorros (según indicación veterinaria)`,
          preparation: `1. Cocina la carne sin sal, bien cocida y picada muy fina\n2. Cocina el arroz hasta que esté muy blando\n3. Cocina la calabaza y espinacas al vapor\n4. Mezcla todos los ingredientes asegurándote de que no haya trozos grandes\n5. Agrega el aceite de pescado\n6. Sirve tibio, dividido en 3-4 comidas pequeñas al día`,
          tip: `Los cachorros necesitan más proteína y calorías que los adultos. Consulta con tu veterinario sobre suplementos de calcio y vitaminas específicos para su crecimiento.`
        } : {
          title: `Nutritious recipe for puppy`,
          ingredients: `• 250g lean beef or chicken\n• 80g cooked white rice\n• 40g cooked pumpkin\n• 30g cooked spinach\n• 1 tsp fish oil\n• Puppy vitamin supplement (as directed by vet)`,
          preparation: `1. Cook meat without salt, well done and finely chopped\n2. Cook rice until very soft\n3. Steam pumpkin and spinach\n4. Mix all ingredients ensuring no large pieces\n5. Add fish oil\n6. Serve warm, divided into 3-4 small meals per day`,
          tip: `Puppies need more protein and calories than adults. Consult your vet about calcium and vitamin supplements specific for their growth.`
        };
      } else if (isSenior) {
        return isSpanish ? {
          title: `Receta suave para perro senior`,
          ingredients: `• 180g de pavo o pollo hervido\n• 100g de batata cocida\n• 40g de judías verdes cocidas\n• 30g de manzana sin semillas\n• 1 cucharada de aceite de coco\n• Suplemento de glucosamina (opcional)`,
          preparation: `1. Hierve el pavo hasta que esté muy tierno\n2. Cocina la batata hasta que esté blanda\n3. Cocina las judías verdes al vapor\n4. Corta la manzana en trozos muy pequeños\n5. Desmenuza bien la carne para facilitar la masticación\n6. Mezcla todo suavemente y agrega el aceite de coco`,
          tip: `Los perros mayores pueden tener problemas dentales o digestivos. Esta receta es fácil de masticar y digerir. Considera dividir en comidas más pequeñas si tiene problemas estomacales.`
        } : {
          title: `Soft recipe for senior dog`,
          ingredients: `• 180g boiled turkey or chicken\n• 100g cooked sweet potato\n• 40g cooked green beans\n• 30g apple without seeds\n• 1 tbsp coconut oil\n• Glucosamine supplement (optional)`,
          preparation: `1. Boil turkey until very tender\n2. Cook sweet potato until soft\n3. Steam green beans\n4. Cut apple into very small pieces\n5. Shred meat well for easy chewing\n6. Mix everything gently and add coconut oil`,
          tip: `Senior dogs may have dental or digestive issues. This recipe is easy to chew and digest. Consider dividing into smaller meals if stomach problems occur.`
        };
      } else {
        const recipeOptions = [
          isSpanish ? {
            title: `Receta equilibrada para perro adulto`,
            ingredients: `• 220g de carne de res magra\n• 120g de arroz integral\n• 60g de brócoli cocido\n• 40g de zanahoria rallada\n• 1 cucharada de aceite de oliva\n• Pizca de cúrcuma (antiinflamatorio natural)`,
            preparation: `1. Cocina la carne sin condimentos\n2. Hierve el arroz integral hasta que esté tierno\n3. Cocina el brócoli al vapor\n4. Ralla la zanahoria finamente\n5. Desmenuza la carne en trozos medianos\n6. Mezcla todos los ingredientes\n7. Añade aceite de oliva y cúrcuma`,
            tip: `Esta receta aporta proteínas de calidad y fibra. Puedes alternar la carne de res con cordero o pescado para mayor variedad nutricional.`
          } : {
            title: `Balanced recipe for adult dog`,
            ingredients: `• 220g lean beef\n• 120g brown rice\n• 60g cooked broccoli\n• 40g grated carrot\n• 1 tbsp olive oil\n• Pinch of turmeric (natural anti-inflammatory)`,
            preparation: `1. Cook meat without seasonings\n2. Boil brown rice until tender\n3. Steam broccoli\n4. Finely grate carrot\n5. Shred meat into medium pieces\n6. Mix all ingredients\n7. Add olive oil and turmeric`,
            tip: `This recipe provides quality protein and fiber. You can alternate beef with lamb or fish for more nutritional variety.`
          },
          isSpanish ? {
            title: `Receta proteica para perro activo`,
            ingredients: `• 240g de pechuga de pollo\n• 100g de quinoa cocida\n• 50g de calabacín cocido\n• 30g de arándanos frescos\n• 1 cucharada de aceite de salmón\n• 1 huevo cocido`,
            preparation: `1. Cocina el pollo a la plancha o hervido\n2. Prepara la quinoa siguiendo las instrucciones del paquete\n3. Cocina el calabacín al vapor\n4. Corta el huevo cocido en trozos\n5. Desmenuza el pollo\n6. Mezcla todos los ingredientes\n7. Agrega los arándanos y el aceite de salmón`,
            tip: `Ideal para perros con alta actividad física. El aceite de salmón aporta omega-3 para articulaciones saludables y pelaje brillante.`
          } : {
            title: `Protein recipe for active dog`,
            ingredients: `• 240g chicken breast\n• 100g cooked quinoa\n• 50g cooked zucchini\n• 30g fresh blueberries\n• 1 tbsp salmon oil\n• 1 boiled egg`,
            preparation: `1. Grill or boil chicken\n2. Prepare quinoa following package instructions\n3. Steam zucchini\n4. Cut boiled egg into pieces\n5. Shred chicken\n6. Mix all ingredients\n7. Add blueberries and salmon oil`,
            tip: `Ideal for dogs with high physical activity. Salmon oil provides omega-3 for healthy joints and shiny coat.`
          }
        ];
        return recipeOptions[variation % 2];
      }
    } else if (isCat) {
      if (isPuppy) {
        return isSpanish ? {
          title: `Receta para gatito en crecimiento`,
          ingredients: `• 150g de pollo o pavo cocido\n• 30g de hígado de pollo cocido\n• 2 cucharadas de calabaza cocida\n• 1 yema de huevo cocida\n• 1 cucharadita de aceite de pescado\n• Taurina en polvo (suplemento esencial)`,
          preparation: `1. Cocina el pollo y el hígado sin sal\n2. Cocina la calabaza hasta que esté muy blanda\n3. Hierve el huevo y separa la yema\n4. Tritura todo muy finamente (los gatitos necesitan textura suave)\n5. Mezcla bien todos los ingredientes\n6. Agrega la taurina y el aceite de pescado\n7. Sirve en pequeñas porciones cada 4-6 horas`,
          tip: `Los gatitos necesitan taurina, un aminoácido esencial que no pueden producir. El hígado aporta vitamina A necesaria para su desarrollo. Consulta con tu veterinario sobre las cantidades apropiadas.`
        } : {
          title: `Recipe for growing kitten`,
          ingredients: `• 150g cooked chicken or turkey\n• 30g cooked chicken liver\n• 2 tbsp cooked pumpkin\n• 1 cooked egg yolk\n• 1 tsp fish oil\n• Taurine powder (essential supplement)`,
          preparation: `1. Cook chicken and liver without salt\n2. Cook pumpkin until very soft\n3. Boil egg and separate yolk\n4. Grind everything very finely (kittens need soft texture)\n5. Mix all ingredients well\n6. Add taurine and fish oil\n7. Serve in small portions every 4-6 hours`,
          tip: `Kittens need taurine, an essential amino acid they cannot produce. Liver provides vitamin A needed for development. Consult your vet about appropriate amounts.`
        };
      } else if (isSenior) {
        return isSpanish ? {
          title: `Receta digestiva para gato senior`,
          ingredients: `• 140g de pescado blanco cocido (merluza o bacalao)\n• 20g de calabaza cocida\n• 10g de zanahoria muy cocida\n• 1 cucharadita de aceite de oliva\n• Suplemento de taurina\n• Probióticos para gatos (opcional)`,
          preparation: `1. Cocina el pescado al vapor, sin espinas\n2. Cocina la calabaza y zanahoria hasta que estén muy blandas\n3. Desmenuza el pescado en trozos muy pequeños\n4. Tritura las verduras hasta obtener un puré\n5. Mezcla suavemente\n6. Agrega aceite de oliva y taurina`,
          tip: `Los gatos mayores pueden tener problemas renales. El pescado blanco es bajo en fósforo. Asegúrate de que beba suficiente agua. Considera añadir caldo sin sal para aumentar la hidratación.`
        } : {
          title: `Digestive recipe for senior cat`,
          ingredients: `• 140g cooked white fish (hake or cod)\n• 20g cooked pumpkin\n• 10g very well cooked carrot\n• 1 tsp olive oil\n• Taurine supplement\n• Cat probiotics (optional)`,
          preparation: `1. Steam fish, boneless\n2. Cook pumpkin and carrot until very soft\n3. Shred fish into very small pieces\n4. Mash vegetables into puree\n5. Mix gently\n6. Add olive oil and taurine`,
          tip: `Senior cats may have kidney issues. White fish is low in phosphorus. Ensure they drink enough water. Consider adding unsalted broth to increase hydration.`
        };
      } else {
        const recipeOptions = [
          isSpanish ? {
            title: `Receta carnívora para gato adulto`,
            ingredients: `• 160g de pechuga de pollo cruda o ligeramente cocida\n• 30g de hígado de pollo\n• 15g de corazón de pollo (opcional)\n• 1 cucharada de calabaza\n• Suplemento de taurina en polvo\n• 1 cucharadita de aceite de pescado`,
            preparation: `1. Si cocinas la carne, hazlo ligeramente (los gatos prefieren proteína poco cocida)\n2. Cocina el hígado brevemente\n3. Pica todo en trozos pequeños o tritura según la preferencia de tu gato\n4. Cocina la calabaza hasta que esté blanda\n5. Mezcla todos los ingredientes\n6. Agrega taurina y aceite de pescado justo antes de servir`,
            tip: `Los gatos son carnívoros estrictos y necesitan principalmente proteína animal. La taurina es esencial para su salud cardíaca y ocular. No sustituyas estos ingredientes por vegetales.`
          } : {
            title: `Carnivore recipe for adult cat`,
            ingredients: `• 160g raw or lightly cooked chicken breast\n• 30g chicken liver\n• 15g chicken heart (optional)\n• 1 tbsp pumpkin\n• Taurine powder supplement\n• 1 tsp fish oil`,
            preparation: `1. If cooking meat, do it lightly (cats prefer less cooked protein)\n2. Cook liver briefly\n3. Chop everything into small pieces or grind based on your cat's preference\n4. Cook pumpkin until soft\n5. Mix all ingredients\n6. Add taurine and fish oil just before serving`,
            tip: `Cats are strict carnivores and need mainly animal protein. Taurine is essential for their heart and eye health. Don't substitute these ingredients with vegetables.`
          },
          isSpanish ? {
            title: `Receta de pescado para gato`,
            ingredients: `• 150g de salmón fresco o atún\n• 20g de hígado de pollo\n• 10g de espinacas cocidas\n• 1 yema de huevo cocida\n• Suplemento de taurina\n• ½ cucharadita de aceite de coco`,
            preparation: `1. Cocina el pescado ligeramente al vapor (elimina todas las espinas)\n2. Cocina el hígado brevemente\n3. Cocina las espinacas y escúrrelas bien\n4. Hierve el huevo y usa solo la yema\n5. Desmenuza el pescado y mezcla con los demás ingredientes\n6. Agrega taurina y aceite de coco`,
            tip: `El pescado aporta omega-3 beneficioso para el pelaje y articulaciones. No des pescado crudo con frecuencia ya que puede destruir la tiamina. Alterna con otras proteínas.`
          } : {
            title: `Fish recipe for cat`,
            ingredients: `• 150g fresh salmon or tuna\n• 20g chicken liver\n• 10g cooked spinach\n• 1 cooked egg yolk\n• Taurine supplement\n• ½ tsp coconut oil`,
            preparation: `1. Lightly steam fish (remove all bones)\n2. Cook liver briefly\n3. Cook spinach and drain well\n4. Boil egg and use only yolk\n5. Shred fish and mix with other ingredients\n6. Add taurine and coconut oil`,
            tip: `Fish provides omega-3 beneficial for coat and joints. Don't give raw fish frequently as it can destroy thiamine. Alternate with other proteins.`
          }
        ];
        return recipeOptions[variation % 2];
      }
    } else {
      const otherPetRecipes = [
        isSpanish ? {
          title: `Receta nutritiva para ${pet}`,
          ingredients: `• 200g de proteína animal magra (pollo, pavo o pescado)\n• 100g de carbohidrato complejo (arroz integral, quinoa o batata)\n• 50g de vegetales cocidos (zanahoria, brócoli o calabaza)\n• 1 cucharada de aceite saludable (oliva, coco o pescado)\n• Suplementos según especie (consultar veterinario)`,
          preparation: `1. Cocina la proteína sin sal ni condimentos\n2. Prepara el carbohidrato hasta que esté bien cocido\n3. Cocina los vegetales al vapor\n4. Desmenuza o tritura según el tamaño de tu mascota\n5. Mezcla todos los ingredientes\n6. Agrega el aceite\n7. Deja enfriar antes de servir`,
          tip: `Esta es una receta base. Consulta con tu veterinario sobre las proporciones específicas y suplementos necesarios para tu tipo de mascota, ya que cada especie tiene necesidades nutricionales diferentes.`
        } : {
          title: `Nutritious recipe for ${pet}`,
          ingredients: `• 200g lean animal protein (chicken, turkey or fish)\n• 100g complex carbohydrate (brown rice, quinoa or sweet potato)\n• 50g cooked vegetables (carrot, broccoli or pumpkin)\n• 1 tbsp healthy oil (olive, coconut or fish)\n• Species-specific supplements (consult vet)`,
          preparation: `1. Cook protein without salt or seasonings\n2. Prepare carbohydrate until well cooked\n3. Steam vegetables\n4. Shred or grind based on your pet's size\n5. Mix all ingredients\n6. Add oil\n7. Let cool before serving`,
          tip: `This is a base recipe. Consult your vet about specific proportions and necessary supplements for your pet type, as each species has different nutritional needs.`
        },
        isSpanish ? {
          title: `Receta balanceada para ${pet}`,
          ingredients: `• 180g de pavo cocido\n• 80g de batata cocida\n• 60g de guisantes frescos\n• 30g de manzana sin semillas\n• 1 cucharadita de aceite de linaza\n• Suplemento vitamínico apropiado`,
          preparation: `1. Cocina el pavo hasta que esté completamente cocido\n2. Cocina la batata hasta que esté suave\n3. Cocina ligeramente los guisantes\n4. Corta la manzana en trozos muy pequeños\n5. Mezcla todos los ingredientes uniformemente\n6. Añade el aceite de linaza\n7. Sirve a temperatura ambiente`,
          tip: `La batata es excelente fuente de fibra y vitaminas. Asegúrate de ajustar las porciones según el tamaño y necesidades energéticas de tu mascota.`
        } : {
          title: `Balanced recipe for ${pet}`,
          ingredients: `• 180g cooked turkey\n• 80g cooked sweet potato\n• 60g fresh peas\n• 30g apple without seeds\n• 1 tsp flaxseed oil\n• Appropriate vitamin supplement`,
          preparation: `1. Cook turkey until completely done\n2. Cook sweet potato until soft\n3. Lightly cook peas\n4. Cut apple into very small pieces\n5. Mix all ingredients evenly\n6. Add flaxseed oil\n7. Serve at room temperature`,
          tip: `Sweet potato is an excellent source of fiber and vitamins. Make sure to adjust portions based on your pet's size and energy needs.`
        },
        isSpanish ? {
          title: `Receta variada para ${pet}`,
          ingredients: `• 150g de salmón cocido sin espinas\n• 90g de quinoa cocida\n• 50g de calabacín rallado\n• 40g de arándanos frescos\n• 1 cucharada de aceite de coco\n• Calcio en polvo según necesidad`,
          preparation: `1. Cocina el salmón al vapor y elimina todas las espinas\n2. Prepara la quinoa según las instrucciones\n3. Ralla el calabacín finamente\n4. Añade los arándanos enteros o cortados\n5. Mezcla todos los ingredientes suavemente\n6. Incorpora el aceite de coco y suplementos`,
          tip: `El salmón aporta omega-3 beneficioso. Los arándanos son ricos en antioxidantes. Consulta con un veterinario especializado en nutrición para tu tipo de mascota.`
        } : {
          title: `Varied recipe for ${pet}`,
          ingredients: `• 150g boneless cooked salmon\n• 90g cooked quinoa\n• 50g grated zucchini\n• 40g fresh blueberries\n• 1 tbsp coconut oil\n• Calcium powder as needed`,
          preparation: `1. Steam salmon and remove all bones\n2. Prepare quinoa according to instructions\n3. Finely grate zucchini\n4. Add blueberries whole or cut\n5. Gently mix all ingredients\n6. Add coconut oil and supplements`,
          tip: `Salmon provides beneficial omega-3. Blueberries are rich in antioxidants. Consult with a veterinarian specialized in nutrition for your pet type.`
        }
      ];
      return otherPetRecipes[variation % 3];
    }
  };

  const toggleFavorite = async () => {
    if (!recipe) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Usuario no autenticado' : 'User not authenticated'
      );
      return;
    }

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('title', recipe.title);

      if (!error) {
        setIsFavorite(false);
        checkFavorites();
        Alert.alert(
          language === 'es' ? 'Eliminada' : 'Removed',
          language === 'es'
            ? 'Receta eliminada de favoritos'
            : 'Recipe removed from favorites'
        );
      }
    } else {
      // Add to favorites
      const { error } = await supabase.from('recipe_favorites').insert({
        user_id: user.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        preparation: recipe.preparation,
        tip: recipe.tip,
      });

      if (!error) {
        setIsFavorite(true);
        checkFavorites();
        Alert.alert(
          language === 'es' ? 'Guardada' : 'Saved',
          language === 'es'
            ? 'Receta guardada en favoritos'
            : 'Recipe saved to favorites'
        );
      }
    }
  };

  const viewFavorites = () => {
    router.push('/favorite-recipes');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Ideas de recetas caseras' : 'Homemade recipe ideas'}
        </Text>
        <TouchableOpacity onPress={viewFavorites} style={styles.favoritesButton}>
          <Heart
            size={24}
            color="#6b7280"
            strokeWidth={2}
            fill="transparent"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showForm ? (
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.formTitle}>
                {language === 'es'
                  ? 'Cuéntanos sobre tu mascota'
                  : 'Tell us about your pet'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {language === 'es' ? '¿Qué mascota tienes?' : 'What pet do you have?'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={petType}
                  onChangeText={setPetType}
                  placeholder={
                    language === 'es'
                      ? 'Ej: perro, gato, conejo...'
                      : 'E.g: dog, cat, rabbit...'
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {language === 'es' ? '¿Cuántos años tiene?' : 'How old is your pet?'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={petAge}
                  onChangeText={setPetAge}
                  placeholder={language === 'es' ? 'Ej: 3 años' : 'E.g: 3 years'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {language === 'es'
                    ? '¿Hay algo adicional que debamos saber?'
                    : 'Is there anything else we should know?'}
                </Text>
                <Text style={styles.sublabel}>
                  {language === 'es'
                    ? '(enfermedades, alergias, etc.)'
                    : '(diseases, allergies, etc.)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder={
                    language === 'es'
                      ? 'Información adicional (opcional)'
                      : 'Additional information (optional)'
                  }
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateRecipe}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.generateButtonText}>
                      {language === 'es' ? 'Generar receta' : 'Generate recipe'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : recipe ? (
          <View style={styles.recipeContainer}>
            <View style={styles.card}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <TouchableOpacity onPress={toggleFavorite} style={styles.heartButton}>
                  <Heart
                    size={28}
                    color="#ef4444"
                    strokeWidth={2}
                    fill={isFavorite ? '#ef4444' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {language === 'es' ? 'Ingredientes' : 'Ingredients'}
                </Text>
                <Text style={styles.sectionContent}>{recipe.ingredients}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {language === 'es' ? 'Preparación' : 'Preparation'}
                </Text>
                <Text style={styles.sectionContent}>{recipe.preparation}</Text>
              </View>

              <View style={styles.tipContainer}>
                <Text style={styles.tipTitle}>
                  {language === 'es' ? '💡 Consejo útil' : '💡 Useful tip'}
                </Text>
                <Text style={styles.tipContent}>{recipe.tip}</Text>
              </View>

              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={generateRecipe}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#10b981" />
                ) : (
                  <>
                    <Sparkles size={20} color="#10b981" strokeWidth={2} />
                    <Text style={styles.regenerateButtonText}>
                      {language === 'es'
                        ? 'Púlsame para generar otra receta'
                        : 'Press to generate another recipe'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
    paddingHorizontal: 16,
    paddingTop: 60,
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  favoritesButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  generateButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recipeContainer: {
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  heartButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  tipContainer: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 15,
    color: '#047857',
    lineHeight: 22,
  },
  regenerateButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  regenerateButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});
