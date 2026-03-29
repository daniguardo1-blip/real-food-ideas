import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  is_subscribed?: boolean;
  subscription_started_at?: string | null;
  subscription_canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnsureProfileResult {
  success: boolean;
  profile: UserProfile | null;
  error: string | null;
  schemaMismatch?: boolean;
}

function isSchemaError(error: any): boolean {
  if (!error) return false;

  const code = error.code || '';
  const message = error.message || '';

  return (
    code === 'PGRST204' ||
    code === '42703' ||
    message.includes('PGRST204') ||
    message.includes('Could not find') ||
    (message.includes('column') && message.includes('does not exist'))
  );
}

function logSupabaseError(context: string, error: any) {
  console.error(`[ensureUserProfile] ${context} ERROR:`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
}

export async function ensureUserProfile(): Promise<EnsureProfileResult> {
  try {
    console.log('[ensureUserProfile] Starting profile check...');

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logSupabaseError('Auth', authError);
      return {
        success: false,
        profile: null,
        error: `Auth error: ${authError.message}`,
      };
    }

    if (!user) {
      console.error('[ensureUserProfile] ❌ No user found');
      return {
        success: false,
        profile: null,
        error: 'No hay usuario autenticado',
      };
    }

    console.log('[ensureUserProfile] ✅ User authenticated:', user.id);

    // Step 1: Try to fetch profile with all fields
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      logSupabaseError('Fetch profile', fetchError);

      if (isSchemaError(fetchError)) {
        console.error('[ensureUserProfile] ⚠️ SCHEMA MISMATCH detected during fetch');
        console.error('[ensureUserProfile] Trying fallback query with minimal columns...');

        // Fallback: try with only guaranteed columns
        const { data: fallbackProfile, error: fallbackFetchError } = await supabase
          .from('profiles')
          .select('id, email, name, created_at, updated_at')
          .eq('id', user.id)
          .maybeSingle();

        if (fallbackFetchError) {
          logSupabaseError('Fallback fetch', fallbackFetchError);
          return {
            success: false,
            profile: null,
            error: `Schema error on fetch: ${fallbackFetchError.message}`,
            schemaMismatch: true,
          };
        }

        if (fallbackProfile) {
          console.log('[ensureUserProfile] ✅ Profile found with fallback query');
          return {
            success: true,
            profile: fallbackProfile as UserProfile,
            error: null,
            schemaMismatch: true,
          };
        }
      } else {
        return {
          success: false,
          profile: null,
          error: `Error al leer el perfil: ${fetchError.message}`,
        };
      }
    }

    if (existingProfile) {
      console.log('[ensureUserProfile] ✅ Profile exists:', existingProfile.id);
      return {
        success: true,
        profile: existingProfile as UserProfile,
        error: null,
      };
    }

    // Step 2: Profile doesn't exist, create minimal safe profile
    console.log('[ensureUserProfile] Profile does not exist, creating minimal profile...');

    const minimalProfile = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || '',
      phone: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(minimalProfile)
      .select('*')
      .single();

    if (insertError) {
      logSupabaseError('Insert minimal profile', insertError);

      if (isSchemaError(insertError)) {
        console.error('[ensureUserProfile] ⚠️ SCHEMA MISMATCH during insert');
        console.error('[ensureUserProfile] Trying super minimal fallback insert...');

        // Super minimal fallback without phone, created_at, updated_at
        const superMinimalProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || '',
        };

        const { data: fallbackCreated, error: fallbackInsertError } = await supabase
          .from('profiles')
          .insert(superMinimalProfile)
          .select('*')
          .single();

        if (fallbackInsertError) {
          logSupabaseError('Fallback insert', fallbackInsertError);
          return {
            success: false,
            profile: null,
            error: `Schema error on insert: ${fallbackInsertError.message}`,
            schemaMismatch: true,
          };
        }

        console.log('[ensureUserProfile] ✅ Profile created with super minimal fallback');
        return {
          success: true,
          profile: fallbackCreated as UserProfile,
          error: null,
          schemaMismatch: true,
        };
      }

      return {
        success: false,
        profile: null,
        error: `Error al crear perfil: ${insertError.message}`,
      };
    }

    console.log('[ensureUserProfile] ✅ Profile created successfully');
    return {
      success: true,
      profile: createdProfile as UserProfile,
      error: null,
    };
  } catch (error: any) {
    console.error('[ensureUserProfile] ❌ Unexpected error:', error);
    return {
      success: false,
      profile: null,
      error: `Error inesperado: ${error?.message || 'Unknown'}`,
    };
  }
}
