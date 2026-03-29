import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Platform, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { Crown, PawPrint, LogOut, Globe, ChevronRight, Trophy, Calendar, Scale, Trash2, Settings, Heart, Bell, ShoppingCart, TrendingDown, Activity, TriangleAlert as AlertTriangle, History, ChartBar as BarChart3, CreditCard, Camera, User, Mail } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { usePetProfile } from '@/lib/PetProfileContext';
import { Language } from '@/lib/translations';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { petProfile, refreshPetProfile } = usePetProfile();

  const [editPetData, setEditPetData] = useState({
    pet_name: '',
    pet_type: '',
    breed: '',
    age_years: 1,
    additional_info: '',
    location: '',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: t.language.english },
    { code: 'es', name: t.language.spanish },
    { code: 'fr', name: t.language.french },
    { code: 'de', name: t.language.german },
    { code: 'it', name: t.language.italian },
    { code: 'pt', name: t.language.portuguese },
    { code: 'ru', name: t.language.russian },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setProfile({ email: user.email || '' });

        const { data: profilesData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[Profile] Error loading profile:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          });
        } else if (profilesData) {
          setIsSubscribed(profilesData.is_subscribed || false);
        }
      }
    } catch (error) {
      console.error('[Profile] Unexpected error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditPetProfile = () => {
    if (petProfile) {
      setEditPetData({
        pet_name: petProfile.pet_name,
        pet_type: petProfile.pet_type,
        breed: petProfile.breed || '',
        age_years: petProfile.age_years,
        additional_info: petProfile.additional_info || '',
        location: petProfile.location || '',
      });
      setShowEditPetModal(true);
    }
  };

  const savePetProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !petProfile) return;

      const { error } = await supabase
        .from('pet_profiles')
        .update({
          pet_name: editPetData.pet_name,
          pet_type: editPetData.pet_type,
          breed: editPetData.breed || null,
          age_years: editPetData.age_years,
          additional_info: editPetData.additional_info || null,
          location: editPetData.location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshPetProfile();
      setShowEditPetModal(false);
      Alert.alert(
        language === 'es' ? 'Éxito' : 'Success',
        language === 'es' ? 'Perfil de mascota actualizado' : 'Pet profile updated'
      );
    } catch (error) {
      console.error('Error updating pet profile:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo actualizar el perfil' : 'Could not update profile'
      );
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      Alert.alert(t.common.success, t.profile.profileUpdated);
    } catch (error) {
      Alert.alert(t.common.error, 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };


  const handleCancelSubscription = async () => {
    Alert.alert(
      language === 'es' ? 'Cancelar suscripción' : 'Cancel Subscription',
      language === 'es'
        ? '¿Estás seguro de que quieres cancelar tu suscripción?'
        : 'Are you sure you want to cancel your subscription?',
      [
        {
          text: language === 'es' ? 'No' : 'No',
          style: 'cancel',
        },
        {
          text: language === 'es' ? 'Sí, cancelar' : 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    is_subscribed: false,
                    subscription_canceled_at: new Date().toISOString(),
                  })
                  .eq('id', user.id);

                if (updateError) {
                  console.error('[Profile] Error cancelling subscription:', {
                    code: updateError.code,
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint,
                  });
                  Alert.alert(
                    language === 'es' ? 'Error' : 'Error',
                    language === 'es'
                      ? 'No se pudo cancelar la suscripción'
                      : 'Could not cancel subscription'
                  );
                  return;
                }

                setIsSubscribed(false);
                setShowSubscriptionModal(false);
                Alert.alert(
                  language === 'es' ? 'Suscripción cancelada' : 'Subscription Cancelled',
                  language === 'es'
                    ? 'Tu suscripción ha sido cancelada correctamente'
                    : 'Your subscription has been cancelled successfully'
                );
              }
            } catch (error) {
              console.error('[Profile] Unexpected error cancelling subscription:', error);
              Alert.alert(
                language === 'es' ? 'Error' : 'Error',
                language === 'es'
                  ? 'No se pudo cancelar la suscripción'
                  : 'Could not cancel subscription'
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert(t.common.error, 'Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t.profile.deleteAccount,
      t.profile.deleteAccountWarning,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.profile.deleteAccountConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from('profiles').delete().eq('id', user.id);
                await supabase.auth.signOut();
                Alert.alert(t.common.success, t.profile.accountDeleted);
                router.replace('/auth/login');
              }
            } catch (error) {
              Alert.alert(t.common.error, 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
    Alert.alert(t.common.success, t.language.updated);
  };

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          language === 'es' ? 'Permiso necesario' : 'Permission needed',
          language === 'es'
            ? 'Necesitamos acceso a tu galería para subir una foto'
            : 'We need access to your photo library to upload a photo'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        const imageUri = result.assets[0].uri;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const fileExt = imageUri.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `pet-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-images')
          .upload(filePath, arrayBuffer, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) {
          if (uploadError.message.includes('not found')) {
            Alert.alert(
              language === 'es' ? 'Error' : 'Error',
              language === 'es'
                ? 'El almacenamiento de imágenes no está configurado. La foto se guardará temporalmente.'
                : 'Image storage is not configured. Photo will be saved temporarily.'
            );

            await supabase
              .from('pet_profiles')
              .update({ photo_url: imageUri })
              .eq('user_id', user.id);

            await refreshPetProfile();
            setUploadingPhoto(false);
            return;
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pet-images')
          .getPublicUrl(filePath);

        await supabase
          .from('pet_profiles')
          .update({
            photo_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        await refreshPetProfile();

        Alert.alert(
          language === 'es' ? 'Éxito' : 'Success',
          language === 'es' ? 'Foto actualizada correctamente' : 'Photo updated successfully'
        );
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo subir la foto' : 'Could not upload photo'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.profile.title}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.profile.title}</Text>
      </View>

      <View style={styles.content}>
        {petProfile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {language === 'es' ? 'Perfil de mascota' : 'Pet Profile'}
              </Text>
              <TouchableOpacity onPress={openEditPetProfile}>
                <Settings size={20} color="#10b981" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.petProfileCard}>
              <View style={styles.petPhotoContainer}>
                <TouchableOpacity
                  onPress={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  style={styles.petPhotoTouchable}
                >
                  {petProfile.photo_url ? (
                    <Image
                      source={{ uri: petProfile.photo_url }}
                      style={styles.petPhoto}
                    />
                  ) : (
                    <View style={styles.petPhotoPlaceholder}>
                      <PawPrint size={40} color="#10b981" strokeWidth={2} />
                    </View>
                  )}
                  <View style={styles.cameraIconContainer}>
                    <Camera size={18} color="#ffffff" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.petInfoGrid}>
                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>
                    {language === 'es' ? 'Nombre' : 'Name'}
                  </Text>
                  <Text style={styles.petInfoValue}>{petProfile.pet_name}</Text>
                </View>

                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>
                    {language === 'es' ? 'Tipo' : 'Type'}
                  </Text>
                  <Text style={styles.petInfoValue}>{petProfile.pet_type}</Text>
                </View>

                {petProfile.breed && (
                  <View style={styles.petInfoItem}>
                    <Text style={styles.petInfoLabel}>
                      {language === 'es' ? 'Raza' : 'Breed'}
                    </Text>
                    <Text style={styles.petInfoValue}>{petProfile.breed}</Text>
                  </View>
                )}

                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>
                    {language === 'es' ? 'Edad' : 'Age'}
                  </Text>
                  <Text style={styles.petInfoValue}>
                    {petProfile.age_years} {language === 'es' ? 'años' : 'years'}
                  </Text>
                </View>

                {petProfile.location && (
                  <View style={styles.petInfoItem}>
                    <Text style={styles.petInfoLabel}>
                      {language === 'es' ? 'Ubicación' : 'Location'}
                    </Text>
                    <Text style={styles.petInfoValue}>{petProfile.location}</Text>
                  </View>
                )}

                {petProfile.additional_info && (
                  <View style={[styles.petInfoItem, styles.petInfoItemFull]}>
                    <Text style={styles.petInfoLabel}>
                      {language === 'es' ? 'Información adicional' : 'Additional Info'}
                    </Text>
                    <Text style={styles.petInfoValue}>{petProfile.additional_info}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Información del dueño' : 'Owner Information'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.profile.email}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Suscripción' : 'Subscription'}
          </Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowSubscriptionModal(true)}
          >
            <View style={styles.languageButtonLeft}>
              <CreditCard size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.languageButtonText}>
                {language === 'es' ? 'Gestionar suscripción' : 'Manage Subscription'}
              </Text>
            </View>
            <ChevronRight size={24} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language.name}</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.languageButtonLeft}>
              <Globe size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.languageButtonText}>
                {languages.find((l) => l.code === language)?.name || 'English'}
              </Text>
            </View>
            <ChevronRight size={24} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.legalSection}</Text>

          <TouchableOpacity
            style={styles.legalButton}
            onPress={() => router.push('/legal/privacy-policy')}
          >
            <Text style={styles.legalButtonText}>{t.legal.privacyPolicy}</Text>
            <ChevronRight size={20} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalButton}
            onPress={() => router.push('/legal/terms-of-service')}
          >
            <Text style={styles.legalButtonText}>{t.legal.termsOfService}</Text>
            <ChevronRight size={20} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" strokeWidth={2} />
          <Text style={styles.signOutText}>{t.auth.signOut}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSubscriptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subscriptionModalContent}>
            <Text style={styles.modalTitle}>
              {language === 'es' ? 'Gestionar suscripción' : 'Manage Subscription'}
            </Text>

            {isSubscribed ? (
              <View>
                <View style={styles.subscriptionStatusContainer}>
                  <CreditCard size={48} color="#10b981" strokeWidth={1.5} />
                  <Text style={styles.subscriptionStatusText}>
                    {language === 'es'
                      ? 'Estás suscrito a los informes detallados por 1,99€/mes.'
                      : 'You are subscribed to detailed reports for €1.99/month.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cancelSubscriptionButton}
                  onPress={handleCancelSubscription}
                >
                  <Text style={styles.cancelSubscriptionText}>
                    {language === 'es' ? 'Cancelar suscripción' : 'Cancel Subscription'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSubscriptionModal(false)}
                >
                  <Text style={styles.modalCloseText}>
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.noSubscriptionText}>
                  {language === 'es'
                    ? 'No tienes una suscripción activa.'
                    : 'You do not have an active subscription.'}
                </Text>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSubscriptionModal(false)}
                >
                  <Text style={styles.modalCloseText}>
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.language.select}</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    language === lang.code && styles.languageOptionTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditPetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditPetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editPetModalContent}>
            <Text style={styles.modalTitle}>
              {language === 'es' ? 'Editar perfil de mascota' : 'Edit Pet Profile'}
            </Text>

            <ScrollView style={styles.editPetForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Nombre' : 'Name'}</Text>
                <TextInput
                  style={styles.input}
                  value={editPetData.pet_name}
                  onChangeText={(text) => setEditPetData({ ...editPetData, pet_name: text })}
                  placeholder={language === 'es' ? 'Nombre de tu mascota' : "Pet's name"}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Tipo' : 'Type'}</Text>
                <TextInput
                  style={styles.input}
                  value={editPetData.pet_type}
                  onChangeText={(text) => setEditPetData({ ...editPetData, pet_type: text })}
                  placeholder={language === 'es' ? 'Perro, Gato, etc.' : 'Dog, Cat, etc.'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Raza (opcional)' : 'Breed (optional)'}</Text>
                <TextInput
                  style={styles.input}
                  value={editPetData.breed}
                  onChangeText={(text) => setEditPetData({ ...editPetData, breed: text })}
                  placeholder={language === 'es' ? 'Raza o especie' : 'Breed or species'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Edad (años)' : 'Age (years)'}</Text>
                <View style={styles.ageSlider}>
                  <TouchableOpacity
                    style={styles.ageButton}
                    onPress={() => setEditPetData({ ...editPetData, age_years: Math.max(0, editPetData.age_years - 1) })}
                  >
                    <Text style={styles.ageButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.ageText}>{editPetData.age_years}</Text>
                  <TouchableOpacity
                    style={styles.ageButton}
                    onPress={() => setEditPetData({ ...editPetData, age_years: Math.min(20, editPetData.age_years + 1) })}
                  >
                    <Text style={styles.ageButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Ubicación' : 'Location'}</Text>
                <TextInput
                  style={styles.input}
                  value={editPetData.location}
                  onChangeText={(text) => setEditPetData({ ...editPetData, location: text })}
                  placeholder={language === 'es' ? 'Ciudad, país' : 'City, country'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{language === 'es' ? 'Información adicional' : 'Additional Info'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editPetData.additional_info}
                  onChangeText={(text) => setEditPetData({ ...editPetData, additional_info: text })}
                  placeholder={language === 'es' ? 'Alergias, enfermedades, etc.' : 'Allergies, diseases, etc.'}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditPetModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={savePetProfile}
              >
                <Text style={styles.confirmButtonText}>
                  {language === 'es' ? 'Guardar' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: theme.colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumCardText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 20,
  },
  petAdvisorButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  petAdvisorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumFeatures: {
    marginBottom: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  priceFrequency: {
    fontSize: 20,
    color: '#6b7280',
    marginLeft: 4,
  },
  upgradeButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  devDeactivateButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  devDeactivateButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '500',
  },
  topFoodsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topFoodsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  topFoodsButtonText: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: '600',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  legalButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  legalButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumFeaturesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  featureButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  featureButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteAccountButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginTop: 12,
  },
  deleteAccountText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subscriptionSettingsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 32,
  },
  premiumModalHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  premiumModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    textAlign: 'center',
  },
  premiumBenefitsList: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  previewSection: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  blurredLine: {
    height: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
    opacity: 0.5,
  },
  blurredLineLast: {
    height: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
    opacity: 0.5,
    width: '70%',
  },
  previewSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  unlockButton: {
    backgroundColor: '#10b981',
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trustMessage: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
    fontWeight: '500',
  },
  devNoticeSection: {
    backgroundColor: '#fef3c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  devNoticeText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumModalCloseButton: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  premiumModalCloseButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  languageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  languageOptionSelected: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  languageOptionText: {
    fontSize: 18,
    color: '#374151',
  },
  languageOptionTextSelected: {
    color: '#065f46',
    fontWeight: '600',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  subscriptionStatusContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  subscriptionStatusText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  cancelSubscriptionButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelSubscriptionText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 32,
    lineHeight: 24,
  },
  modalCloseText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  petProfileCard: {
    gap: 20,
  },
  petPhotoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  petPhotoTouchable: {
    position: 'relative',
  },
  petPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  petPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  petInfoGrid: {
    gap: 16,
  },
  petInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  petInfoItemFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  petInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  petInfoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  editPetModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  editPetForm: {
    maxHeight: 400,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ageSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  ageText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
