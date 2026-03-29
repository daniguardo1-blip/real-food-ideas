import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Scissors, Send, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import { searchShelters, type Shelter } from '@/lib/googlePlacesService';

export default function PeluqueriasScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { petProfile, loading } = usePetProfile();
  const [location, setLocation] = useState('');
  const [groomers, setGroomers] = useState<Shelter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [usingSavedLocation, setUsingSavedLocation] = useState(false);

  useEffect(() => {
    if (loading) {
      console.log('[Peluquerías] Loading pet profile...');
      return;
    }

    if (profileChecked) return;

    console.log('[Peluquerías] Pet profile loaded:', petProfile);

    const petType = petProfile?.pet_type?.toLowerCase();
    const isDog = petType === 'perro' || petType === 'dog';

    console.log('[Peluquerías] Pet type:', petType, 'Is dog:', isDog);

    if (isDog && (petProfile?.postal_code || petProfile?.location)) {
      const searchLocation = petProfile.postal_code || petProfile.location || '';
      console.log('[Peluquerías] Using saved location:', searchLocation);
      setLocation(searchLocation);
      setUsingSavedLocation(true);
      handleSearchWithLocation(searchLocation);
    } else {
      console.log('[Peluquerías] Not a dog or no location, showing form');
      setUsingSavedLocation(false);
    }

    setProfileChecked(true);
  }, [loading, petProfile, profileChecked]);

  const handleSearchWithLocation = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;

    setIsGenerating(true);
    setGroomers([]);

    try {
      const foundGroomers = await searchShelters(searchLocation, language, 'grooming');
      setGroomers(foundGroomers);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching groomers:', error);
      setGroomers([]);
      setShowResults(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async () => {
    await handleSearchWithLocation(location);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'es' ? 'Peluquerías cerca' : 'Nearby Groomers'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={{ marginTop: 16, color: '#6b7280' }}>
            {language === 'es' ? 'Cargando perfil...' : 'Loading profile...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Peluquerías cerca' : 'Nearby Groomers'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          usingSavedLocation ? (
            <View style={styles.searchContainer}>
              <View style={styles.card}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.searchTitle}>
                  {language === 'es'
                    ? 'Buscando peluquerías cerca de ti...'
                    : 'Searching for groomers near you...'}
                </Text>
                <Text style={styles.locationText}>
                  {language === 'es' ? 'Ubicación: ' : 'Location: '}
                  {location}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.searchContainer}>
              <View style={styles.card}>
                <Scissors size={48} color="#f59e0b" strokeWidth={1.5} />
                <Text style={styles.searchTitle}>
                  {language === 'es' ? '¿Dónde vives?' : 'Where do you live?'}
                </Text>

                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={language === 'es' ? 'Ciudad o código postal' : 'City or postal code'}
                  placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity
                  style={[styles.searchButton, !location.trim() && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={isGenerating || !location.trim()}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Send size={20} color="#ffffff" strokeWidth={2} />
                      <Text style={styles.searchButtonText}>
                        {language === 'es' ? 'Buscar' : 'Search'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.groomersSection}>
              <Text style={styles.sectionTitle}>
                {language === 'es' ? 'Peluquerías caninas cerca de ti' : 'Dog groomers near you'}
              </Text>

              {groomers.length === 0 ? (
                <View style={styles.noResultsCard}>
                  <Scissors size={48} color="#9ca3af" strokeWidth={1.5} />
                  <Text style={styles.noResultsTitle}>
                    {language === 'es'
                      ? 'No se encontraron peluquerías verificadas'
                      : 'No verified groomers found'}
                  </Text>
                  <Text style={styles.noResultsText}>
                    {language === 'es'
                      ? `No se encontraron peluquerías caninas verificadas para "${location}". Intenta buscar con una ubicación más amplia.`
                      : `No verified dog groomers found for "${location}". Try searching with a broader location.`}
                  </Text>
                  <Text style={styles.noResultsSuggestion}>
                    {language === 'es'
                      ? 'Sugerencia: Prueba con la ciudad o provincia más cercana.'
                      : 'Suggestion: Try the nearest city or province.'}
                  </Text>
                </View>
              ) : (
                groomers.map((groomer, index) => (
                  <View key={index} style={styles.groomerCard}>
                    <View style={styles.groomerHeader}>
                      <Scissors size={20} color="#f59e0b" strokeWidth={2} />
                      <Text style={styles.groomerName}>{groomer.name}</Text>
                    </View>
                    <Text style={styles.groomerLocation}>{groomer.location}</Text>
                    {groomer.description && (
                      <Text style={styles.groomerDescription}>{groomer.description}</Text>
                    )}
                    {groomer.website && (
                      <TouchableOpacity
                        style={styles.websiteButton}
                        onPress={() => Linking.openURL(groomer.website!)}
                      >
                        <ExternalLink size={16} color="#f59e0b" strokeWidth={2} />
                        <Text style={styles.websiteText}>
                          {language === 'es' ? 'Visitar web' : 'Visit website'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.searchAgainButton}
                onPress={() => {
                  setShowResults(false);
                  setUsingSavedLocation(false);
                  setLocation('');
                  setGroomers([]);
                }}
              >
                <Text style={styles.searchAgainText}>
                  {language === 'es' ? 'Buscar en otra ubicación' : 'Search in another location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  card: {
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
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  searchButton: {
    width: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
  },
  groomersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  groomerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  groomerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  groomerLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  groomerDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignSelf: 'flex-start',
  },
  websiteText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  noResultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  noResultsSuggestion: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchAgainButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  searchAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
});
