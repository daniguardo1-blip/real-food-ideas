import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  preparation: string;
  tip: string;
  created_at: string;
}

export default function FavoriteRecipes() {
  const router = useRouter();
  const { language } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('recipe_favorites')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    Alert.alert(
      language === 'es' ? 'Eliminar receta' : 'Delete recipe',
      language === 'es'
        ? '¿Estás seguro de que quieres eliminar esta receta?'
        : 'Are you sure you want to delete this recipe?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Eliminar' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('recipe_favorites').delete().eq('id', id);

            if (!error) {
              setRecipes(recipes.filter((r) => r.id !== id));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Recetas favoritas' : 'Favorite recipes'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'es'
                ? 'No tienes recetas favoritas aún'
                : 'You have no favorite recipes yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {language === 'es'
                ? 'Guarda recetas que te gusten usando el botón ❤️'
                : 'Save recipes you like using the ❤️ button'}
            </Text>
          </View>
        ) : (
          <View style={styles.recipesList}>
            {recipes.map((recipe) => (
              <View key={recipe.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <TouchableOpacity
                    onPress={() => deleteRecipe(recipe.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} color="#ef4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {language === 'es' ? 'Ingredientes' : 'Ingredients'}
                  </Text>
                  <Text style={styles.sectionContent}>{recipe.ingredients}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {language === 'es' ? 'Preparación' : 'Preparation'}
                  </Text>
                  <Text style={styles.sectionContent}>{recipe.preparation}</Text>
                </View>

                <View style={styles.tipContainer}>
                  <Text style={styles.tipTitle}>
                    {language === 'es' ? '💡 Consejo útil' : '💡 Useful tip'}
                  </Text>
                  <Text style={styles.tipContent}>{recipe.tip}</Text>
                </View>
              </View>
            ))}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
  recipesList: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  tipContainer: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  tipContent: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
