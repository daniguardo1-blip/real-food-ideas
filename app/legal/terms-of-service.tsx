import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.legal.termsOfService}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.ownership}</Text>
          <Text style={styles.paragraph}>{t.legal.ownershipText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.termsIntro}</Text>
          <Text style={styles.paragraph}>{t.legal.termsIntroText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.acceptance}</Text>
          <Text style={styles.paragraph}>{t.legal.acceptanceText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.serviceDescription}</Text>
          <Text style={styles.paragraph}>{t.legal.serviceDescriptionText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.userAccount}</Text>
          <Text style={styles.paragraph}>{t.legal.userAccountText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.userResponsibilities}</Text>
          <Text style={styles.paragraph}>{t.legal.userResponsibilitiesText}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.responsibility1}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.responsibility2}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.responsibility3}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.responsibility4}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.subscriptions}</Text>
          <Text style={styles.paragraph}>{t.legal.subscriptionsText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.advertising}</Text>
          <Text style={styles.paragraph}>{t.legal.advertisingText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.intellectualProperty}</Text>
          <Text style={styles.paragraph}>{t.legal.intellectualPropertyText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.disclaimer}</Text>
          <Text style={styles.paragraph}>{t.legal.disclaimerText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.limitation}</Text>
          <Text style={styles.paragraph}>{t.legal.limitationText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.termination}</Text>
          <Text style={styles.paragraph}>{t.legal.terminationText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.modifications}</Text>
          <Text style={styles.paragraph}>{t.legal.modificationsText}</Text>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>{t.legal.governingLaw}</Text>
          <Text style={styles.paragraph}>{t.legal.governingLawText}</Text>
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
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
});
