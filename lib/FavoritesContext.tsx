import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface FavoriteProduct {
  id: string;
  barcode: string;
  product_name: string;
  brands: string;
  image_url: string;
  nutriscore_grade: string;
  created_at: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  isFavorite: (barcode: string) => boolean;
  toggleFavorite: (product: {
    barcode: string;
    product_name: string;
    brands: string;
    image_url: string;
    nutriscore_grade: string;
  }) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[FavoritesContext] Auth state changed:', event);
        const newUserId = session?.user?.id || null;
        setUserId(newUserId);

        if (newUserId) {
          console.log('[FavoritesContext] User logged in, loading favorites for user:', newUserId);
          await loadFavoritesForUser(newUserId);
        } else {
          console.log('[FavoritesContext] User logged out, clearing favorites');
          setFavorites([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [userId]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[FavoritesContext] Initializing user:', user?.id || 'null');
      setUserId(user?.id || null);
      if (user?.id) {
        await loadFavoritesForUser(user.id);
      }
    } catch (error) {
      console.error('[FavoritesContext] Error getting user:', error);
    }
  };

  const loadFavorites = async () => {
    if (!userId) return;
    await loadFavoritesForUser(userId);
  };

  const loadFavoritesForUser = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFavorites(data);
      }
    } catch (error) {
      console.error('[FavoritesContext] Error loading favorites:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('favorites_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newFavorite = payload.new as FavoriteProduct;
          setFavorites(prev => {
            const exists = prev.some(f => f.barcode === newFavorite.barcode);
            if (exists) return prev;
            return [newFavorite, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedFavorite = payload.old as FavoriteProduct;
          setFavorites(prev => prev.filter(f => f.id !== deletedFavorite.id));
        } else if (payload.eventType === 'UPDATE') {
          const updatedFavorite = payload.new as FavoriteProduct;
          setFavorites(prev => prev.map(f => f.id === updatedFavorite.id ? updatedFavorite : f));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const isFavorite = (barcode: string): boolean => {
    return favorites.some(f => f.barcode === barcode);
  };

  const toggleFavorite = async (product: {
    barcode: string;
    product_name: string;
    brands: string;
    image_url: string;
    nutriscore_grade: string;
  }): Promise<boolean> => {
    let currentUserId = userId;

    if (!currentUserId) {
      console.log('[FavoritesContext] toggleFavorite: userId is null, attempting to get current user');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('[FavoritesContext] toggleFavorite: Found authenticated user:', user.id);
          currentUserId = user.id;
          setUserId(user.id);
        } else {
          console.error('[FavoritesContext] toggleFavorite: No authenticated user found');
          throw new Error('User must be logged in');
        }
      } catch (error) {
        console.error('[FavoritesContext] toggleFavorite: Error getting user:', error);
        throw new Error('User must be logged in');
      }
    }

    const existingFavorite = favorites.find(f => f.barcode === product.barcode);
    const isCurrentlyFavorite = !!existingFavorite;

    if (isCurrentlyFavorite) {
      setFavorites(prev => prev.filter(f => f.barcode !== product.barcode));

      try {
        console.log('[FavoritesContext] Removing favorite for barcode:', product.barcode);
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUserId)
          .eq('barcode', product.barcode);

        if (error) throw error;
        console.log('[FavoritesContext] Successfully removed favorite');
        return false;
      } catch (error) {
        console.error('[FavoritesContext] Error removing favorite:', error);
        const tempFavorite: FavoriteProduct = {
          id: existingFavorite.id,
          barcode: product.barcode,
          product_name: product.product_name,
          brands: product.brands,
          image_url: product.image_url,
          nutriscore_grade: product.nutriscore_grade,
          created_at: existingFavorite.created_at,
        };
        setFavorites(prev => [tempFavorite, ...prev]);
        throw error;
      }
    } else {
      const tempFavorite: FavoriteProduct = {
        id: `temp-${Date.now()}`,
        barcode: product.barcode,
        product_name: product.product_name,
        brands: product.brands,
        image_url: product.image_url,
        nutriscore_grade: product.nutriscore_grade,
        created_at: new Date().toISOString(),
      };
      setFavorites(prev => [tempFavorite, ...prev]);

      try {
        console.log('[FavoritesContext] Adding favorite for barcode:', product.barcode);
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUserId,
            barcode: product.barcode,
            product_name: product.product_name,
            brands: product.brands,
            image_url: product.image_url,
            nutriscore_grade: product.nutriscore_grade,
          })
          .select()
          .single();

        if (error) throw error;

        console.log('[FavoritesContext] Successfully added favorite');
        setFavorites(prev => prev.map(f =>
          f.id === tempFavorite.id ? data : f
        ));
        return true;
      } catch (error) {
        console.error('[FavoritesContext] Error adding favorite:', error);
        setFavorites(prev => prev.filter(f => f.id !== tempFavorite.id));
        throw error;
      }
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
