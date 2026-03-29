import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { PawPrint } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { t, setLanguage } = useLanguage();

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setErrorMessage('');

    console.log('[Login Debug] Raw email input:', email);
    console.log('[Login Debug] Trimmed email:', email.trim());
    console.log('[Login Debug] Lowercase normalized email:', email.trim().toLowerCase());

    if (!email || !password) {
      setErrorMessage(t.auth.fillAllFields);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      console.log('[Login Debug] Email validation FAILED for:', normalizedEmail);
      setErrorMessage(t.auth.validEmail);
      return;
    }

    console.log('[Login Debug] Email validation PASSED for:', normalizedEmail);
    setLoading(true);

    try {
      console.log('[Login] Starting login for email:', normalizedEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (error) {
        console.error('[Login] Auth login error:', error);
        console.error('[Login Debug] Full error details:', JSON.stringify(error, null, 2));
        setLoading(false);
        setErrorMessage(`Login failed: ${error.message}`);
        return;
      }

      console.log('[Login] Auth login successful. User ID:', data.user?.id);

      if (data.user && data.session) {
        console.log('[Login] Checking for profile...');
        const { data: profileRecord, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.error('[Login Debug] Error fetching profile:', {
            code: profileFetchError.code,
            message: profileFetchError.message,
            details: profileFetchError.details,
            hint: profileFetchError.hint,
          });
        }

        console.log('[Login Debug] Profile found:', profileRecord ? 'Yes' : 'No');

        if (!profileRecord) {
          console.log('[Login Debug] No profile found - creating new minimal profile');
          const minimalProfileData = {
            id: data.user.id,
            email: data.user.email || normalizedEmail,
            name: '',
            phone: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase.from('profiles').upsert(minimalProfileData, { onConflict: 'id' });

          if (upsertError) {
            console.error('[Login Debug] Error creating profile:', {
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint,
            });
          }

          console.log('[Login Debug] Profile created with consent. Checking pet profile...');
          const { data: petProfile } = await supabase
            .from('pet_profiles')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .maybeSingle();

          console.log('[Login Debug] Pet profile found:', petProfile ? 'Yes' : 'No');
          console.log('[Login Debug] Onboarding completed:', petProfile?.onboarding_completed);

          setLoading(false);

          if (!petProfile || !petProfile.onboarding_completed) {
            console.log('[Login Debug] Navigating to pet onboarding');
            router.replace('/auth/pet-onboarding');
          } else {
            console.log('[Login Debug] Navigating to tabs');
            router.replace('/(tabs)');
          }
        } else {
          console.log('[Login Debug] Profile exists');


          console.log('[Login Debug] Checking pet profile...');
          const { data: petProfile } = await supabase
            .from('pet_profiles')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .maybeSingle();

          console.log('[Login Debug] Pet profile found:', petProfile ? 'Yes' : 'No');
          console.log('[Login Debug] Onboarding completed:', petProfile?.onboarding_completed);

          setLoading(false);

          if (!petProfile || !petProfile.onboarding_completed) {
            console.log('[Login Debug] Navigating to pet onboarding');
            router.replace('/auth/pet-onboarding');
          } else {
            console.log('[Login Debug] Navigating to tabs');
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      console.error('[Login Debug] Full error details:', JSON.stringify(error, null, 2));
      setLoading(false);
      setErrorMessage(`Login error: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <PawPrint size={64} color="#10b981" strokeWidth={2} fill="#10b981" />
          <Text style={styles.title}>PetFood Scanner</Text>
          <Text style={styles.subtitle}>{t.auth.signInToContinue}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.email}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t.auth.enterEmail}
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.password}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth.enterPassword}
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? t.auth.signingIn : t.auth.login}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>{t.auth.dontHaveAccount}</Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.signupLink}>{t.auth.createAccount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  form: {
    width: '100%',
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
