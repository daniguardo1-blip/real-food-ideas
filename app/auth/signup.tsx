import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Globe, Square, SquareCheck as CheckSquare } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/lib/translations';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: t.language.english },
    { code: 'es', name: t.language.spanish },
    { code: 'fr', name: t.language.french },
    { code: 'de', name: t.language.german },
    { code: 'it', name: t.language.italian },
    { code: 'pt', name: t.language.portuguese },
    { code: 'ru', name: t.language.russian },
  ];

  const handleLanguageChange = async (lang: Language) => {
    setSelectedLanguage(lang);
    await setLanguage(lang);
  };

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setErrorMessage('');
    setSuccessMessage('');

    console.log('[Signup Debug] Raw email input:', email);
    console.log('[Signup Debug] Trimmed email:', email.trim());
    console.log('[Signup Debug] Lowercase normalized email:', email.trim().toLowerCase());
    console.log('[Signup Debug] Email regex test passes:', emailRegex.test(email.trim()));

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage(t.auth.fillAllFields);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      console.log('[Signup Debug] Email validation FAILED for:', normalizedEmail);
      setErrorMessage(t.auth.validEmail);
      return;
    }

    console.log('[Signup Debug] Email validation PASSED for:', normalizedEmail);

    if (password.length < 6) {
      setErrorMessage(t.auth.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.auth.passwordsDoNotMatch);
      return;
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setErrorMessage(t.legal.mustAcceptRequired || 'You must accept the Privacy Policy and Terms of Service.');
      return;
    }

    setLoading(true);

    try {
      console.log('[Signup] Starting signup for email:', normalizedEmail);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        console.error('[Signup] Auth signup error:', error);
        console.error('[Signup Debug] Full error details:', JSON.stringify(error, null, 2));
        setLoading(false);
        setErrorMessage(`Signup failed: ${error.message}`);
        return;
      }

      if (!data.user) {
        console.error('[Signup] No user data returned');
        setLoading(false);
        setErrorMessage(t.auth.accountCreationFailed);
        return;
      }

      console.log('[Signup] Auth signup successful. User ID:', data.user.id);
      console.log('[Signup] Creating minimal profile...');

      const minimalProfileData = {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        name: name.trim(),
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profilesError } = await supabase.from('profiles').upsert(minimalProfileData, { onConflict: 'id' });
      if (profilesError) {
        console.error('[Signup] Error creating profile in database:', {
          code: profilesError.code,
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
        });
        setLoading(false);
        setErrorMessage(`Error creating profile: ${profilesError.message}`);
        return;
      }
      console.log('[Signup] Profile created successfully');

      console.log('[Signup] Signup process completed successfully');
      setLoading(false);
      setSuccessMessage('Cuenta creada correctamente. Ahora inicia sesión.');

      setTimeout(() => {
        router.replace('/auth/login');
      }, 1500);
    } catch (error: any) {
      console.error('[Signup] Unexpected error:', error);
      setLoading(false);
      setErrorMessage(t.auth.accountCreationFailed);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <UserPlus size={48} color="#10b981" strokeWidth={2} />
          <Text style={styles.title}>{t.auth.createAccount}</Text>
          <Text style={styles.subtitle}>{t.auth.joinUs}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.confirmPassword}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t.auth.confirmPasswordPlaceholder}
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Globe size={18} color="#374151" strokeWidth={2} />
              <Text style={styles.label}>{t.language.name}</Text>
            </View>
            <View style={styles.languageGrid}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    selectedLanguage === lang.code && styles.languageButtonSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === lang.code && styles.languageButtonTextSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.consentSection}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                activeOpacity={0.7}
              >
                {acceptedPrivacy ? (
                  <CheckSquare size={24} color="#10b981" strokeWidth={2} />
                ) : (
                  <Square size={24} color="#9ca3af" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>{t.legal.acceptText} </Text>
                <TouchableOpacity onPress={() => router.push('/legal/privacy-policy')}>
                  <Text style={styles.linkText}>{t.legal.privacyPolicy}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.7}
              >
                {acceptedTerms ? (
                  <CheckSquare size={24} color="#10b981" strokeWidth={2} />
                ) : (
                  <Square size={24} color="#9ca3af" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>{t.legal.acceptText} </Text>
                <TouchableOpacity onPress={() => router.push('/legal/terms-of-service')}>
                  <Text style={styles.linkText}>{t.legal.termsOfService}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.registerButton, (loading || successMessage) && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading || !!successMessage}
          >
            <Text style={styles.registerButtonText}>
              {loading ? t.auth.creatingAccount : t.auth.createAccount}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t.auth.alreadyHaveAccount}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>{t.auth.login}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  languageButtonSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageButtonTextSelected: {
    color: '#065f46',
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
  successContainer: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  successText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  consentSection: {
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#10b981',
    lineHeight: 20,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
