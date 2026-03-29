import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Image as ImageIcon, Upload } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

export default function ProductSubmissionScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams();
  const { barcode } = params;

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    if (!productName.trim()) {
      Alert.alert(t.common.error, `${t.productSubmission.productName}: ${t.productSubmission.required}`);
      return false;
    }
    if (!brand.trim()) {
      Alert.alert(t.common.error, `${t.productSubmission.brand}: ${t.productSubmission.required}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t.common.error, 'You must be logged in to submit products');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_submitted_products')
        .insert({
          user_id: user.id,
          product_name: productName.trim(),
          brand: brand.trim(),
          barcode: barcode as string || '',
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        t.common.success,
        t.productSubmission.success,
        [
          {
            text: t.common.ok,
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting product:', error);
      Alert.alert(t.common.error, t.productSubmission.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.productSubmission.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>{t.productSubmission.title}</Text>
          <Text style={styles.messageText}>{t.productSubmission.message}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.productSubmission.productName} *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder={t.productSubmission.productName}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.productSubmission.brand} *</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder={t.productSubmission.brand}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {language === 'es'
                ? 'Solo necesitamos el nombre del producto y la marca. Nuestro sistema buscará automáticamente los ingredientes y valores nutricionales cuando escanees este producto en el futuro.'
                : 'We only need the product name and brand. Our system will automatically search for ingredients and nutritional values when you scan this product in the future.'}
            </Text>
          </View>

          {barcode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.productSubmission.barcode}</Text>
              <View style={styles.barcodeDisplay}>
                <Text style={styles.barcodeText}>{barcode}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Upload size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {submitting ? t.productSubmission.submitting : t.productSubmission.submit}
            </Text>
          </TouchableOpacity>
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
  messageCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    margin: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  barcodeDisplay: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  barcodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
