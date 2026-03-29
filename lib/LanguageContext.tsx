import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKeys } from './translations';
import { supabase } from './supabaseClient';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = '@petfood_scanner_language';

const getDeviceLanguage = (): Language => {
  let deviceLanguage = 'en';

  if (Platform.OS === 'web') {
    deviceLanguage = navigator.language.split('-')[0];
  } else {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    if (locale) {
      deviceLanguage = locale.split('_')[0].split('-')[0];
    }
  }

  const supportedLanguages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru'];
  return supportedLanguages.includes(deviceLanguage as Language)
    ? (deviceLanguage as Language)
    : 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.preferred_language) {
          setLanguageState(data.preferred_language as Language);
        }
      } else {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          setLanguageState(savedLanguage as Language);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const getTranslationsWithFallback = (lang: Language): TranslationKeys => {
    const currentTranslations = translations[lang];
    const fallbackTranslations = translations.en;

    const createDeepProxy = (target: any, fallback: any): any => {
      return new Proxy(target, {
        get(obj, prop) {
          if (obj[prop] !== undefined) {
            if (typeof obj[prop] === 'object' && obj[prop] !== null && !Array.isArray(obj[prop])) {
              return createDeepProxy(obj[prop], fallback?.[prop] || {});
            }
            return obj[prop];
          }

          if (fallback?.[prop] !== undefined) {
            if (typeof fallback[prop] === 'object' && fallback[prop] !== null && !Array.isArray(fallback[prop])) {
              return createDeepProxy({}, fallback[prop]);
            }
            return fallback[prop];
          }

          return String(prop);
        }
      });
    };

    return createDeepProxy(currentTranslations, fallbackTranslations) as TranslationKeys;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslationsWithFallback(language),
  };

  if (!isInitialized) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
