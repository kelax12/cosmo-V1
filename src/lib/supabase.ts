import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a mock client for demo mode when Supabase is not configured
const createMockClient = (): SupabaseClient => {
  console.warn('⚠️ Supabase not configured. Running in demo mode with localStorage.');
  
  // Return a minimal mock that won't crash the app
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file.' } }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file.' } }),
      signInWithOAuth: async () => ({ data: { provider: '', url: '' }, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), data: [], error: null }), data: [], error: null }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }) }),
      delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
    }),
  } as unknown as SupabaseClient;
};

// Export the Supabase client (real or mock)
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockClient();

// Admin client (only if service role key is provided)
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey)
  ? createClient(supabaseUrl!, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
