import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface PetProfile {
  id?: string;
  user_id: string;
  pet_name: string;
  pet_type: string;
  breed: string | null;
  age_years: number;
  additional_info: string | null;
  location: string | null;
  postal_code: string | null;
  photo_url: string | null;
  onboarding_completed: boolean;
}

interface PetProfileContextType {
  petProfile: PetProfile | null;
  loading: boolean;
  refreshPetProfile: () => Promise<PetProfile | null>;
  setPetProfileImmediate: (profile: PetProfile | null) => void;
}

const PetProfileContext = createContext<PetProfileContextType>({
  petProfile: null,
  loading: true,
  refreshPetProfile: async () => null,
  setPetProfileImmediate: () => {},
});

export const usePetProfile = () => useContext(PetProfileContext);

export const PetProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPetProfile = async (): Promise<PetProfile | null> => {
    try {
      console.log('[PetProfileContext] Loading pet profile...');
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        console.log('[PetProfileContext] No user found');
        setPetProfile(null);
        setLoading(false);
        return null;
      }

      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[PetProfileContext] Error loading pet profile:', error);
      }

      setPetProfile(data ?? null);
      return data ?? null;
    } catch (error) {
      console.error('[PetProfileContext] Error loading pet profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPetProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setLoading(true);
        loadPetProfile();
      } else if (event === 'SIGNED_OUT') {
        setPetProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshPetProfile = async () => {
    console.log('[PetProfileContext] Refresh requested');
    setLoading(true);
    const profile = await loadPetProfile();
    console.log('[PetProfileContext] Refresh completed');
    return profile;
  };

  const setPetProfileImmediate = (profile: PetProfile | null) => {
    console.log('[PetProfileContext] Setting pet profile immediately:', profile?.pet_name);
    setPetProfile(profile);
    setLoading(false);
  };

  return (
    <PetProfileContext.Provider
      value={{ petProfile, loading, refreshPetProfile, setPetProfileImmediate }}
    >
      {children}
    </PetProfileContext.Provider>
  );
};