import { create } from 'zustand';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserType } from '@/types/user';
import { differenceInCalendarDays } from 'date-fns';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface UserState {
  user: UserType | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updateStreak: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ session: Session | null }>;
  updateUser: (updates: Partial<UserType>) => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  
  // Función auxiliar para crear perfil si no existe
  ensureProfile: (userId: string, email: string, name?: string, avatarUrl?: string) => Promise<UserType | null>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Función auxiliar para crear perfil si no existe (reutilizable)
  ensureProfile: async (userId: string, email: string, name?: string, avatarUrl?: string) => {
    try {
      // Intentar obtener perfil existente
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Si no existe, crearlo
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: name || email?.split('@')[0] || 'Usuario',
            avatar_url: avatarUrl || null,
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creando perfil:', insertError);
          return null;
        }
        profile = newProfile;
      } else if (error) {
        console.error('Error obteniendo perfil:', error);
        return null;
      }

      return profile ? { ...(profile as any), email: email } as UserType : null;
    } catch (error) {
      console.error('Error en ensureProfile:', error);
      return null;
    }
  },

  updateStreak: async () => {
    const currentUser = get().user;
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = (currentUser as any).last_interaction_date;
    let newStreak = (currentUser as any).current_streak || 0;

    if (lastDate === today) return;

    if (lastDate) {
      const diff = differenceInCalendarDays(new Date(today), new Date(lastDate));
      if (diff === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        current_streak: newStreak,
        last_interaction_date: today
      } as any : null
    }));

    try {
      await supabase.from('profiles').update({
        current_streak: newStreak,
        last_interaction_date: today
      }).eq('id', currentUser.id);
    } catch (error) {
      console.error("Error guardando racha:", error);
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const profile = await get().ensureProfile(
          session.user.id,
          session.user.email || '',
          (session.user.user_metadata as any)?.name,
          (session.user.user_metadata as any)?.avatar_url
        );

        set({
          session: profile ? session : null,
          user: profile,
          isAuthenticated: !!profile,
        });
      } else {
        set({ session: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error inicializando:', error);
    }

    // Listener para cambios de autenticación
    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, session: null, isAuthenticated: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await get().ensureProfile(
          session.user.id,
          session.user.email || '',
          (session.user.user_metadata as any)?.name,
          (session.user.user_metadata as any)?.avatar_url
        );

        set({
          session: profile ? session : null,
          user: profile,
          isAuthenticated: !!profile,
        });
      }
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
      // El listener onAuthStateChange actualizará el estado automáticamente
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { name: name },
          emailRedirectTo: undefined // No necesitamos redirección de email
        }
      });

      if (authError) {
        set({ error: authError.message, isLoading: false });
        throw authError;
      }

      // Si el registro devuelve una sesión (sin confirmación de email), crear perfil y actualizar estado
      if (data.session && data.user) {
        const profile = await get().ensureProfile(
          data.user.id,
          data.user.email || email,
          name,
          (data.user.user_metadata as any)?.avatar_url
        );

        set({
          session: profile ? data.session : null,
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
        });

        return { session: profile ? data.session : null };
      } else {
        // Si no hay sesión (aunque no debería pasar con confirmación desactivada), solo esperamos
        set({ isLoading: false });
        return { session: null };
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Error de red al cerrar sesión (ignorable):", error);
    } finally {
      set({ user: null, session: null, isAuthenticated: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      // Usar el scheme correcto para Expo Go
      const redirectUrl = makeRedirectUri({
        scheme: 'myapp',
        path: 'auth/callback',
      });

      console.log('🔵 [Google Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // Permitir que el navegador maneje la redirección
        },
      });

      if (error) {
        console.error('❌ [Google Auth] Error:', error);
        throw error;
      }

      if (data?.url) {
        // Abrir en el navegador y esperar la redirección
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        console.log('🔵 [Google Auth] Result:', result);

        // Si la sesión se completó, el listener onAuthStateChange actualizará el estado
        if (result.type === 'success' && result.url) {
          // Parsear la URL para extraer tokens si es necesario
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken || refreshToken) {
            // La sesión debería actualizarse automáticamente por el listener
            console.log('✅ [Google Auth] Sesión iniciada');
          }
        }
      }
    } catch (error: any) {
      console.error('❌ [Google Auth] Error completo:', error);
      set({ error: error.message || 'Error al iniciar sesión con Google', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));