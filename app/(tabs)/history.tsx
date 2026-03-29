import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Clock, Heart, ArrowLeft, History as HistoryIcon } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { theme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface ScannedProduct {
  id: string;
  barcode: string;
  product_name: string;
  brands: string;
  image_url: string;
  nutriscore_grade: string;
  scanned_at: string;
  ingredients_text: string;
  nutriments: any;
}

export default function HistoryScreen() {
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { favorites } = useFavorites();

  const loadHistory = useCallback(async () => {
    try {
      console.log('[History] Loading history...');
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[History] No user found');
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('scanned_products')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false });

      if (error) {
        console.error('[History] Error loading history:', error);
      } else if (data) {
        console.log('[History] Loaded', data.length, 'products');
        setProducts(data);
      }
    } catch (error) {
      console.error('[History] Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[History] Screen focused, reloading history...');
      loadHistory();
    }, [loadHistory])
  );


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleProductPress = (product: ScannedProduct) => {
    router.push({
      pathname: '/product-result',
      params: {
        barcode: product.barcode,
        product_name: product.product_name,
        brands: product.brands,
        image_url: product.image_url,
        ingredients_text: product.ingredients_text,
        nutriments: JSON.stringify(product.nutriments),
        nutriscore_grade: product.nutriscore_grade,
      },
    });
  };

  const renderProduct = ({ item }: { item: ScannedProduct }) => (
    <TouchableOpacity
      style={styles.productCardWrapper}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <Card variant="elevated" style={styles.productCard}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          {item.brands && (
            <Text style={styles.productBrand} numberOfLines={1}>
              {item.brands}
            </Text>
          )}
          <View style={styles.dateContainer}>
            <Clock size={12} color={theme.colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.dateText}>{formatDate(item.scanned_at)}</Text>
          </View>
        </View>
        {item.nutriscore_grade && (
          <View
            style={[
              styles.scoreBadge,
              {
                backgroundColor:
                  item.nutriscore_grade === 'a' || item.nutriscore_grade === 'b'
                    ? theme.colors.success
                    : item.nutriscore_grade === 'c'
                    ? theme.colors.warning
                    : theme.colors.error,
              },
            ]}
          >
            <Text style={styles.scoreText}>{item.nutriscore_grade.toUpperCase()}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.history.title}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  const renderFavoriteProduct = ({ item }: { item: typeof favorites[0] }) => (
    <TouchableOpacity
      style={styles.productCardWrapper}
      onPress={() => handleFavoritePress(item)}
      activeOpacity={0.7}
    >
      <Card variant="elevated" style={styles.productCard}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          {item.brands && (
            <Text style={styles.productBrand} numberOfLines={1}>
              {item.brands}
            </Text>
          )}
          <View style={styles.dateContainer}>
            <Heart size={12} color={theme.colors.error} strokeWidth={2} fill={theme.colors.error} />
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        {item.nutriscore_grade && (
          <View
            style={[
              styles.scoreBadge,
              {
                backgroundColor:
                  item.nutriscore_grade === 'a' || item.nutriscore_grade === 'b'
                    ? theme.colors.success
                    : item.nutriscore_grade === 'c'
                    ? theme.colors.warning
                    : theme.colors.error,
              },
            ]}
          >
            <Text style={styles.scoreText}>{item.nutriscore_grade.toUpperCase()}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const handleFavoritePress = async (favorite: typeof favorites[0]) => {
    try {
      const { data: productData } = await supabase
        .from('products_cache')
        .select('*')
        .eq('barcode', favorite.barcode)
        .maybeSingle();

      router.push({
        pathname: '/product-result',
        params: {
          barcode: favorite.barcode,
          product_name: productData?.product_name || favorite.product_name,
          brands: productData?.brands || favorite.brands,
          image_url: productData?.image_url || favorite.image_url,
          ingredients_text: productData?.ingredients_text || '',
          nutriments: JSON.stringify(productData?.nutriments || {}),
          nutriscore_grade: productData?.nutriscore_grade || favorite.nutriscore_grade,
          categories: productData?.categories || '',
        },
      });
    } catch (error) {
      console.error('Error loading favorite product:', error);
    }
  };

  const emptyIcon = showFavorites ? Heart : Clock;
  const emptyText = showFavorites
    ? (t.favorites?.empty || 'No favorites yet')
    : t.history.empty;
  const emptySubtext = showFavorites
    ? (t.favorites?.emptyMessage || 'Start adding products to your favorites')
    : t.history.emptyMessage;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {showFavorites && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowFavorites(false)}
            >
              <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {showFavorites ? (t.tabs?.favorites || 'Favoritos') : t.history.title}
            </Text>
            <Text style={styles.subtitle}>
              {showFavorites
                ? (t.favorites?.emptyMessage || 'Tus productos favoritos')
                : t.history.emptyMessage}
            </Text>
          </View>
          {!showFavorites && (
            <TouchableOpacity
              style={styles.favoritesButton}
              onPress={() => setShowFavorites(true)}
            >
              <Heart
                size={20}
                color={theme.colors.error}
                strokeWidth={2}
                fill="none"
              />
            </TouchableOpacity>
          )}
          {showFavorites && (
            <View style={styles.iconBadge}>
              <Heart size={24} color={theme.colors.error} strokeWidth={2} fill={theme.colors.error} />
            </View>
          )}
        </View>
      </View>

      {(showFavorites ? favorites.length === 0 : products.length === 0) ? (
        <EmptyState
          icon={
            emptyIcon === Heart ? (
              <Heart size={64} color={theme.colors.text.tertiary} strokeWidth={1.5} />
            ) : (
              <HistoryIcon size={64} color={theme.colors.text.tertiary} strokeWidth={1.5} />
            )
          }
          title={emptyText}
          description={emptySubtext}
        />
      ) : showFavorites ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
  },
  favoritesButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  productCardWrapper: {
    marginBottom: theme.spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceAlt,
    ...theme.shadows.xs,
  },
  productInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  productName: {
    ...theme.typography.h3,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  productBrand: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    ...theme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scoreText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
