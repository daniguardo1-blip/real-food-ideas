import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useCallback } from 'react';
import { lookupProduct } from '@/lib/productLookup';
import { Camera, ScanLine } from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { ensureUserProfile } from '@/lib/ensureUserProfile';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);

      return () => {
        setIsCameraActive(false);
        setScanning(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) {
      setScanning(true);

      try {
        const result = await lookupProduct(data);

        if (result.found && result.product) {
          const product = result.product;

          console.log('[Scanner] 🔍 Product found, ensuring user profile...');
          const profileResult = await ensureUserProfile();

          if (profileResult.success && profileResult.profile) {
            console.log('[Scanner] ✅ Profile ensured, inserting scanned product...');

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
              console.error('[Scanner] ❌ Error getting auth user:', authError);
              Alert.alert(
                language === 'es' ? 'Error' : 'Error',
                language === 'es' ? 'No se pudo verificar el usuario' : 'Could not verify user'
              );
              return;
            }

            console.log('[Scanner] User ID:', user.id);
            console.log('[Scanner] Barcode:', data);

            const { error: insertError } = await supabase.from('scanned_products').upsert({
              user_id: user.id,
              barcode: data,
              product_name: product.product_name || '',
              brands: product.brands || '',
              image_url: product.image_url || '',
              ingredients_text: product.ingredients_text || '',
              nutriments: product.nutriments || {},
              nutriscore_grade: product.nutriscore_grade || '',
              scanned_at: new Date().toISOString(),
            }, { onConflict: 'user_id,barcode' });

            if (insertError) {
              console.error('[Scanner] ❌ Error inserting scanned product:', insertError);
              console.error('[Scanner] Error code:', insertError.code);
              console.error('[Scanner] Error message:', insertError.message);
              console.error('[Scanner] Error details:', insertError.details);
              console.error('[Scanner] Error hint:', insertError.hint);

              Alert.alert(
                t.common.error || 'Error',
                `No se pudo guardar el producto: ${insertError.message}`
              );
            } else {
              console.log('[Scanner] ✅ Successfully inserted scanned product');
            }
          } else {
            console.error('[Scanner] ⚠️ Could not ensure profile:', profileResult.error);
            Alert.alert(
              t.common.error || 'Error',
              profileResult.error || 'No se pudo verificar tu perfil'
            );
          }

          router.push({
            pathname: '/product-result',
            params: {
              barcode: data,
              product_name: product.product_name || 'Unknown Product',
              brands: product.brands || '',
              image_url: product.image_url || '',
              ingredients_text: product.ingredients_text || '',
              nutriments: JSON.stringify(product.nutriments || {}),
              nutriscore_grade: product.nutriscore_grade || '',
              categories: product.categories || '',
              source: result.source || '',
              data_confidence: product.data_confidence || 'medium',
              product_type: product.product_type || '',
              is_veterinary_food: product.is_veterinary_food ? 'true' : 'false',
              is_snack: product.is_snack ? 'true' : 'false',
            },
          });
        } else {
          Alert.alert(
            t.productSubmission.title,
            t.productSubmission.message,
            [
              {
                text: t.common.cancel,
                style: 'cancel',
                onPress: () => setScanning(false),
              },
              {
                text: t.productSubmission.addProduct,
                onPress: () => {
                  router.push({
                    pathname: '/product-submission',
                    params: { barcode: data },
                  });
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('[Scanner] ❌ Unexpected error:', error);
        Alert.alert(t.common.error, t.scanner.tryAgain);
      } finally {
        setTimeout(() => setScanning(false), 2000);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.iconCircle}>
            <Camera size={48} color={theme.colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.permissionTitle}>
            {t.scanner.grantPermission}
          </Text>
          <Text style={styles.permissionText}>
            {t.scanner.permissionMessage}
          </Text>
          <Button
            title={t.scanner.grantPermission}
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{t.scanner.title}</Text>
            <Text style={styles.subtitle}>{t.scanner.pointCamera}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.topLeft]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.topRight]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>{t.scanner.pointCamera}</Text>
              {scanning && (
                <View style={styles.scanningIndicator}>
                  <Text style={styles.scanningText}>Escaneando...</Text>
                </View>
              )}
            </View>
          </CameraView>
        )}
      </View>
    </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  cameraContainer: {
    flex: 1,
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: '#000000',
    ...theme.shadows.xl,
    borderWidth: 3,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: theme.borderRadius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: theme.borderRadius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: theme.borderRadius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  scanText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginTop: theme.spacing.xl,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  scanningIndicator: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanningText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.xl,
    borderWidth: 3,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  permissionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  permissionButton: {
    minWidth: 200,
  },
});
