// =============================================================================
// AUTH FEATURE - Gestion de l'authentification
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/shared/types';

// Demo user for offline mode
const DEMO_USER: User = {
  id: 'demo-user-id',
  name: 'Utilisateur Demo',
  email: 'demo@cosmo.app',
  premiumTokens: 100,
  premiumWinStreak: 0,
  lastTokenConsumption: new Date().toISOString(),
  autoValidation: false,
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
  email: user.email || '',
  avatar: user.user_metadata?.avatar_url,
  premiumTokens: 0,
  premiumWinStreak: 0,
  lastTokenConsumption: new Date().toISOString(),
  autoValidation: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDemo = user?.email === 'demo@cosmo.app';
  const isAuthenticated = !!user;

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured) {
        const savedDemo = localStorage.getItem('cosmo_demo_session');
        if (savedDemo === 'true') setUser(DEMO_USER);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUser(mapSupabaseUser(session.user));
      } catch (e) {
        console.error('Auth init error:', e);
      }
      setIsLoading(false);
    };

    init();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setIsLoading(false);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase non configuré. Utilisez le mode Demo.' };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { success: false, error: error.message } : { success: true };
    } catch {
      return { success: false, error: 'Erreur de connexion' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase non configuré. Utilisez le mode Demo.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { success: false, error: error.message };
      if (data?.user?.identities?.length === 0) return { success: false, error: 'Email déjà utilisé.' };
      if (data?.user && !data?.session) return { success: true, needsConfirmation: true };
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
    } catch (e) {
      console.error('Google login error:', e);
    }
  }, []);

  const loginAsDemo = useCallback(() => {
    setUser(DEMO_USER);
    localStorage.setItem('cosmo_demo_session', 'true');
  }, []);

  const logout = useCallback(async () => {
    if (isDemo) {
      setUser(null);
      localStorage.removeItem('cosmo_demo_session');
      return;
    }
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isDemo,
      isLoading,
      isSupabaseConfigured,
      login,
      register,
      loginWithGoogle,
      loginAsDemo,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
