import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, PawPrint, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import { translations } from '@/lib/translations';

export default function PetAdvisorScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { petProfile } = usePetProfile();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const [petData, setPetData] = useState({
    pet_type: '',
    pet_name: '',
    breed: '',
    age: '',
    location: '',
    additional_info: '',
  });

  useEffect(() => {
    checkPremiumAndLoadPet();
  }, [petProfile]);

  const checkPremiumAndLoadPet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_subscribed')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[PetAdvisor] Error fetching premium status:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          });
          setIsPremium(false);
        } else {
          setIsPremium(profile?.is_subscribed || false);
        }

        if (petProfile) {
          setPetData({
            pet_type: petProfile.pet_type,
            pet_name: petProfile.pet_name,
            breed: petProfile.breed || '',
            age: String(petProfile.age_years),
            location: petProfile.location || '',
            additional_info: petProfile.additional_info || '',
          });
        }
      }
    } catch (error) {
      console.error('[PetAdvisor] Unexpected error checking premium status:', error);
      setIsPremium(false);
    }
  };

  const handleGenerateClick = () => {
    if (!petData.pet_type || !petData.age || !petData.location) {
      Alert.alert(
        language === 'es' ? 'Perfil incompleto' : 'Incomplete profile',
        language === 'es'
          ? 'Por favor completa tu perfil de mascota desde la pantalla de Perfil antes de generar el informe.'
          : 'Please complete your pet profile from the Profile screen before generating the report.'
      );
      return;
    }
    handleGenerateReport();
  };

  const handleGenerateReport = async () => {
    if (!petData.pet_type || !petData.age || !petData.location) {
      Alert.alert(
        language === 'es' ? 'Datos incompletos' : 'Incomplete data',
        language === 'es'
          ? 'Por favor completa toda la información de tu mascota desde el perfil'
          : 'Please complete all your pet information from the profile'
      );
      return;
    }

    setLoading(true);
    try {
      const mockReport = generateMockReport(petData);

      router.replace({
        pathname: '/ai-report',
        params: {
          pet_type: petData.pet_type,
          pet_name: petData.pet_name,
          breed: petData.breed,
          age: petData.age,
          location: petData.location,
          additional_info: petData.additional_info,
          report: mockReport,
        },
      });
    } catch (error) {
      Alert.alert(t.common.error, t.petAdvisor.reportFailed);
    } finally {
      setLoading(false);
    }
  };

  const generateMockReport = (data: typeof petData) => {
    const petTypeLower = data.pet_type.toLowerCase();
    const ageLower = data.age.toLowerCase();
    const locationLower = data.location.toLowerCase();
    const ageNum = parseInt(data.age) || 0;
    const petName = data.pet_name || (language === 'es' ? 'tu mascota' : 'your pet');
    const additionalNotes = data.additional_info || '';

    const isDog = petTypeLower.includes('dog') || petTypeLower.includes('perro') || petTypeLower.includes('cachorro');
    const isCat = petTypeLower.includes('cat') || petTypeLower.includes('gato') || petTypeLower.includes('kitten') || petTypeLower.includes('gatito');
    const isFish = petTypeLower.includes('fish') || petTypeLower.includes('pez') || petTypeLower.includes('goldfish') || petTypeLower.includes('betta');
    const isBird = petTypeLower.includes('bird') || petTypeLower.includes('parrot') || petTypeLower.includes('parakeet') || petTypeLower.includes('pájaro') || petTypeLower.includes('loro');
    const isRabbit = petTypeLower.includes('rabbit') || petTypeLower.includes('bunny') || petTypeLower.includes('conejo');
    const isReptile = petTypeLower.includes('reptile') || petTypeLower.includes('lizard') || petTypeLower.includes('snake') || petTypeLower.includes('turtle') || petTypeLower.includes('tortoise') || petTypeLower.includes('lagarto') || petTypeLower.includes('serpiente') || petTypeLower.includes('tortuga');

    const isSenior = ageLower.includes('senior') || ageLower.includes('old') || ageLower.includes('viejo') ||
                     ageLower.includes('mayor') || ageNum >= (isDog ? 7 : isCat ? 10 : 5);
    const isYoung = ageLower.includes('puppy') || ageLower.includes('kitten') || ageLower.includes('young') ||
                    ageLower.includes('cachorro') || ageLower.includes('joven') || ageNum <= 2;
    const isAdult = !isYoung && !isSenior;
    const hasGarden = locationLower.includes('house') || locationLower.includes('garden') ||
                      locationLower.includes('yard') || locationLower.includes('casa') ||
                      locationLower.includes('jardín');

    const lifeStageContext = isDog ?
      (isYoung ? language === 'es' ? `${petName} está en una etapa crucial de crecimiento y desarrollo. Los cachorros necesitan nutrición especial para construir huesos y músculos fuertes.` : `${petName} is at a crucial growth and development stage. Puppies need special nutrition to build strong bones and muscles.` :
       isSenior ? language === 'es' ? `${petName} está en su etapa senior y requiere cuidados especiales adaptados a su edad avanzada. Los perros mayores necesitan apoyo articular y control de peso.` : `${petName} is in the senior stage and requires special care adapted to advanced age. Older dogs need joint support and weight management.` :
       language === 'es' ? `${petName} está en su edad adulta plena. Es el momento perfecto para mantener rutinas saludables y prevenir problemas futuros.` : `${petName} is in full adulthood. This is the perfect time to maintain healthy routines and prevent future problems.`) :
      isCat ?
      (isYoung ? language === 'es' ? `${petName} está en pleno crecimiento. Los gatitos necesitan proteína de alta calidad y nutrición específica para su desarrollo.` : `${petName} is growing rapidly. Kittens need high-quality protein and specific nutrition for development.` :
       isSenior ? language === 'es' ? `${petName} es un gato senior que merece cuidados especiales. Los gatos mayores necesitan atención a su salud renal e hidratación.` : `${petName} is a senior cat deserving special care. Older cats need attention to kidney health and hydration.` :
       language === 'es' ? `${petName} está en la plenitud de su vida adulta. Es el momento ideal para prevención y cuidado proactivo.` : `${petName} is in the prime of adult life. This is the ideal time for prevention and proactive care.`) :
      language === 'es' ? `${petName} necesita cuidados específicos según su especie y edad.` : `${petName} needs specific care according to species and age.`;

    const reportContent = {
      en: {
        recommended_food: isDog ?
          (isSenior ? [
            'Senior dog formula with glucosamine for joint health',
            'Lower-calorie, high-protein dry food',
            'Soft, easy-to-chew wet food options',
          ] : isYoung ? [
            'Puppy formula with DHA for brain development',
            'High-protein growth food',
            'Small kibble size for easy chewing',
          ] : [
            'Premium dry food with real meat as first ingredient',
            'Grain-free wet food options',
            'Fresh vegetables and fruits as healthy treats',
          ]) : isCat ?
          (isSenior ? [
            'Senior cat formula with added taurine',
            'High-moisture wet food for kidney health',
            'Joint support supplements',
          ] : isYoung ? [
            'Kitten formula with essential nutrients',
            'High-protein growth food',
            'Wet food for hydration',
          ] : [
            'High-protein, grain-free cat food from reputable brands',
            'High-quality wet food with real meat protein',
            'Balanced diet with taurine and limited carbohydrates',
          ]) : isFish ? [
            'High-quality fish flakes or pellets specific to species',
            'Freeze-dried bloodworms or brine shrimp as treats',
            'Varied diet to ensure balanced nutrition',
          ] : isBird ? [
            'Species-specific seed mix or pellets',
            'Fresh fruits and vegetables daily',
            'Cuttlebone for calcium and beak health',
          ] : isRabbit ? [
            'Unlimited fresh timothy hay',
            'High-fiber rabbit pellets (limited quantity)',
            'Fresh leafy greens and vegetables daily',
          ] : isReptile ? [
            'Species-appropriate live insects or frozen prey',
            'Fresh vegetables for herbivorous species',
            'Calcium and vitamin D3 supplements',
          ] : [
            `Species-appropriate high-quality food for ${data.pet_type}`,
            'Balanced nutrition formula',
            'Fresh food options when suitable',
          ],
        nutrition_advice: isDog ?
          (isSenior ?
            'Senior dogs need lower calories but higher quality protein to maintain muscle mass. Focus on joint-supporting nutrients like glucosamine and omega-3 fatty acids. Avoid overfeeding to prevent obesity.' :
            isYoung ?
            'Puppies need high-quality protein and fat for growth. Feed 3-4 small meals daily. Calcium and phosphorus balance is crucial for bone development. Avoid adult dog food.' :
            `Based on your ${data.breed} breed, provide a balanced diet with 25-30% protein and 15-20% fat. Maintain consistent feeding schedule and portion control.`) :
          isCat ?
          (isSenior ?
            'Senior cats benefit from high moisture content to support kidney function. Provide easily digestible proteins and add supplements for joint health. Monitor weight carefully.' :
            isYoung ?
            'Kittens need frequent meals (4-5 times daily) with high protein content. Wet food helps with hydration. Essential amino acids like taurine are critical.' :
            `Cats are obligate carnivores - prioritize animal protein. ${data.breed} cats need high-protein, low-carb diet. Provide fresh water at all times.`) :
          isFish ?
            `${data.breed} fish require species-specific feeding schedules. Feed small amounts 1-2 times daily. Overfeeding leads to poor water quality. Remove uneaten food after 2-3 minutes. Vary diet to prevent nutritional deficiencies.` :
          isBird ?
            `${data.breed} birds need a varied diet. Pellets should form 60-70% of diet, supplemented with fresh produce. Avoid avocado, chocolate, salt, and caffeine - toxic to birds. Provide fresh water daily. Seeds alone cause nutritional deficiencies.` :
          isRabbit ?
            `Rabbits are herbivores requiring constant access to hay (80% of diet). Provide 1/4 cup pellets per 5 lbs body weight. Introduce new vegetables slowly. Avoid iceberg lettuce, beans, and sugary treats. Fresh water must always be available.` :
          isReptile ?
            `${data.breed} reptiles have specific dietary needs. Carnivorous species need appropriately-sized prey. Herbivorous reptiles need calcium-rich greens. Dust food with calcium/D3 supplements. Research exact requirements for your species.` :
          `Ensure ${data.pet_type} receives species-appropriate nutrition. Consult with a specialized veterinarian for specific dietary requirements based on age and health status of your ${data.pet_type}.`,
        estimated_weight: isDog ?
          (data.breed.toLowerCase().includes('chihuahua') || data.breed.toLowerCase().includes('toy') ? '1.5-3 kg' :
           data.breed.toLowerCase().includes('pomeranian') || data.breed.toLowerCase().includes('yorkshire') ? '2-4 kg' :
           data.breed.toLowerCase().includes('beagle') || data.breed.toLowerCase().includes('bulldog') ? '9-15 kg' :
           data.breed.toLowerCase().includes('labrador') || data.breed.toLowerCase().includes('golden') ? '25-35 kg' :
           data.breed.toLowerCase().includes('german shepherd') || data.breed.toLowerCase().includes('rottweiler') ? '30-45 kg' :
           data.breed.toLowerCase().includes('great dane') || data.breed.toLowerCase().includes('mastiff') ? '50-90 kg' :
           isSenior ? '10-25 kg' : isYoung ? '5-15 kg' : '10-30 kg') :
          isCat ?
          (isSenior ? '3-5 kg for average adult domestic cat' : isYoung ? '1-2 kg for growing kitten' : '3.5-5 kg for average adult domestic cat') :
          isFish ? 'Varies by species - consult care guide' :
          isBird ? (data.breed.toLowerCase().includes('parrot') ? '300-500g' : data.breed.toLowerCase().includes('canary') ? '15-25g' : 'Varies by species') :
          isRabbit ? (isSenior ? '1.5-3 kg' : isYoung ? '0.5-1.5 kg' : '1.5-3 kg') :
          isReptile ? 'Varies significantly by species and age' :
          'Consult species-specific care guidelines',
        daily_food_amount: isDog ?
          (isSenior ? 'Approximately 200-400g of dry food per day (adjust based on weight and activity level)' :
           isYoung ? 'Approximately 300-500g of puppy food per day, divided into 3-4 meals' :
           'Approximately 250-450g of dry food per day, divided into 2 meals. Exact portions depend on specific food brand and calorie density') :
          isCat ?
          (isSenior ? 'Approximately 150-200g of wet food per day or 40-60g of dry food per day' :
           isYoung ? 'Approximately 200-300g of wet kitten food per day or 60-90g of dry food, divided into 4-5 small meals' :
           'Approximately 200-250g of wet food per day or 60-80g of dry food per day. Exact portions depend on specific food brand and calorie density') :
          isFish ? 'Feed small amounts 1-2 times daily - only what can be consumed in 2-3 minutes' :
          isBird ? 'Approximately 15-20g of pellets daily plus fresh fruits and vegetables. Seeds should not exceed 30% of diet' :
          isRabbit ? 'Unlimited timothy hay, 1/4 cup pellets per 5 lbs body weight, and 2-3 cups of fresh vegetables daily' :
          isReptile ? 'Varies by species - carnivores need appropriately-sized prey, herbivores need daily fresh vegetables' :
          'Consult species-specific feeding guidelines',
        activities: isDog ?
          (hasGarden ? [
            isSenior ? 'Gentle 15-20 minute walks twice daily' : isYoung ? 'Short, frequent play sessions in the garden (5-10 minutes each)' : 'Daily 45-minute walks and garden play',
            isSenior ? 'Swimming or water therapy for low-impact exercise' : isYoung ? 'Basic training and socialization' : 'Fetch and running games in the garden',
            isSenior ? 'Mental stimulation with puzzle toys' : isYoung ? 'Puppy socialization classes' : 'Agility training or obstacle courses',
          ] : [
            isSenior ? 'Short, gentle walks (15-20 minutes twice daily)' : isYoung ? 'Indoor play with soft toys (frequent short sessions)' : 'Daily 30-40 minute walks',
            isSenior ? 'Low-impact indoor games' : isYoung ? 'Puppy training and socialization' : 'Interactive indoor play and games',
            isSenior ? 'Gentle mental stimulation activities' : isYoung ? 'Safe exploration and learning' : 'Indoor agility or trick training',
          ]) : isCat ?
          (hasGarden ? [
            isSenior ? 'Gentle indoor play with feather wand toys' : isYoung ? 'Supervised outdoor exploration' : 'Safe outdoor enclosure time',
            isSenior ? 'Short, calm play sessions with soft toys' : isYoung ? 'Interactive kitten toys and puzzle feeders' : 'Climbing trees and window perches',
            isSenior ? 'Warm, comfortable resting spots' : isYoung ? 'Socialization and exploration' : 'Interactive hunting simulation toys',
          ] : [
            isSenior ? 'Gentle interactive play with feather toys for 10-15 minutes' : isYoung ? 'Frequent short play sessions with soft balls' : 'Daily 20-30 minutes of active play with feather wands',
            isSenior ? 'Multiple resting spots at different heights' : isYoung ? 'Climbing and jumping practice on cat trees' : 'Vertical spaces and cat trees for climbing',
            isSenior ? 'Low-intensity puzzle feeders' : isYoung ? 'Chasing games with moving toys' : 'Interactive feather wand toys and hide-and-seek games',
          ]) : isFish ? [
            'Maintain optimal water temperature and quality',
            'Provide hiding spots and decorations for enrichment',
            'Regular aquarium maintenance (weekly water changes)',
          ] : isBird ? [
            'Daily out-of-cage flight time in safe, supervised area',
            'Foraging toys and puzzle feeders for mental stimulation',
            'Social interaction and training sessions',
          ] : isRabbit ? [
            'Minimum 3-4 hours daily exercise outside cage',
            'Tunnels, boxes, and platforms for exploration',
            'Safe chew toys and digging boxes',
          ] : isReptile ? [
            'Proper basking and UVB lighting setup',
            'Temperature gradient in enclosure',
            'Species-appropriate enrichment (climbing, hiding spots)',
          ] : [
            `Species-appropriate exercise for ${data.pet_type}`,
            'Environmental enrichment',
            'Mental stimulation activities',
          ],
        veterinary_care: isFish ?
          `Regular water testing for pH, ammonia, nitrites, and nitrates. Monitor for signs of disease (spots, lethargy, appetite loss). Quarantine new fish before adding to tank. Consult aquatic veterinarian for ${data.breed} specific needs.` :
          isBird ?
          `Annual avian veterinary exams. Monitor droppings, feathers, and breathing daily. Nail and beak trimming as needed. Watch for signs of illness (fluffed feathers, lethargy). Birds hide illness well - early intervention crucial.` :
          isRabbit ?
          `Annual wellness exams. Dental checks every 6 months (teeth grow continuously). Spay/neuter recommended by 6 months. Monitor for GI stasis (medical emergency). Regular grooming and nail trimming.` :
          isReptile ?
          `Find reptile-specialized veterinarian. Annual health checks. Fecal parasite testing. Monitor weight, activity, and shedding. Maintain proper humidity and temperature. Many reptile illnesses are husbandry-related.` :
          isSenior ?
          'Senior pets need bi-annual check-ups. Regular blood work to monitor organ function. Dental care is crucial. Watch for signs of arthritis, vision/hearing loss, and cognitive decline. Early detection of age-related conditions improves quality of life.' :
          isYoung ?
          'Young pets need initial vaccination series (6-16 weeks). Deworming protocols. Spay/neuter consultation around 6 months. Frequent wellness checks during first year. Establish preventive care routine early.' :
          `Annual wellness exams are essential for ${data.pet_type}. Keep vaccinations current where applicable. Monitor for species-specific health issues. Establish baseline health metrics with specialized veterinarian.`,
        preventive_care: isDog ? [
          'Monthly flea, tick, and heartworm prevention',
          isSenior ? 'Bi-weekly gentle brushing and nail care' : isYoung ? 'Early grooming habituation and training' : 'Weekly brushing and monthly nail trimming',
          isSenior ? 'Joint supplements and pain management' : isYoung ? 'Puppy-proofing living spaces' : 'Regular dental care and teeth brushing',
        ] : isCat ? [
          'Monthly flea prevention (especially for outdoor access)',
          isSenior ? 'Gentle daily brushing' : isYoung ? 'Litter box training and maintenance' : 'Weekly brushing and nail trimming',
          isSenior ? 'Regular monitoring of kidney function' : isYoung ? 'Scratching post training' : 'Dental treats and oral hygiene',
        ] : isFish ? [
          'Weekly 25% water changes',
          'Monthly filter cleaning and maintenance',
          'Daily feeding schedule and tank monitoring',
        ] : isBird ? [
          'Daily cage cleaning (bottom tray)',
          'Weekly perch and toy cleaning',
          'Monthly deep cage cleaning and disinfection',
        ] : isRabbit ? [
          'Daily litter box cleaning',
          'Weekly full cage cleaning',
          'Regular nail trimming every 4-6 weeks',
        ] : isReptile ? [
          'Daily spot cleaning of enclosure',
          'Weekly substrate replacement',
          'Monthly deep cleaning and disinfection',
        ] : [
          `Species-appropriate habitat maintenance for ${data.pet_type}`,
          'Regular health monitoring',
          'Preventive hygiene practices',
        ],
        estimated_costs: {
          food: isDog ? (isSenior ? '40-60€' : isYoung ? '45-60€' : '30-50€') :
                isCat ? (isSenior ? '35-55€' : isYoung ? '40-55€' : '25-45€') :
                isFish ? '5-15€' :
                isBird ? '20-40€' :
                isRabbit ? '15-35€' :
                isReptile ? '15-30€' : '20-45€',
          veterinary: isFish ? '10-25€' :
                      isBird ? '15-35€' :
                      isRabbit ? '15-30€' :
                      isReptile ? '15-35€' :
                      isSenior ? '30-40€' : isYoung ? '25-40€' : '10-30€',
          grooming: isDog ? '30-50€' : undefined,
          total: isDog ? (isSenior ? '100-150€' : isYoung ? '105-150€' : '70-130€') :
                 isCat ? (isSenior ? '65-95€' : isYoung ? '65-95€' : '35-75€') :
                 isFish ? '15-40€' :
                 isBird ? '35-75€' :
                 isRabbit ? '30-65€' :
                 isReptile ? '30-65€' : '40-85€',
        },
        cost_tips: isDog ? [
          'Buy premium dog food in bulk to save 15-25%',
          isSenior ? 'Consider pet insurance for senior health issues' : isYoung ? 'Invest in puppy insurance early for lifetime coverage' : 'Compare pet insurance plans for best value',
          'Learn basic grooming at home to reduce professional costs',
          'Use preventive care to avoid expensive emergency treatments',
        ] : isCat ? [
          'Purchase cat food in larger quantities for discounts',
          isSenior ? 'Budget for potential senior health expenses' : isYoung ? 'Get kitten insurance before any health issues arise' : 'Evaluate pet insurance options',
          'Groom at home - cats are relatively low-maintenance',
          'Prevent dental disease to avoid costly procedures',
          'Take advantage of vet visits to ask for extra doses of antiparasitic treatments so you can administer them at home next time, as they are usually just simple drops',
        ] : isFish ? [
          'Buy fish food in larger containers for better value',
          'Invest in quality filtration to reduce water costs',
          'Learn to test water parameters yourself',
          'Buy decorations and plants secondhand when safe',
        ] : isBird ? [
          'Buy pellets and seeds in bulk',
          'Grow safe vegetables and herbs at home for fresh food',
          'Make DIY foraging toys from safe household items',
          'Learn basic health monitoring to catch issues early',
        ] : isRabbit ? [
          'Buy hay in bulk from farm suppliers',
          'Grow rabbit-safe greens in a small garden',
          'Make DIY toys from cardboard and paper',
          'Learn to trim nails at home',
        ] : isReptile ? [
          'Buy frozen feeders in bulk if applicable',
          'Invest in proper heating/lighting upfront to save energy',
          'DIY enclosure enrichment items when safe',
          'Monitor temperatures to prevent health issues',
        ] : [
          `Buy ${data.pet_type} food in bulk when possible`,
          'Invest in preventive care and proper habitat',
          'Learn species-appropriate DIY care techniques',
          'Research specialized care to avoid costly mistakes',
        ],
        shopping_list: isDog ? (isSenior ? [
          {
            name: 'Hill\'s Science Diet Senior Dog Food',
            description: 'Premium senior formula with glucosamine and chondroitin for joint health',
          },
          {
            name: 'Cosequin Joint Health Supplement',
            description: 'Veterinarian-recommended joint support for senior dogs',
          },
          {
            name: 'Orthopedic Dog Bed',
            description: 'Memory foam bed for senior dogs with arthritis',
          },
          {
            name: 'Senior Dog Multivitamin',
            description: 'Age-appropriate vitamin supplement',
          },
        ] : isYoung ? [
          {
            name: `${isDog ? 'Puppy' : 'Kitten'} Food - Premium Brand`,
            description: 'Growth formula with DHA for brain development',
          },
          {
            name: 'Puppy Training Pads',
            description: 'For house training young puppies',
          },
          {
            name: 'Soft Puppy Toys',
            description: 'Safe toys for teething puppies',
          },
          {
            name: 'Puppy Shampoo',
            description: 'Gentle, tear-free formula for young dogs',
          },
        ] : [
          {
            name: `Premium ${data.breed} Dog Food`,
            description: 'High-protein formula with real meat',
          },
          {
            name: 'Interactive Dog Toys',
            description: 'Mental stimulation and entertainment',
          },
          {
            name: 'Grooming Brush',
            description: `Suitable for ${data.breed} coat type`,
          },
          {
            name: 'Dental Chews',
            description: 'Daily dental care treats',
          },
        ]) : isCat ? (isSenior ? [
          {
            name: 'Senior Cat Wet Food',
            description: 'High-moisture food for kidney health',
          },
          {
            name: 'Cat Joint Supplement',
            description: 'Glucosamine and chondroitin for aging cats',
          },
          {
            name: 'Heated Cat Bed',
            description: 'Warm, comfortable bed for senior cats',
          },
          {
            name: 'Senior Cat Vitamin',
            description: 'Age-appropriate supplement',
          },
        ] : isYoung ? [
          {
            name: 'Kitten Food - Premium Brand',
            description: 'Growth formula with essential nutrients',
          },
          {
            name: 'Kitten Litter Box',
            description: 'Small-sized box for easy access',
          },
          {
            name: 'Interactive Kitten Toys',
            description: 'Stimulating toys for playful kittens',
          },
          {
            name: 'Kitten Scratching Post',
            description: 'Train healthy scratching habits early',
          },
        ] : [
          {
            name: `Premium ${data.breed} Cat Food`,
            description: 'High-protein, grain-free formula',
          },
          {
            name: 'Cat Water Fountain',
            description: 'Encourages hydration',
          },
          {
            name: 'Interactive Feather Toys',
            description: 'Hunting simulation play',
          },
          {
            name: 'Cat Grooming Brush',
            description: 'Reduces shedding and hairballs',
          },
        ]) : isFish ? [
          {
            name: `${data.breed} Fish Food`,
            description: 'Species-specific flakes or pellets',
          },
          {
            name: 'Water Testing Kit',
            description: 'pH, ammonia, nitrite, nitrate tests',
          },
          {
            name: 'Aquarium Filter',
            description: 'Appropriate for tank size',
          },
          {
            name: 'Tank Decorations and Plants',
            description: 'Hiding spots and enrichment',
          },
        ] : isBird ? [
          {
            name: `${data.breed} Bird Pellets`,
            description: 'Species-appropriate complete nutrition',
          },
          {
            name: 'Cuttlebone and Mineral Block',
            description: 'Calcium and mineral supplement',
          },
          {
            name: 'Foraging Toys',
            description: 'Mental stimulation and enrichment',
          },
          {
            name: 'Natural Wood Perches',
            description: 'Various sizes for foot health',
          },
        ] : isRabbit ? [
          {
            name: 'Timothy Hay (Bulk)',
            description: 'Unlimited fresh hay essential',
          },
          {
            name: 'Rabbit Pellets',
            description: 'High-fiber, species-appropriate',
          },
          {
            name: 'Litter Box and Safe Litter',
            description: 'Paper-based or hay-based litter',
          },
          {
            name: 'Chew Toys',
            description: 'Wood and hay-based toys for dental health',
          },
        ] : isReptile ? [
          {
            name: `${data.breed} Food`,
            description: 'Species-appropriate insects or vegetation',
          },
          {
            name: 'UVB Lighting',
            description: 'Essential for vitamin D3 synthesis',
          },
          {
            name: 'Heat Source',
            description: 'Basking lamp or under-tank heater',
          },
          {
            name: 'Calcium Supplement',
            description: 'With D3 for proper bone health',
          },
        ] : [
          {
            name: `Premium ${data.pet_type} Food`,
            description: 'Species-appropriate nutrition',
          },
          {
            name: 'Appropriate Habitat Setup',
            description: 'Cage, tank, or enclosure with proper size',
          },
          {
            name: 'Species-Specific Enrichment',
            description: 'Toys and activities for mental stimulation',
          },
          {
            name: 'Health Monitoring Supplies',
            description: 'Basic care and monitoring essentials',
          },
        ],
        forbidden_foods: isDog ? [
          { name: 'Chocolate', reason: 'Contains theobromine, toxic to dogs - can cause seizures, heart problems, and death' },
          { name: 'Grapes & Raisins', reason: 'Can cause acute kidney failure, even in small amounts' },
          { name: 'Onions & Garlic', reason: 'Damage red blood cells and can cause anemia' },
          { name: 'Xylitol (artificial sweetener)', reason: 'Causes rapid insulin release, leading to hypoglycemia and liver failure' },
          { name: 'Macadamia Nuts', reason: 'Cause weakness, vomiting, tremors, and hyperthermia' },
          { name: 'Alcohol', reason: 'Extremely toxic - causes vomiting, breathing problems, coma, and death' },
          { name: 'Caffeine', reason: 'Causes hyperactivity, rapid heart rate, seizures, and death' },
          { name: 'Avocado', reason: 'Contains persin which can cause vomiting and diarrhea' },
          { name: 'Cooked Bones', reason: 'Can splinter and cause choking or internal injuries' },
          { name: 'Raw Dough', reason: 'Expands in stomach and produces alcohol during fermentation' },
        ] : isCat ? [
          { name: 'Chocolate', reason: 'Contains theobromine, highly toxic to cats - causes heart problems and seizures' },
          { name: 'Onions & Garlic', reason: 'Destroy red blood cells and cause hemolytic anemia' },
          { name: 'Grapes & Raisins', reason: 'Can cause kidney failure' },
          { name: 'Alcohol', reason: 'Extremely dangerous - causes severe intoxication, coma, and death' },
          { name: 'Caffeine', reason: 'Causes restlessness, rapid breathing, heart palpitations, and seizures' },
          { name: 'Xylitol', reason: 'Causes liver failure and severe hypoglycemia' },
          { name: 'Dairy Products', reason: 'Most cats are lactose intolerant - causes digestive upset' },
          { name: 'Raw Fish', reason: 'Contains thiaminase enzyme that destroys vitamin B1' },
          { name: 'Raw Poultry & Raw Meat', reason: 'Can contain harmful bacteria like Salmonella and E. coli - causes serious illness' },
          { name: 'Bones', reason: 'Can splinter and cause choking or intestinal blockage' },
          { name: 'Dog Food', reason: 'Lacks taurine and proper nutrients essential for cats' },
        ] : isFish ? [
          { name: 'Bread & Baked Goods', reason: 'Causes bloating and digestive issues, no nutritional value' },
          { name: 'Human Processed Foods', reason: 'High in salt, preservatives, and unhealthy additives' },
          { name: 'Meat & Chicken', reason: 'Not nutritionally balanced for fish, pollutes water' },
          { name: 'Fruits & Vegetables', reason: 'Most species cannot digest plant matter properly' },
          { name: 'Overfeeding', reason: 'Causes obesity and severely degrades water quality' },
        ] : isBird ? [
          { name: 'Avocado', reason: 'Contains persin - extremely toxic to birds, causes heart damage and death' },
          { name: 'Chocolate', reason: 'Contains theobromine - causes seizures and death' },
          { name: 'Caffeine', reason: 'Causes cardiac arrest and hyperactivity' },
          { name: 'Alcohol', reason: 'Extremely toxic - causes organ failure' },
          { name: 'Salt', reason: 'Causes excessive thirst, dehydration, kidney dysfunction, and death' },
          { name: 'Onions & Garlic', reason: 'Cause hemolytic anemia and digestive upset' },
          { name: 'Apple Seeds', reason: 'Contain cyanide compounds' },
          { name: 'Raw Beans', reason: 'Contain hemagglutinin toxin' },
          { name: 'Fruit Pits', reason: 'Contain cyanide and cause choking' },
        ] : isRabbit ? [
          { name: 'Iceberg Lettuce', reason: 'Contains lactucarium which causes diarrhea and health issues' },
          { name: 'Beans & Legumes', reason: 'Cause gas and painful bloating' },
          { name: 'Potatoes', reason: 'Contain solanine toxin, especially when green or sprouted' },
          { name: 'Chocolate', reason: 'Toxic to rabbits - causes seizures and death' },
          { name: 'Sugary Foods', reason: 'Disrupt gut bacteria and cause severe digestive problems' },
          { name: 'Dairy Products', reason: 'Rabbits are herbivores and cannot digest lactose' },
          { name: 'Nuts & Seeds', reason: 'High in fat and cause digestive upset' },
          { name: 'Processed Human Foods', reason: 'Contain harmful additives and excessive salt/sugar' },
        ] : isReptile ? [
          { name: 'Avocado', reason: 'Toxic to many reptile species' },
          { name: 'Rhubarb', reason: 'Contains oxalic acid which is toxic' },
          { name: 'Fireflies/Lightning Bugs', reason: 'Extremely toxic - can kill reptiles quickly' },
          { name: 'Wild-Caught Insects', reason: 'May carry pesticides and parasites' },
          { name: 'Processed Human Foods', reason: 'Lack proper nutrients and contain harmful additives' },
          { name: 'Dairy Products', reason: 'Reptiles cannot digest lactose' },
          { name: 'Spinach & Kale (in excess)', reason: 'High in oxalates which bind calcium' },
        ] : [
          { name: 'Chocolate', reason: 'Toxic to most pets - contains theobromine' },
          { name: 'Alcohol', reason: 'Extremely dangerous for all animals' },
          { name: 'Caffeine', reason: 'Toxic to most pets - causes serious health issues' },
          { name: 'Processed Human Foods', reason: 'Often contain harmful additives and improper nutrients' },
          { name: 'Foods Not Species-Appropriate', reason: `Consult a veterinarian for ${data.pet_type}-specific dietary restrictions` },
        ],
        disclaimer: 'This information is for educational purposes and does not replace professional veterinary advice. Always consult with a licensed veterinarian for medical concerns and before making significant changes to your pet\'s diet or care routine.',
      },
      es: {
        recommended_food: isDog ?
          (isSenior ? [
            'Fórmula senior para perros con glucosamina para la salud articular',
            'Alimento seco bajo en calorías y alto en proteínas',
            'Opciones de alimento húmedo suave y fácil de masticar',
          ] : isYoung ? [
            'Fórmula para cachorros con DHA para desarrollo cerebral',
            'Alimento de crecimiento alto en proteínas',
            'Croquetas pequeñas para fácil masticación',
          ] : [
            'Alimento seco premium con carne real como primer ingrediente',
            'Opciones de alimento húmedo sin cereales',
            'Verduras y frutas frescas como premios saludables',
          ]) : isCat ?
          (isSenior ? [
            'Fórmula senior para gatos con taurina añadida',
            'Alimento húmedo alto en humedad para salud renal',
            'Suplementos de apoyo articular',
          ] : isYoung ? [
            'Fórmula para gatitos con nutrientes esenciales',
            'Alimento de crecimiento alto en proteínas',
            'Alimento húmedo para hidratación',
          ] : [
            'Alimento para gatos alto en proteínas y sin cereales de marcas reconocidas',
            'Alimento húmedo de alta calidad con proteína cárnica real',
            'Dieta balanceada con taurina y carbohidratos limitados',
          ]) : isFish ? [
            'Escamas o pellets de alta calidad específicos para la especie',
            'Gusanos de sangre liofilizados o artemias como premios',
            'Dieta variada para asegurar nutrición equilibrada',
          ] : isBird ? [
            'Mezcla de semillas o pellets específicos para la especie',
            'Frutas y verduras frescas diariamente',
            'Hueso de jibia para calcio y salud del pico',
          ] : isRabbit ? [
            'Heno timothy fresco ilimitado',
            'Pellets altos en fibra para conejos (cantidad limitada)',
            'Verduras de hoja verde y vegetales frescos diariamente',
          ] : isReptile ? [
            'Insectos vivos o presas congeladas apropiadas para la especie',
            'Verduras frescas para especies herbívoras',
            'Suplementos de calcio y vitamina D3',
          ] : [
            `Alimento de alta calidad apropiado para ${data.pet_type}`,
            'Fórmula de nutrición equilibrada',
            'Opciones de alimento fresco cuando sea apropiado',
          ],
        nutrition_advice: isDog ?
          (isSenior ?
            'Los perros senior necesitan menos calorías pero proteínas de mayor calidad para mantener masa muscular. Enfócate en nutrientes que apoyan las articulaciones como glucosamina y ácidos grasos omega-3. Evita la sobrealimentación para prevenir obesidad.' :
            isYoung ?
            'Los cachorros necesitan proteínas y grasas de alta calidad para crecer. Alimenta 3-4 comidas pequeñas al día. El equilibrio de calcio y fósforo es crucial para el desarrollo óseo. Evita alimento para perros adultos.' :
            `Basado en la raza ${data.breed}, proporciona una dieta equilibrada con 25-30% de proteína y 15-20% de grasa. Mantén un horario y control de porciones consistentes.`) :
          isCat ?
          (isSenior ?
            'Los gatos senior se benefician de alto contenido de humedad para apoyar la función renal. Proporciona proteínas fácilmente digeribles y añade suplementos para la salud articular. Monitorea el peso cuidadosamente.' :
            isYoung ?
            'Los gatitos necesitan comidas frecuentes (4-5 veces al día) con alto contenido de proteína. El alimento húmedo ayuda con la hidratación. Aminoácidos esenciales como la taurina son críticos.' :
            `Los gatos son carnívoros obligados - prioriza la proteína animal. Los gatos ${data.breed} necesitan una dieta alta en proteínas y baja en carbohidratos. Proporciona agua fresca en todo momento.`) :
          isFish ?
            `Los peces ${data.breed} requieren horarios de alimentación específicos. Alimenta pequeñas cantidades 1-2 veces al día. La sobrealimentación genera mala calidad del agua. Retira comida no consumida después de 2-3 minutos. Varía la dieta para prevenir deficiencias nutricionales.` :
          isBird ?
            `Las aves ${data.breed} necesitan una dieta variada. Los pellets deben formar 60-70% de la dieta, complementado con productos frescos. Evita aguacate, chocolate, sal y cafeína - tóxicos para aves. Proporciona agua fresca diariamente. Solo semillas causan deficiencias nutricionales.` :
          isRabbit ?
            `Los conejos son herbívoros que requieren acceso constante al heno (80% de la dieta). Proporciona 1/4 taza de pellets por cada 5 lbs de peso corporal. Introduce vegetales nuevos lentamente. Evita lechuga iceberg, frijoles y premios azucarados. El agua fresca debe estar siempre disponible.` :
          isReptile ?
            `Los reptiles ${data.breed} tienen necesidades dietéticas específicas. Las especies carnívoras necesitan presas de tamaño apropiado. Los reptiles herbívoros necesitan verduras ricas en calcio. Espolvorea la comida con suplementos de calcio/D3. Investiga requisitos exactos para tu especie.` :
          `Asegúrate de que ${data.pet_type} reciba nutrición apropiada para su especie. Consulta con un veterinario especializado para requisitos dietéticos específicos basados en edad y estado de salud de tu ${data.pet_type}.`,
        estimated_weight: isDog ?
          (data.breed.toLowerCase().includes('chihuahua') || data.breed.toLowerCase().includes('toy') ? '1,5-3 kg' :
           data.breed.toLowerCase().includes('pomeranian') || data.breed.toLowerCase().includes('yorkshire') ? '2-4 kg' :
           data.breed.toLowerCase().includes('beagle') || data.breed.toLowerCase().includes('bulldog') ? '9-15 kg' :
           data.breed.toLowerCase().includes('labrador') || data.breed.toLowerCase().includes('golden') ? '25-35 kg' :
           data.breed.toLowerCase().includes('pastor alemán') || data.breed.toLowerCase().includes('rottweiler') ? '30-45 kg' :
           data.breed.toLowerCase().includes('gran danés') || data.breed.toLowerCase().includes('mastiff') ? '50-90 kg' :
           isSenior ? '10-25 kg' : isYoung ? '5-15 kg' : '10-30 kg') :
          isCat ?
          (isSenior ? '3-5 kg para un gato doméstico adulto promedio' : isYoung ? '1-2 kg para gatito en crecimiento' : '3,5-5 kg para un gato doméstico adulto promedio') :
          isFish ? 'Varía según la especie - consulta guía de cuidados' :
          isBird ? (data.breed.toLowerCase().includes('loro') ? '300-500g' : data.breed.toLowerCase().includes('canario') ? '15-25g' : 'Varía según la especie') :
          isRabbit ? (isSenior ? '1,5-3 kg' : isYoung ? '0,5-1,5 kg' : '1,5-3 kg') :
          isReptile ? 'Varía significativamente según especie y edad' :
          'Consulta guías de cuidado específicas de la especie',
        daily_food_amount: isDog ?
          (isSenior ? 'Aproximadamente 200-400g de alimento seco por día (ajustar según peso y nivel de actividad)' :
           isYoung ? 'Aproximadamente 300-500g de alimento para cachorros por día, dividido en 3-4 comidas' :
           'Aproximadamente 250-450g de alimento seco por día, dividido en 2 comidas. Las porciones exactas dependen de la marca específica y densidad calórica') :
          isCat ?
          (isSenior ? 'Aproximadamente 150-200g de alimento húmedo por día o 40-60g de alimento seco por día' :
           isYoung ? 'Aproximadamente 200-300g de alimento húmedo para gatitos por día o 60-90g de alimento seco, dividido en 4-5 comidas pequeñas' :
           'Aproximadamente 200-250g de alimento húmedo por día o 60-80g de alimento seco por día. Las porciones exactas dependen de la marca específica y densidad calórica') :
          isFish ? 'Alimenta pequeñas cantidades 1-2 veces al día - solo lo que pueda consumirse en 2-3 minutos' :
          isBird ? 'Aproximadamente 15-20g de pellets diarios más frutas y verduras frescas. Las semillas no deben exceder el 30% de la dieta' :
          isRabbit ? 'Heno timothy ilimitado, 1/4 taza de pellets por cada 5 lbs de peso corporal, y 2-3 tazas de verduras frescas diariamente' :
          isReptile ? 'Varía según especie - carnívoros necesitan presas de tamaño apropiado, herbívoros necesitan verduras frescas diarias' :
          'Consulta guías de alimentación específicas de la especie',
        activities: isDog ?
          (hasGarden ? [
            isSenior ? 'Paseos suaves de 15-20 minutos dos veces al día' : isYoung ? 'Sesiones de juego cortas y frecuentes en el jardín (5-10 minutos cada una)' : 'Paseos diarios de 45 minutos y juego en el jardín',
            isSenior ? 'Natación o terapia acuática para ejercicio de bajo impacto' : isYoung ? 'Entrenamiento básico y socialización' : 'Juegos de buscar y correr en el jardín',
            isSenior ? 'Estimulación mental con juguetes de rompecabezas' : isYoung ? 'Clases de socialización para cachorros' : 'Entrenamiento de agilidad o cursos de obstáculos',
          ] : [
            isSenior ? 'Paseos cortos y suaves (15-20 minutos dos veces al día)' : isYoung ? 'Juego interior con juguetes suaves (sesiones cortas frecuentes)' : 'Paseos diarios de 30-40 minutos',
            isSenior ? 'Juegos de interior de bajo impacto' : isYoung ? 'Entrenamiento y socialización de cachorros' : 'Juego interactivo y juegos de interior',
            isSenior ? 'Actividades suaves de estimulación mental' : isYoung ? 'Exploración y aprendizaje seguros' : 'Agilidad interior o entrenamiento de trucos',
          ]) : isCat ?
          (hasGarden ? [
            isSenior ? 'Juego suave de interior con varitas de plumas' : isYoung ? 'Exploración exterior supervisada' : 'Tiempo en recinto exterior seguro',
            isSenior ? 'Sesiones de juego cortas con juguetes suaves' : isYoung ? 'Juguetes interactivos y rompecabezas para gatitos' : 'Árboles para escalar y perchas en ventanas',
            isSenior ? 'Lugares cómodos y cálidos para descansar' : isYoung ? 'Socialización y exploración' : 'Juguetes interactivos de simulación de caza',
          ] : [
            isSenior ? 'Juego interactivo suave con juguetes de plumas durante 10-15 minutos' : isYoung ? 'Sesiones de juego frecuentes con pelotas suaves' : 'Juego activo diario de 20-30 minutos con varitas de plumas',
            isSenior ? 'Múltiples lugares para descansar a diferentes alturas' : isYoung ? 'Práctica de escalada y salto en árboles para gatos' : 'Espacios verticales y árboles para gatos',
            isSenior ? 'Alimentadores de rompecabezas de baja intensidad' : isYoung ? 'Juegos de perseguir con juguetes móviles' : 'Varitas de plumas interactivas y juegos de escondite',
          ]) : isFish ? [
            'Mantener temperatura y calidad óptima del agua',
            'Proporcionar escondites y decoraciones para enriquecimiento',
            'Mantenimiento regular del acuario (cambios semanales de agua)',
          ] : isBird ? [
            'Tiempo diario de vuelo fuera de jaula en área segura supervisada',
            'Juguetes de forrajeo y alimentadores puzzle para estimulación mental',
            'Interacción social y sesiones de entrenamiento',
          ] : isRabbit ? [
            'Mínimo 3-4 horas diarias de ejercicio fuera de la jaula',
            'Túneles, cajas y plataformas para exploración',
            'Juguetes seguros para masticar y cajas de excavación',
          ] : isReptile ? [
            'Configuración adecuada de iluminación para tomar sol y UVB',
            'Gradiente de temperatura en el recinto',
            'Enriquecimiento apropiado para la especie (lugares para trepar, escondites)',
          ] : [
            `Ejercicio apropiado para ${data.pet_type}`,
            'Enriquecimiento ambiental',
            'Actividades de estimulación mental',
          ],
        veterinary_care: isFish ?
          `Pruebas regulares de agua para pH, amoníaco, nitritos y nitratos. Monitorea signos de enfermedad (manchas, letargo, pérdida de apetito). Cuarentena de peces nuevos antes de añadirlos al tanque. Consulta veterinario acuático para necesidades específicas de ${data.breed}.` :
          isBird ?
          `Exámenes veterinarios aviares anuales. Monitorea excrementos, plumas y respiración diariamente. Corte de uñas y pico según necesidad. Observa signos de enfermedad (plumas erizadas, letargo). Las aves ocultan enfermedades bien - intervención temprana crucial.` :
          isRabbit ?
          `Exámenes de bienestar anuales. Revisiones dentales cada 6 meses (los dientes crecen continuamente). Esterilización recomendada a los 6 meses. Monitorea estasis gastrointestinal (emergencia médica). Aseo regular y corte de uñas.` :
          isReptile ?
          `Encuentra veterinario especializado en reptiles. Revisiones de salud anuales. Pruebas fecales de parásitos. Monitorea peso, actividad y muda. Mantén humedad y temperatura apropiadas. Muchas enfermedades de reptiles están relacionadas con el cuidado del hábitat.` :
          isSenior ?
          'Las mascotas senior necesitan chequeos semestrales. Análisis de sangre regulares para monitorear función de órganos. El cuidado dental es crucial. Observa signos de artritis, pérdida de visión/audición y deterioro cognitivo. La detección temprana de condiciones relacionadas con la edad mejora la calidad de vida.' :
          isYoung ?
          'Las mascotas jóvenes necesitan series de vacunación inicial (6-16 semanas). Protocolos de desparasitación. Consulta sobre esterilización alrededor de los 6 meses. Chequeos de bienestar frecuentes durante el primer año. Establece rutina de cuidado preventivo temprano.' :
          `Los exámenes anuales de bienestar son esenciales para ${data.pet_type}. Mantén las vacunas al día cuando corresponda. Monitorea problemas de salud específicos de la especie. Establece métricas de salud de referencia con veterinario especializado.`,
        preventive_care: isDog ? [
          'Prevención mensual de pulgas, garrapatas y gusanos del corazón',
          isSenior ? 'Cepillado suave y cuidado de uñas quincenal' : isYoung ? 'Habituación temprana al aseo y entrenamiento' : 'Cepillado semanal y corte de uñas mensual',
          isSenior ? 'Suplementos articulares y manejo del dolor' : isYoung ? 'Hacer la casa segura para cachorros' : 'Cuidado dental regular y cepillado de dientes',
        ] : isCat ? [
          'Prevención mensual de pulgas (especialmente para acceso exterior)',
          isSenior ? 'Cepillado suave diario' : isYoung ? 'Entrenamiento y mantenimiento de caja de arena' : 'Cepillado semanal y corte de uñas',
          isSenior ? 'Monitoreo regular de función renal' : isYoung ? 'Entrenamiento de rascador' : 'Premios dentales e higiene oral',
        ] : isFish ? [
          'Cambios semanales de 25% del agua',
          'Limpieza y mantenimiento mensual del filtro',
          'Horario diario de alimentación y monitoreo del tanque',
        ] : isBird ? [
          'Limpieza diaria de jaula (bandeja inferior)',
          'Limpieza semanal de perchas y juguetes',
          'Limpieza profunda y desinfección mensual de la jaula',
        ] : isRabbit ? [
          'Limpieza diaria de caja de arena',
          'Limpieza semanal completa de la jaula',
          'Corte regular de uñas cada 4-6 semanas',
        ] : isReptile ? [
          'Limpieza diaria del recinto (manchas)',
          'Reemplazo semanal del sustrato',
          'Limpieza profunda y desinfección mensual',
        ] : [
          `Mantenimiento apropiado del hábitat para ${data.pet_type}`,
          'Monitoreo regular de salud',
          'Prácticas preventivas de higiene',
        ],
        estimated_costs: {
          food: isDog ? (isSenior ? '40-60€' : isYoung ? '45-60€' : '30-50€') :
                isCat ? (isSenior ? '35-55€' : isYoung ? '40-55€' : '25-45€') :
                isFish ? '5-15€' :
                isBird ? '20-40€' :
                isRabbit ? '15-35€' :
                isReptile ? '15-30€' : '20-45€',
          veterinary: isFish ? '10-25€' :
                      isBird ? '15-35€' :
                      isRabbit ? '15-30€' :
                      isReptile ? '15-35€' :
                      isSenior ? '30-40€' : isYoung ? '25-40€' : '10-30€',
          grooming: isDog ? '30-50€' : undefined,
          total: isDog ? (isSenior ? '100-150€' : isYoung ? '105-150€' : '70-130€') :
                 isCat ? (isSenior ? '65-95€' : isYoung ? '65-95€' : '35-75€') :
                 isFish ? '15-40€' :
                 isBird ? '35-75€' :
                 isRabbit ? '30-65€' :
                 isReptile ? '30-65€' : '40-85€',
        },
        cost_tips: isDog ? [
          'Compra alimento premium para perros a granel para ahorrar 15-25%',
          isSenior ? 'Considera seguro para mascotas para problemas de salud senior' : isYoung ? 'Invierte en seguro para cachorros temprano para cobertura de por vida' : 'Compara planes de seguro para mascotas para mejor valor',
          'Aprende aseo básico en casa para reducir costos profesionales',
          'Usa cuidado preventivo para evitar tratamientos de emergencia costosos',
        ] : isCat ? [
          'Compra alimento para gatos en cantidades mayores para descuentos',
          isSenior ? 'Presupuesta para posibles gastos de salud senior' : isYoung ? 'Obtén seguro para gatitos antes de cualquier problema de salud' : 'Evalúa opciones de seguro para mascotas',
          'Asea en casa - los gatos requieren relativamente poco mantenimiento',
          'Previene enfermedad dental para evitar procedimientos costosos',
          'Aprovecha la visita al veterinario para pedir más dosis de antiparasitario y así administrarlas tú en casa la próxima vez, ya que suelen ser unas simples gotas',
        ] : isFish ? [
          'Compra alimento para peces en contenedores grandes para mejor valor',
          'Invierte en filtración de calidad para reducir costos de agua',
          'Aprende a probar parámetros del agua tú mismo',
          'Compra decoraciones y plantas de segunda mano cuando sea seguro',
        ] : isBird ? [
          'Compra pellets y semillas a granel',
          'Cultiva vegetales y hierbas seguras en casa para alimento fresco',
          'Haz juguetes de forrajeo DIY con artículos domésticos seguros',
          'Aprende monitoreo básico de salud para detectar problemas temprano',
        ] : isRabbit ? [
          'Compra heno a granel de proveedores agrícolas',
          'Cultiva verduras seguras para conejos en un pequeño jardín',
          'Haz juguetes DIY de cartón y papel',
          'Aprende a cortar uñas en casa',
        ] : isReptile ? [
          'Compra alimentos congelados a granel si aplica',
          'Invierte en calefacción/iluminación adecuada desde el principio para ahorrar energía',
          'Haz artículos de enriquecimiento DIY cuando sea seguro',
          'Monitorea temperaturas para prevenir problemas de salud',
        ] : [
          `Compra alimento para ${data.pet_type} a granel cuando sea posible`,
          'Invierte en cuidado preventivo y hábitat apropiado',
          'Aprende técnicas de cuidado DIY apropiadas para la especie',
          'Investiga cuidado especializado para evitar errores costosos',
        ],
        shopping_list: isDog ? (isSenior ? [
          {
            name: 'Alimento Hill\'s Science Diet para Perros Senior',
            description: 'Fórmula premium senior con glucosamina y condroitina para salud articular',
          },
          {
            name: 'Suplemento Cosequin para Salud Articular',
            description: 'Apoyo articular recomendado por veterinarios para perros senior',
          },
          {
            name: 'Cama Ortopédica para Perros',
            description: 'Cama de espuma viscoelástica para perros senior con artritis',
          },
          {
            name: 'Multivitamínico para Perros Senior',
            description: 'Suplemento vitamínico apropiado para la edad',
          },
        ] : isYoung ? [
          {
            name: 'Alimento para Cachorros - Marca Premium',
            description: 'Fórmula de crecimiento con DHA para desarrollo cerebral',
          },
          {
            name: 'Pañales de Entrenamiento para Cachorros',
            description: 'Para entrenamiento de casa de cachorros jóvenes',
          },
          {
            name: 'Juguetes Suaves para Cachorros',
            description: 'Juguetes seguros para cachorros en dentición',
          },
          {
            name: 'Champú para Cachorros',
            description: 'Fórmula suave sin lágrimas para perros jóvenes',
          },
        ] : [
          {
            name: `Alimento Premium para Perros ${data.breed}`,
            description: 'Fórmula alta en proteínas con carne real',
          },
          {
            name: 'Juguetes Interactivos para Perros',
            description: 'Estimulación mental y entretenimiento',
          },
          {
            name: 'Cepillo de Aseo',
            description: `Adecuado para el tipo de pelaje de ${data.breed}`,
          },
          {
            name: 'Snacks Dentales',
            description: 'Premios para cuidado dental diario',
          },
        ]) : isCat ? (isSenior ? [
          {
            name: 'Alimento Húmedo para Gatos Senior',
            description: 'Alimento alto en humedad para salud renal',
          },
          {
            name: 'Suplemento Articular para Gatos',
            description: 'Glucosamina y condroitina para gatos mayores',
          },
          {
            name: 'Cama Térmica para Gatos',
            description: 'Cama cálida y cómoda para gatos senior',
          },
          {
            name: 'Vitamina para Gatos Senior',
            description: 'Suplemento apropiado para la edad',
          },
        ] : isYoung ? [
          {
            name: 'Alimento para Gatitos - Marca Premium',
            description: 'Fórmula de crecimiento con nutrientes esenciales',
          },
          {
            name: 'Caja de Arena para Gatitos',
            description: 'Caja de tamaño pequeño para fácil acceso',
          },
          {
            name: 'Juguetes Interactivos para Gatitos',
            description: 'Juguetes estimulantes para gatitos juguetones',
          },
          {
            name: 'Rascador para Gatitos',
            description: 'Entrena hábitos saludables de rascado temprano',
          },
        ] : [
          {
            name: `Alimento Premium para Gatos ${data.breed}`,
            description: 'Fórmula alta en proteínas sin cereales',
          },
          {
            name: 'Fuente de Agua para Gatos',
            description: 'Fomenta la hidratación',
          },
          {
            name: 'Juguetes de Plumas Interactivos',
            description: 'Juego de simulación de caza',
          },
          {
            name: 'Cepillo de Aseo para Gatos',
            description: 'Reduce muda y bolas de pelo',
          },
        ]) : isFish ? [
          {
            name: `Alimento para Peces ${data.breed}`,
            description: 'Escamas o pellets específicos para la especie',
          },
          {
            name: 'Kit de Pruebas de Agua',
            description: 'Pruebas de pH, amoníaco, nitrito, nitrato',
          },
          {
            name: 'Filtro de Acuario',
            description: 'Apropiado para tamaño del tanque',
          },
          {
            name: 'Decoraciones y Plantas para Tanque',
            description: 'Escondites y enriquecimiento',
          },
        ] : isBird ? [
          {
            name: `Pellets para Aves ${data.breed}`,
            description: 'Nutrición completa apropiada para la especie',
          },
          {
            name: 'Hueso de Jibia y Bloque Mineral',
            description: 'Suplemento de calcio y minerales',
          },
          {
            name: 'Juguetes de Forrajeo',
            description: 'Estimulación mental y enriquecimiento',
          },
          {
            name: 'Perchas de Madera Natural',
            description: 'Varios tamaños para salud de las patas',
          },
        ] : isRabbit ? [
          {
            name: 'Heno Timothy (a Granel)',
            description: 'Heno fresco ilimitado esencial',
          },
          {
            name: 'Pellets para Conejos',
            description: 'Altos en fibra, apropiados para la especie',
          },
          {
            name: 'Caja de Arena y Arena Segura',
            description: 'Arena a base de papel o heno',
          },
          {
            name: 'Juguetes para Masticar',
            description: 'Juguetes de madera y heno para salud dental',
          },
        ] : isReptile ? [
          {
            name: `Alimento para ${data.breed}`,
            description: 'Insectos o vegetación apropiados para la especie',
          },
          {
            name: 'Iluminación UVB',
            description: 'Esencial para síntesis de vitamina D3',
          },
          {
            name: 'Fuente de Calor',
            description: 'Lámpara para tomar sol o calentador bajo tanque',
          },
          {
            name: 'Suplemento de Calcio',
            description: 'Con D3 para salud ósea apropiada',
          },
        ] : [
          {
            name: `Alimento Premium para ${data.pet_type}`,
            description: 'Nutrición apropiada para la especie',
          },
          {
            name: 'Configuración de Hábitat Apropiado',
            description: 'Jaula, tanque o recinto de tamaño apropiado',
          },
          {
            name: 'Enriquecimiento Específico para la Especie',
            description: 'Juguetes y actividades para estimulación mental',
          },
          {
            name: 'Suministros de Monitoreo de Salud',
            description: 'Esenciales básicos de cuidado y monitoreo',
          },
        ],
        forbidden_foods: isDog ? [
          { name: 'Chocolate', reason: 'Contiene teobromina, tóxica para perros - causa convulsiones, problemas cardíacos y muerte' },
          { name: 'Uvas y Pasas', reason: 'Pueden causar insuficiencia renal aguda, incluso en pequeñas cantidades' },
          { name: 'Cebollas y Ajo', reason: 'Dañan los glóbulos rojos y pueden causar anemia' },
          { name: 'Xilitol (edulcorante artificial)', reason: 'Causa liberación rápida de insulina, hipoglucemia e insuficiencia hepática' },
          { name: 'Nueces de Macadamia', reason: 'Causan debilidad, vómitos, temblores e hipertermia' },
          { name: 'Alcohol', reason: 'Extremadamente tóxico - causa vómitos, problemas respiratorios, coma y muerte' },
          { name: 'Cafeína', reason: 'Causa hiperactividad, ritmo cardíaco rápido, convulsiones y muerte' },
          { name: 'Aguacate', reason: 'Contiene persina que puede causar vómitos y diarrea' },
          { name: 'Huesos Cocidos', reason: 'Pueden astillarse y causar asfixia o lesiones internas' },
          { name: 'Masa Cruda', reason: 'Se expande en el estómago y produce alcohol durante la fermentación' },
        ] : isCat ? [
          { name: 'Chocolate', reason: 'Contiene teobromina, altamente tóxica para gatos - causa problemas cardíacos y convulsiones' },
          { name: 'Cebollas y Ajo', reason: 'Destruyen los glóbulos rojos y causan anemia hemolítica' },
          { name: 'Uvas y Pasas', reason: 'Pueden causar insuficiencia renal' },
          { name: 'Alcohol', reason: 'Extremadamente peligroso - causa intoxicación severa, coma y muerte' },
          { name: 'Cafeína', reason: 'Causa inquietud, respiración rápida, palpitaciones y convulsiones' },
          { name: 'Xilitol', reason: 'Causa insuficiencia hepática e hipoglucemia severa' },
          { name: 'Productos Lácteos', reason: 'La mayoría de los gatos son intolerantes a la lactosa - causa malestar digestivo' },
          { name: 'Pescado Crudo', reason: 'Contiene tiaminasa que destruye la vitamina B1' },
          { name: 'Aves Crudas y Carne Cruda', reason: 'Pueden contener bacterias dañinas como Salmonella y E. coli - causa enfermedad grave' },
          { name: 'Huesos', reason: 'Pueden astillarse y causar asfixia o bloqueo intestinal' },
          { name: 'Comida para Perros', reason: 'Carece de taurina y nutrientes esenciales para gatos' },
        ] : isFish ? [
          { name: 'Pan y Productos Horneados', reason: 'Causa hinchazón y problemas digestivos, sin valor nutricional' },
          { name: 'Alimentos Procesados Humanos', reason: 'Alto en sal, conservantes y aditivos dañinos' },
          { name: 'Carne y Pollo', reason: 'No está nutricionalmente balanceado para peces, contamina el agua' },
          { name: 'Frutas y Verduras', reason: 'La mayoría de las especies no pueden digerir materia vegetal adecuadamente' },
          { name: 'Sobrealimentación', reason: 'Causa obesidad y degrada severamente la calidad del agua' },
        ] : isBird ? [
          { name: 'Aguacate', reason: 'Contiene persina - extremadamente tóxico para aves, causa daño cardíaco y muerte' },
          { name: 'Chocolate', reason: 'Contiene teobromina - causa convulsiones y muerte' },
          { name: 'Cafeína', reason: 'Causa paro cardíaco e hiperactividad' },
          { name: 'Alcohol', reason: 'Extremadamente tóxico - causa insuficiencia orgánica' },
          { name: 'Sal', reason: 'Causa sed excesiva, deshidratación, disfunción renal y muerte' },
          { name: 'Cebollas y Ajo', reason: 'Causan anemia hemolítica y malestar digestivo' },
          { name: 'Semillas de Manzana', reason: 'Contienen compuestos de cianuro' },
          { name: 'Frijoles Crudos', reason: 'Contienen toxina hemaglutinina' },
          { name: 'Huesos de Frutas', reason: 'Contienen cianuro y causan asfixia' },
        ] : isRabbit ? [
          { name: 'Lechuga Iceberg', reason: 'Contiene lactucarium que causa diarrea y problemas de salud' },
          { name: 'Frijoles y Legumbres', reason: 'Causan gases e hinchazón dolorosa' },
          { name: 'Patatas', reason: 'Contienen solanina tóxica, especialmente cuando están verdes o germinadas' },
          { name: 'Chocolate', reason: 'Tóxico para conejos - causa convulsiones y muerte' },
          { name: 'Alimentos Azucarados', reason: 'Alteran las bacterias intestinales y causan problemas digestivos severos' },
          { name: 'Productos Lácteos', reason: 'Los conejos son herbívoros y no pueden digerir lactosa' },
          { name: 'Nueces y Semillas', reason: 'Alto en grasa y causa malestar digestivo' },
          { name: 'Alimentos Procesados Humanos', reason: 'Contienen aditivos dañinos y exceso de sal/azúcar' },
        ] : isReptile ? [
          { name: 'Aguacate', reason: 'Tóxico para muchas especies de reptiles' },
          { name: 'Ruibarbo', reason: 'Contiene ácido oxálico que es tóxico' },
          { name: 'Luciérnagas', reason: 'Extremadamente tóxicas - pueden matar reptiles rápidamente' },
          { name: 'Insectos Capturados en Naturaleza', reason: 'Pueden portar pesticidas y parásitos' },
          { name: 'Alimentos Procesados Humanos', reason: 'Carecen de nutrientes adecuados y contienen aditivos dañinos' },
          { name: 'Productos Lácteos', reason: 'Los reptiles no pueden digerir lactosa' },
          { name: 'Espinaca y Col Rizada (en exceso)', reason: 'Alto en oxalatos que se unen al calcio' },
        ] : [
          { name: 'Chocolate', reason: 'Tóxico para la mayoría de mascotas - contiene teobromina' },
          { name: 'Alcohol', reason: 'Extremadamente peligroso para todos los animales' },
          { name: 'Cafeína', reason: 'Tóxica para la mayoría de mascotas - causa problemas graves de salud' },
          { name: 'Alimentos Procesados Humanos', reason: 'A menudo contienen aditivos dañinos y nutrientes inadecuados' },
          { name: 'Alimentos No Apropiados para la Especie', reason: `Consulte a un veterinario para restricciones dietéticas específicas de ${data.pet_type}` },
        ],
        disclaimer: 'Esta información es solo para fines educativos y no reemplaza el consejo veterinario profesional. Siempre consulte con un veterinario autorizado para problemas médicos y antes de hacer cambios significativos en la dieta o cuidado de su mascota.',
      },
    };

    const currentLanguage = language === 'es' ? 'es' : 'en';
    return JSON.stringify(reportContent[currentLanguage] || reportContent.en);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.petAdvisor.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <PawPrint size={64} color="#10b981" strokeWidth={2} />
          <Text style={styles.questionTitle}>
            {language === 'es'
              ? `Informe personalizado para ${petData.pet_name || 'tu mascota'}`
              : `Personalized report for ${petData.pet_name || 'your pet'}`}
          </Text>

          {petData.pet_type && (
            <View style={styles.petSummary}>
              <Text style={styles.petSummaryTitle}>
                {language === 'es' ? 'Información de tu mascota:' : 'Your pet information:'}
              </Text>
              <Text style={styles.petSummaryItem}>
                {language === 'es' ? '🐾 Tipo: ' : '🐾 Type: '}{petData.pet_type}
              </Text>
              {petData.breed && (
                <Text style={styles.petSummaryItem}>
                  {language === 'es' ? '🏷️ Raza: ' : '🏷️ Breed: '}{petData.breed}
                </Text>
              )}
              <Text style={styles.petSummaryItem}>
                {language === 'es' ? '🎂 Edad: ' : '🎂 Age: '}{petData.age} {language === 'es' ? 'años' : 'years'}
              </Text>
              <Text style={styles.petSummaryItem}>
                {language === 'es' ? '📍 Ubicación: ' : '📍 Location: '}{petData.location}
              </Text>
              {petData.additional_info && (
                <Text style={styles.petSummaryItem}>
                  {language === 'es' ? '📝 Notas: ' : '📝 Notes: '}{petData.additional_info}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleGenerateClick}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Sparkles size={24} color="#ffffff" strokeWidth={2} />
                <Text style={styles.nextButtonText}>
                  {language === 'es' ? 'Generar informe completo' : 'Generate full report'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t.petAdvisor.aboutTitle}</Text>
          <Text style={styles.infoText}>
            {t.petAdvisor.aboutDescription}
          </Text>
          <Text style={styles.infoText}>• {t.petAdvisor.feature1}</Text>
          <Text style={styles.infoText}>• {t.petAdvisor.feature2}</Text>
          <Text style={styles.infoText}>• {t.petAdvisor.feature3}</Text>
          <Text style={styles.infoText}>• {t.petAdvisor.feature4}</Text>
          <Text style={styles.infoText}>• {t.petAdvisor.feature5}</Text>
        </View>
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
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    padding: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    margin: 24,
    marginTop: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backStepButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  backStepButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 24,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 6,
  },
  petSummary: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  petSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 12,
  },
  petSummaryItem: {
    fontSize: 15,
    color: '#047857',
    marginBottom: 8,
    lineHeight: 22,
  },
});
