import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SquareCheck as CheckSquare, Square, ShieldCheck } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

export default function ConsentScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const handleAccept = async () => {
    if (!privacyAccepted || !termsAccepted) {
      Alert.alert(t.common.error, t.legal.mustAcceptRequired);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({
            consent_privacy: true,
            consent_terms: true,
            consent_marketing: marketingAccepted,
            consent_date: new Date().toISOString(),
          })
          .eq('id', user.id);

        const { data: petProfile } = await supabase
          .from('pet_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!petProfile || !petProfile.onboarding_completed) {
          router.replace('/auth/pet-onboarding');
        } else {
         router.replace('/(tabs)');
        }
      }
    } catch (error) {
      Alert.alert(t.common.error, t.legal.consentFailed);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShieldCheck size={48} color="#10b981" strokeWidth={2} />
        <Text style={styles.title}>{t.legal.consentTitle}</Text>
        <Text style={styles.subtitle}>{t.legal.consentSubtitle}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
          >
            {privacyAccepted ? (
              <CheckSquare size={24} color="#10b981" strokeWidth={2} />
            ) : (
              <Square size={24} color="#9ca3af" strokeWidth={2} />
            )}
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                {t.legal.acceptPrivacy}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/legal/privacy-policy')}
              >
                <Text style={styles.linkText}>{t.legal.readPrivacy}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            {termsAccepted ? (
              <CheckSquare size={24} color="#10b981" strokeWidth={2} />
            ) : (
              <Square size={24} color="#9ca3af" strokeWidth={2} />
            )}
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                {t.legal.acceptTerms}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/legal/terms-of-service')}
              >
                <Text style={styles.linkText}>{t.legal.readTerms}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setMarketingAccepted(!marketingAccepted)}
          >
            {marketingAccepted ? (
              <CheckSquare size={24} color="#10b981" strokeWidth={2} />
            ) : (
              <Square size={24} color="#9ca3af" strokeWidth={2} />
            )}
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                {t.legal.acceptMarketing}
              </Text>
              <Text style={styles.optionalText}>{t.legal.optional}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t.legal.dataProtection}</Text>
          <Text style={styles.infoText}>{t.legal.dataProtectionText}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            (!privacyAccepted || !termsAccepted) && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={!privacyAccepted || !termsAccepted}
        >
          <Text style={styles.acceptButtonText}>{t.legal.continueButton}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
