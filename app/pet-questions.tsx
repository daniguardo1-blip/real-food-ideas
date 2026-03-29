import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MessageCircle, Send } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';

export default function PetQuestions() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile, loading: profileLoading } = usePetProfile();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContextualAnswer = (userQuestion: string, lang: string): string => {
    const q = userQuestion.toLowerCase();
    const isSpanish = lang === 'es';

    if (q.includes('correa') || q.includes('pasear') && (q.includes('gato') || q.includes('cat'))) {
      return isSpanish
        ? `Sacar a un gato con correa es algo que algunos gatos pueden disfrutar, pero no todos se adaptan bien. Te explico:\n\nNo es necesario:\nA diferencia de los perros, los gatos no necesitan salir a pasear para estar saludables. Son felices en espacios interiores bien enriquecidos con juguetes, rascadores y zonas de observación.\n\n¿Puede adaptarse?\nAlgunos gatos, especialmente si se acostumbran desde jóvenes, pueden disfrutar de paseos cortos. Razas activas como bengalíes o siameses suelen adaptarse mejor.\n\nCómo introducirlo:\n1. Usa un arnés específico para gatos (nunca collar).\n2. Deja que se acostumbre al arnés en casa durante varios días.\n3. Empieza con paseos muy cortos en zonas tranquilas.\n4. Deja que el gato marque el ritmo, nunca lo fuerces.\n5. Observa su lenguaje corporal: orejas hacia atrás, cola erizada o maullidos indican estrés.\n\nRiesgos a considerar:\n- Encuentros con perros sueltos pueden asustarlo.\n- Ruidos fuertes (tráfico, obras) pueden causarle pánico.\n- Parásitos o enfermedades en el exterior.\n- Puede desarrollar ansiedad por querer salir constantemente.\n\nAlternativa:\nSi quieres que tenga estímulos del exterior, considera crear un espacio seguro como un catio (patio cerrado para gatos) o ventanas con vistas a pájaros.\n\nEn resumen: no es necesario, pero si tu gato muestra interés y se adapta bien al arnés sin estrés, puedes intentarlo gradualmente en zonas seguras.`
        : `Walking a cat on a leash is something some cats can enjoy, but not all adapt well. Here's what you need to know:\n\nNot necessary:\nUnlike dogs, cats don't need to go for walks to be healthy. They're happy in well-enriched indoor spaces with toys, scratching posts, and observation areas.\n\nCan they adapt?\nSome cats, especially if accustomed from a young age, can enjoy short walks. Active breeds like Bengals or Siamese tend to adapt better.\n\nHow to introduce it:\n1. Use a cat-specific harness (never a collar).\n2. Let them get used to the harness indoors for several days.\n3. Start with very short walks in quiet areas.\n4. Let the cat set the pace, never force them.\n5. Watch their body language: ears back, puffed tail, or meowing indicate stress.\n\nRisks to consider:\n- Encounters with loose dogs can frighten them.\n- Loud noises (traffic, construction) can cause panic.\n- Parasites or diseases outdoors.\n- May develop anxiety from constantly wanting to go out.\n\nAlternative:\nIf you want them to have outdoor stimuli, consider creating a safe space like a catio (enclosed cat patio) or windows with bird views.\n\nIn summary: not necessary, but if your cat shows interest and adapts well to the harness without stress, you can try it gradually in safe areas.`;
    }

    if (q.includes('bamb') || (q.includes('planta') && (q.includes('come') || q.includes('vomit')))) {
      return isSpanish
        ? `Es bastante común que los gatos mordisqueen plantas, incluido el bambú. Te explico lo que está pasando:\n\nPor qué comen plantas:\nAlgunos gatos buscan fibra vegetal de forma instintiva. En la naturaleza, los felinos ingieren pequeñas cantidades de hierba o plantas cuando cazan presas herbívoras. Puede ser por aburrimiento, curiosidad o para ayudar a expulsar bolas de pelo.\n\nSobre el bambú:\nEl bambú verdadero (Bambusoideae) generalmente no es tóxico para gatos, pero puede irritar el estómago si lo ingieren en cantidad. Lo que muchas veces llamamos "bambú de la suerte" (Dracaena) sí puede ser tóxico y causar vómitos, salivación excesiva o debilidad.\n\nVómitos ocasionales:\nSi tu gato vomita ocasionalmente después de comer la planta pero por lo demás está bien (come normal, juega, no tiene diarrea), probablemente sea solo una irritación gástrica leve. Los gatos tienen un reflejo de vómito bastante sensible.\n\nCuándo preocuparse:\nSi el vómito es frecuente (varias veces al día), hay sangre, tu gato está decaído, no come, o muestra otros síntomas, deberías consultar con tu veterinario.\n\nQué hacer:\nColoca la planta fuera de su alcance. Ofrécele hierba gatera o plantas específicas para gatos que son seguras y ayudan con la digestión. Enriquece su entorno con juguetes y actividades para reducir el aburrimiento.\n\nSi los vómitos continúan incluso sin acceso a la planta, es mejor que lo revise un veterinario para descartar otras causas.`
        : `It's quite common for cats to nibble on plants, including bamboo. Here's what's happening:\n\nWhy they eat plants:\nSome cats instinctively seek plant fiber. In nature, felines ingest small amounts of grass or plants when hunting herbivorous prey. It can be due to boredom, curiosity, or to help expel hairballs.\n\nAbout bamboo:\nTrue bamboo (Bambusoideae) is generally not toxic to cats, but can irritate the stomach if ingested in quantity. What we often call "lucky bamboo" (Dracaena) can be toxic and cause vomiting, excessive salivation, or weakness.\n\nOccasional vomiting:\nIf your cat vomits occasionally after eating the plant but is otherwise fine (eating normally, playing, no diarrhea), it's probably just mild gastric irritation. Cats have a quite sensitive vomiting reflex.\n\nWhen to worry:\nIf vomiting is frequent (several times a day), there's blood, your cat is lethargic, not eating, or showing other symptoms, you should consult your veterinarian.\n\nWhat to do:\nPlace the plant out of reach. Offer cat grass or specific plants for cats that are safe and help with digestion. Enrich their environment with toys and activities to reduce boredom.\n\nIf vomiting continues even without access to the plant, it's best to have it checked by a veterinarian to rule out other causes.`;
    }

    if (q.includes('cariño') || q.includes('afecto') || q.includes('poco cariñoso') || q.includes('no me quiere') || q.includes('affection') || q.includes('not affectionate')) {
      return isSpanish
        ? `Cada mascota tiene su propia personalidad, y el nivel de cariño puede variar mucho entre individuos. Aquí te doy algunos consejos para fortalecer vuestro vínculo:\n\nRespeta su personalidad:\nAlgunas mascotas son naturalmente más independientes. No fuerces el contacto físico si no lo buscan. Cada animal tiene sus propios límites y preferencias.\n\nJuego interactivo:\nDedica 15-20 minutos diarios a jugar con juguetes que le gusten. El juego crea vínculos positivos y refuerza la confianza mutua.\n\nRutinas predecibles:\nLas mascotas se sienten más seguras con rutinas. Mantén horarios similares para alimentación, juego y descanso.\n\nRefuerzo positivo:\nPremia con snacks o caricias cuando se acerque voluntariamente a ti. Nunca castigues cuando busque distancia.\n\nLenguaje corporal:\nAprende a leer sus señales. A veces muestran afecto de formas sutiles: ronroneos suaves, parpadeos lentos en gatos, cola relajada en perros.\n\nPaciencia:\nConstruir confianza lleva tiempo, especialmente si es un animal adoptado o ha tenido experiencias previas negativas.\n\nCuándo consultar:\nSi notas un cambio repentino en su comportamiento (de cariñoso a distante), podría indicar malestar o dolor, y sería recomendable una revisión veterinaria.`
        : `Every pet has their own personality, and affection levels can vary greatly between individuals. Here are some tips to strengthen your bond:\n\nRespect their personality:\nSome pets are naturally more independent. Don't force physical contact if they don't seek it. Each animal has their own limits and preferences.\n\nInteractive play:\nSpend 15-20 minutes daily playing with toys they enjoy. Play creates positive bonds and reinforces mutual trust.\n\nPredictable routines:\nPets feel safer with routines. Keep similar schedules for feeding, play, and rest.\n\nPositive reinforcement:\nReward with treats or pets when they approach you voluntarily. Never punish when they seek distance.\n\nBody language:\nLearn to read their signals. Sometimes they show affection in subtle ways: soft purring, slow blinks in cats, relaxed tail in dogs.\n\nPatience:\nBuilding trust takes time, especially if it's an adopted animal or has had negative experiences.\n\nWhen to consult:\nIf you notice a sudden change in behavior (from affectionate to distant), it could indicate discomfort or pain, and a veterinary check would be recommended.`;
    }

    if (q.includes('rasca') || q.includes('rascarse') || q.includes('picor') || q.includes('scratch') || q.includes('itching') || q.includes('itch')) {
      return isSpanish
        ? `El rascado excesivo puede tener varias causas. Vamos a ver las más comunes:\n\nParásitos externos:\nPulgas, garrapatas o ácaros son causas frecuentes. Revisa su pelaje cuidadosamente, especialmente en axilas, orejas y base de la cola. Un solo parásito puede causar mucha irritación.\n\nAlergias:\nPueden ser alimentarias o ambientales (polen, ácaros del polvo, productos de limpieza). Si el picor es estacional, suele ser ambiental. Las alergias alimentarias son menos comunes de lo que se piensa.\n\nPiel seca:\nBaños frecuentes o productos inadecuados pueden resecar la piel. Usa champús específicos para mascotas y no bañes más de lo necesario.\n\nAlimentación:\nAlgunos ingredientes pueden causar reacciones. Si vas a cambiar el alimento, hazlo gradualmente durante 7-10 días.\n\nEstrés o ansiedad:\nA veces el rascado es comportamental. Observa si hay cambios en su entorno o rutina que puedan estar afectándole.\n\nZonas específicas:\nSi se rasca siempre la misma zona, podría haber una herida, infección local o cuerpo extraño clavado.\n\nCuándo ir al veterinario:\n- Rascado intenso que causa heridas o sangrado\n- Pérdida de pelo en zonas concretas\n- Piel enrojecida, con costras, escamas o mal olor\n- Cambios en comportamiento o apetito\n\nMientras tanto, evita que se haga daño (puedes usar un collar isabelino temporal) y mantén su entorno limpio.`
        : `Excessive scratching can have several causes. Let's look at the most common ones:\n\nExternal parasites:\nFleas, ticks, or mites are frequent causes. Check their fur carefully, especially in armpits, ears, and tail base. A single parasite can cause significant irritation.\n\nAllergies:\nCan be food-related or environmental (pollen, dust mites, cleaning products). If itching is seasonal, it's usually environmental. Food allergies are less common than people think.\n\nDry skin:\nFrequent baths or inappropriate products can dry skin. Use pet-specific shampoos and don't bathe more than necessary.\n\nDiet:\nSome ingredients can cause reactions. If changing food, do it gradually over 7-10 days.\n\nStress or anxiety:\nSometimes scratching is behavioral. Observe if there are changes in their environment or routine that may be affecting them.\n\nSpecific areas:\nIf always scratching the same spot, there could be a wound, local infection, or embedded foreign body.\n\nWhen to see a vet:\n- Intense scratching causing wounds or bleeding\n- Hair loss in specific areas\n- Reddened skin with scabs, scales, or bad odor\n- Changes in behavior or appetite\n\nMeanwhile, prevent self-injury (you can use a temporary cone collar) and keep their environment clean.`;
    }

    if (q.includes('vomit') && !q.includes('bamb') && !q.includes('planta')) {
      return isSpanish
        ? `El vómito en mascotas puede tener muchas causas, desde algo leve hasta situaciones que requieren atención veterinaria. Te ayudo a evaluar:\n\nVómito ocasional (1-2 veces, mascota activa):\nPuede ser por comer muy rápido, bolas de pelo en gatos, o haber comido algo que le sentó mal. Si por lo demás está bien, puedes observar.\n\nLo que puedes hacer:\nAyuno de 6-12 horas (solo agua). Después, ofrece pequeñas cantidades de comida blanda (pollo hervido con arroz). Si lo tolera bien, vuelve gradualmente a su dieta normal.\n\nCuándo preocuparse y acudir al veterinario:\n- Vómitos repetidos (más de 2-3 veces en pocas horas)\n- Vómito con sangre (roja o aspecto de posos de café)\n- Vómito acompañado de diarrea, fiebre o letargo\n- Abdomen hinchado o dolor al tocarlo\n- Mascota que no puede retener ni agua\n- Sospecha de haber comido algo tóxico o un objeto extraño\n- Cachorros o animales mayores (son más vulnerables)\n\nEn gatos específicamente:\nSi vomita bolas de pelo ocasionalmente es normal. Si es frecuente, puede necesitar malta para gatos o cepillado más regular.\n\nSi hay alguno de los signos de alarma, no esperes. El vómito persistente puede deshidratar rápidamente a una mascota.`
        : `Vomiting in pets can have many causes, from something mild to situations requiring veterinary attention. Let me help you assess:\n\nOccasional vomiting (1-2 times, active pet):\nMay be from eating too fast, hairballs in cats, or eating something that didn't agree with them. If otherwise fine, you can observe.\n\nWhat you can do:\nFast for 6-12 hours (water only). Then offer small amounts of bland food (boiled chicken with rice). If tolerated well, gradually return to normal diet.\n\nWhen to worry and see a vet:\n- Repeated vomiting (more than 2-3 times in a few hours)\n- Vomit with blood (red or coffee grounds appearance)\n- Vomiting accompanied by diarrhea, fever, or lethargy\n- Swollen abdomen or pain when touched\n- Pet can't keep down even water\n- Suspicion of eating something toxic or a foreign object\n- Puppies or elderly animals (more vulnerable)\n\nIn cats specifically:\nIf they vomit hairballs occasionally it's normal. If frequent, may need cat malt or more regular brushing.\n\nIf any warning signs are present, don't wait. Persistent vomiting can quickly dehydrate a pet.`;
    }

    if (q.includes('come') && (q.includes('caca') || q.includes('heces') || q.includes('poop') || q.includes('feces'))) {
      return isSpanish
        ? `La coprofagia (comer heces) es un comportamiento desagradable pero relativamente común, especialmente en perros. Te explico por qué sucede y cómo manejarlo:\n\nEn perros:\nPuede ser instintivo, especialmente en madres que limpian a sus cachorros. También puede indicar deficiencias nutricionales, parásitos intestinales, o simplemente ser un comportamiento aprendido por aburrimiento o ansiedad.\n\nEn gatos:\nEs menos común pero puede ocurrir en gatos con problemas de comportamiento, estrés, o si viven con otros animales y están "limpiando" el entorno.\n\nQué hacer:\n- Recoge las heces inmediatamente para eliminar la oportunidad.\n- Asegúrate de que su alimentación es completa y de calidad.\n- Descarta parásitos con un análisis veterinario.\n- Aumenta el ejercicio y estimulación mental.\n- Nunca castigues, puede empeorar el comportamiento por ansiedad.\n- Consulta con tu veterinario sobre suplementos enzimáticos o productos disuasorios.\n\nSi es persistente, puede requerir evaluación veterinaria para descartar problemas médicos subyacentes.`
        : `Coprophagia (eating feces) is an unpleasant but relatively common behavior, especially in dogs. Here's why it happens and how to manage it:\n\nIn dogs:\nCan be instinctive, especially in mothers cleaning their puppies. Can also indicate nutritional deficiencies, intestinal parasites, or simply be a learned behavior from boredom or anxiety.\n\nIn cats:\nLess common but can occur in cats with behavioral issues, stress, or if living with other animals and "cleaning" the environment.\n\nWhat to do:\n- Pick up feces immediately to eliminate the opportunity.\n- Ensure their diet is complete and high quality.\n- Rule out parasites with a veterinary test.\n- Increase exercise and mental stimulation.\n- Never punish, it can worsen the behavior through anxiety.\n- Consult your vet about enzyme supplements or deterrent products.\n\nIf persistent, may require veterinary evaluation to rule out underlying medical issues.`;
    }

    if (q.includes('ladra') || q.includes('ladr') || q.includes('bark')) {
      return isSpanish
        ? `Los ladridos excesivos pueden deberse a varias razones. Te ayudo a identificar la causa y cómo abordarlo:\n\nCausas comunes:\n- Aburrimiento o falta de ejercicio\n- Ansiedad por separación\n- Territorialidad o protección\n- Miedo o inseguridad\n- Búsqueda de atención\n- Respuesta a estímulos (otros perros, ruidos, personas)\n\nQué hacer:\n1. Asegura suficiente ejercicio diario según su raza y edad.\n2. Proporciona estimulación mental con juguetes interactivos.\n3. Establece rutinas predecibles que le den seguridad.\n4. No refuerces el ladrido con atención (incluso regañar es atención).\n5. Enséñale el comando "silencio" con refuerzo positivo.\n6. Si ladra cuando te vas, practica salidas cortas y aumenta gradualmente.\n\nCuándo buscar ayuda:\nSi el ladrido es compulsivo, está afectando su calidad de vida, o no mejora con estos cambios, considera trabajar con un etólogo o adiestrador canino.\n\nRecuerda que ladrar es comunicación natural. El objetivo no es eliminar completamente el ladrido, sino que sea apropiado y controlable.`
        : `Excessive barking can be due to several reasons. Let me help you identify the cause and how to address it:\n\nCommon causes:\n- Boredom or lack of exercise\n- Separation anxiety\n- Territoriality or protection\n- Fear or insecurity\n- Attention seeking\n- Response to stimuli (other dogs, noises, people)\n\nWhat to do:\n1. Ensure sufficient daily exercise for their breed and age.\n2. Provide mental stimulation with interactive toys.\n3. Establish predictable routines that give security.\n4. Don't reinforce barking with attention (even scolding is attention).\n5. Teach "quiet" command with positive reinforcement.\n6. If barking when you leave, practice short departures and gradually increase.\n\nWhen to seek help:\nIf barking is compulsive, affecting quality of life, or not improving with these changes, consider working with an animal behaviorist or dog trainer.\n\nRemember barking is natural communication. The goal isn't to eliminate barking completely, but make it appropriate and controllable.`;
    }

    return isSpanish
      ? `Entiendo tu consulta. Aquí tienes algunas orientaciones generales que pueden ayudarte:\n\nObserva el comportamiento de tu mascota en su conjunto: ¿come bien? ¿está activa? ¿juega normalmente? El comportamiento general es un buen indicador de su bienestar.\n\nSi notas cambios significativos en su comportamiento habitual, pérdida de apetito, letargo inusual, o cualquier síntoma físico que te preocupe, es recomendable consultar con tu veterinario. Ellos podrán hacer un examen completo y darte un diagnóstico preciso.\n\nMientras tanto, mantén su rutina habitual de alimentación y actividad, asegúrate de que tenga agua fresca disponible, y observa cualquier patrón o detalle que pueda ser útil para el veterinario.\n\nRecuerda que cada mascota es única y lo que funciona para una puede no funcionar para otra. La observación atenta y el conocimiento de los hábitos normales de tu mascota son las mejores herramientas para detectar cuando algo no va bien.`
      : `I understand your question. Here are some general guidelines that may help:\n\nObserve your pet's overall behavior: are they eating well? Are they active? Playing normally? General behavior is a good indicator of their wellbeing.\n\nIf you notice significant changes in their usual behavior, loss of appetite, unusual lethargy, or any physical symptoms that concern you, it's advisable to consult your veterinarian. They can perform a complete examination and give you an accurate diagnosis.\n\nMeanwhile, maintain their usual feeding and activity routine, ensure they have fresh water available, and note any patterns or details that might be useful for the veterinarian.\n\nRemember that each pet is unique and what works for one may not work for another. Careful observation and knowledge of your pet's normal habits are the best tools for detecting when something isn't right.`;
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setIsGenerating(true);
    setAnswer('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('[PetQuestions] Generating answer with profile:', petProfile);

      let enrichedQuestion = question;
      if (petProfile) {
        const petContext = `[Contexto: ${petProfile.pet_name || 'Mascota'}, ${petProfile.pet_type || ''}, ${petProfile.age_years ? `${petProfile.age_years} años` : ''}, ${petProfile.breed || ''}, ${petProfile.additional_info || ''}] ${question}`;
        console.log('[PetQuestions] Enriched question:', petContext);
        enrichedQuestion = petContext;
      }

      const generatedAnswer = generateContextualAnswer(enrichedQuestion, language);
      setAnswer(generatedAnswer);
    } catch (error) {
      console.error('Error generating answer:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const askAnother = () => {
    setQuestion('');
    setAnswer('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Duda sobre mi mascota' : 'Question about my pet'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <MessageCircle size={48} color="#10b981" strokeWidth={1.5} />
          <Text style={styles.introText}>
            {language === 'es'
              ? 'Coméntame cualquier duda que tengas sobre tu mascota y te la resolvemos.'
              : 'Tell me any question you have about your pet and we\'ll help you resolve it.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            {language === 'es' ? 'Tu consulta' : 'Your question'}
          </Text>
          <TextInput
            style={styles.textArea}
            value={question}
            onChangeText={setQuestion}
            placeholder={
              language === 'es'
                ? 'Escribe aquí tu duda sobre tu mascota...'
                : 'Write your question about your pet here...'
            }
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isGenerating && !answer}
          />

          {!answer && (
            <TouchableOpacity
              style={[styles.submitButton, !question.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isGenerating || !question.trim()}
            >
              {isGenerating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={20} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.submitButtonText}>
                    {language === 'es' ? 'Enviar' : 'Send'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {answer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerTitle}>
              {language === 'es' ? 'Respuesta' : 'Answer'}
            </Text>
            <Text style={styles.answerText}>{answer}</Text>

            <TouchableOpacity style={styles.askAnotherButton} onPress={askAnother}>
              <Text style={styles.askAnotherButtonText}>
                {language === 'es' ? 'Hacer otra consulta' : 'Ask another question'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  introText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  card: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    minHeight: 150,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 16,
  },
  answerText: {
    fontSize: 15,
    color: '#047857',
    lineHeight: 24,
    marginBottom: 20,
  },
  askAnotherButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  askAnotherButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
