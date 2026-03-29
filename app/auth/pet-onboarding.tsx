import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';

export default function PetOnboardingScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { refreshPetProfile, setPetProfileImmediate } = usePetProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [petType, setPetType] = useState('');
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState(1);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [location, setLocation] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const isSpanish = language === 'es';

  const petTypes = [
    { value: 'perro', labelEs: 'Perro', labelEn: 'Dog' },
    { value: 'gato', labelEs: 'Gato', labelEn: 'Cat' },
    { value: 'ave', labelEs: 'Ave', labelEn: 'Bird' },
    { value: 'conejo', labelEs: 'Conejo', labelEn: 'Rabbit' },
    { value: 'hámster', labelEs: 'Hámster', labelEn: 'Hamster' },
    { value: 'otro', labelEs: 'Otro', labelEn: 'Other' },
  ];

  const isCat = petType.toLowerCase() === 'gato' || petType.toLowerCase() === 'cat';

  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleNext = () => {
    if (step === 1 && !petType.trim()) {
      Alert.alert(
        isSpanish ? 'Campo requerido' : 'Required field',
        isSpanish ? 'Por favor selecciona el tipo de mascota' : 'Please select pet type'
      );
      return;
    }
    if (step === 2 && !petName.trim()) {
      Alert.alert(
        isSpanish ? 'Campo requerido' : 'Required field',
        isSpanish ? 'Por favor ingresa el nombre de tu mascota' : 'Please enter your pet name'
      );
      return;
    }
    if (step === 3 && !isCat && !breed.trim()) {
      Alert.alert(
        isSpanish ? 'Campo requerido' : 'Required field',
        isSpanish ? 'Por favor ingresa la raza o especie' : 'Please enter breed or species'
      );
      return;
    }

    if (step === 2 && isCat) {
      setStep(4);
    } else if (step < 7) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 4 && isCat) {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!postalCode.trim()) {
      Alert.alert(
        isSpanish ? 'Campo requerido' : 'Required field',
        isSpanish ? 'Por favor ingresa el código postal' : 'Please enter postal code'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('[Onboarding] Starting pet profile save...');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }

      console.log('[Onboarding] User ID:', userData.user.id);

      const petProfileData = {
        user_id: userData.user.id,
        pet_name: capitalizeFirst(petName.trim()),
        pet_type: capitalizeFirst(petType),
        breed: isCat ? null : capitalizeFirst(breed.trim()) || null,
        age_years: ageYears,
        additional_info: capitalizeFirst(additionalInfo.trim()) || null,
        location: capitalizeFirst(location.trim()) || null,
        postal_code: postalCode.trim(),
        onboarding_completed: true,
      };

      console.log('[Onboarding Debug] Upserting pet profile:', petProfileData);

      const { data: upsertedProfile, error } = await supabase
        .from('pet_profiles')
        .upsert(petProfileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('[Onboarding Debug] Upsert error:', error);
        throw error;
      }

      console.log('[Onboarding] Pet profile saved successfully:', upsertedProfile);

      console.log('[Onboarding Debug] Setting pet profile in context immediately...');
      setPetProfileImmediate(upsertedProfile);
      console.log('[Onboarding Debug] Pet profile set in context');

      setLoading(false);

      console.log('[Onboarding Debug] Triggering background refresh (non-blocking)...');
      refreshPetProfile().then(() => {
        console.log('[Onboarding Debug] Background refresh completed');
      }).catch((refreshError) => {
        console.error('[Onboarding Debug] Background refresh failed but continuing:', refreshError);
      });

      console.log('[Onboarding Debug] Navigating to /(tabs)/index...');
      router.replace('/(tabs)');
      console.log('[Onboarding Debug] Navigation triggered');
    } catch (error: any) {
      console.error('[Onboarding] Error saving pet profile:', error);
      console.error('[Onboarding Debug] Full error details:', JSON.stringify(error, null, 2));
      setLoading(false);
      Alert.alert(
        isSpanish ? 'Error' : 'Error',
        isSpanish
          ? 'No se pudo guardar el perfil. Inténtalo de nuevo.'
          : 'Could not save profile. Try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          {(isCat ? [1, 2, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7]).map((s, index) => {
            const actualSteps = isCat ? [1, 2, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
            const currentIndex = actualSteps.indexOf(step);
            return (
              <View
                key={`step-${index}`}
                style={[
                  styles.progressDot,
                  index <= currentIndex && styles.progressDotActive,
                ]}
              />
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? '¿Qué mascota tienes?' : 'What pet do you have?'}
            </Text>
            <View style={styles.petTypeGrid}>
              {petTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.petTypeButton,
                    petType === type.value && styles.petTypeButtonActive,
                  ]}
                  onPress={() => setPetType(type.value)}
                >
                  <Text
                    style={[
                      styles.petTypeText,
                      petType === type.value && styles.petTypeTextActive,
                    ]}
                  >
                    {isSpanish ? type.labelEs : type.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? '¿Cómo se llama tu mascota?' : "What's your pet's name?"}
            </Text>
            <TextInput
              style={styles.input}
              value={petName}
              onChangeText={setPetName}
              placeholder={isSpanish ? 'Nombre de tu mascota' : "Your pet's name"}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {step === 3 && !isCat && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? '¿Qué raza o especie es?' : 'What breed or species is it?'}
            </Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder={isSpanish ? 'Ej: Labrador, Pastor Alemán...' : 'E.g: Labrador, German Shepherd...'}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? '¿Cuántos años tiene?' : 'How old is your pet?'}
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.ageValue}>{ageYears} {isSpanish ? 'años' : 'years'}</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${(ageYears / 20) * 100}%` }]} />
                <View style={styles.sliderButtons}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setAgeYears(Math.max(0, ageYears - 1))}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setAgeYears(Math.min(20, ageYears + 1))}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? 'Información adicional' : 'Additional information'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isSpanish
                ? 'Alergias, enfermedades, necesidades especiales, etc.'
                : 'Allergies, diseases, special needs, etc.'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder={isSpanish ? 'Información adicional (opcional)' : 'Additional info (optional)'}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? '¿Dónde vive tu mascota?' : 'Where does your pet live?'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isSpanish
                ? 'Ciudad, pueblo o país'
                : 'City, town or country'}
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={isSpanish ? 'Ej: Madrid, España' : 'E.g: Madrid, Spain'}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {step === 7 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isSpanish ? 'Código postal' : 'Postal code'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isSpanish
                ? 'Para encontrar servicios cerca de ti'
                : 'To find services near you'}
            </Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder={isSpanish ? 'Ej: 28001' : 'E.g: 28001'}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>
              {isSpanish ? 'Atrás' : 'Back'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && styles.nextButtonFull]}
          onPress={step === 7 ? handleSubmit : handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 7
                ? isSpanish
                  ? 'Completar'
                  : 'Complete'
                : isSpanish
                ? 'Siguiente'
                : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  progressDotActive: {
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  petTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  petTypeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minWidth: '47%',
  },
  petTypeButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  petTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  petTypeTextActive: {
    color: '#10b981',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginTop: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    marginTop: 40,
  },
  ageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 32,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 20,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sliderButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
