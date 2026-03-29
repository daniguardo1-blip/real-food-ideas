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

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.legal.privacyPolicy}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.ownership}</Text>
          <Text style={styles.paragraph}>{t.legal.ownershipText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.privacyIntro}</Text>
          <Text style={styles.paragraph}>{t.legal.privacyIntroText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.dataCollected}</Text>
          <Text style={styles.paragraph}>{t.legal.dataCollectedText}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataCollected1}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataCollected2}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataCollected3}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataCollected4}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.dataUsage}</Text>
          <Text style={styles.paragraph}>{t.legal.dataUsageText}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataUsage1}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataUsage2}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataUsage3}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.dataUsage4}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.emailUsage}</Text>
          <Text style={styles.paragraph}>{t.legal.emailUsageText}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.emailUsage1}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.emailUsage2}</Text>
          <Text style={styles.paragraph}>{t.legal.emailUsageConsent}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.dataStorage}</Text>
          <Text style={styles.paragraph}>{t.legal.dataStorageText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.dataSecurity}</Text>
          <Text style={styles.paragraph}>{t.legal.dataSecurityText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.userRights}</Text>
          <Text style={styles.paragraph}>{t.legal.userRightsText}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.userRights1}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.userRights2}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.userRights3}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.userRights4}</Text>
          <Text style={styles.bulletPoint}>• {t.legal.userRights5}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.cookies}</Text>
          <Text style={styles.paragraph}>{t.legal.cookiesText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.thirdParty}</Text>
          <Text style={styles.paragraph}>{t.legal.thirdPartyText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.childrenPrivacy}</Text>
          <Text style={styles.paragraph}>{t.legal.childrenPrivacyText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.legal.policyChanges}</Text>
          <Text style={styles.paragraph}>{t.legal.policyChangesText}</Text>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>{t.legal.contact}</Text>
          <Text style={styles.paragraph}>{t.legal.contactText}</Text>
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
