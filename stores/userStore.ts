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
  updateStreak: () => Promise<void>; // Acción pública para llamar desde otros stores
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (updates: Partial<UserType>) => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Esta función se llamará SOLO cuando se cree un fruto
  updateStreak: async () => {
    const currentUser = get().user;
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    // Usamos 'any' temporalmente porque last_interaction_date no está en el tipo base UserType aún
    const lastDate = (currentUser as any).last_interaction_date;
    let newStreak = (currentUser as any).current_streak || 0;

    // Si ya sumó hoy, no hacemos nada
    if (lastDate === today) return;

    if (lastDate) {
      const diff = differenceInCalendarDays(new Date(today), new Date(lastDate));
      if (diff === 1) {
        // Fue ayer, suma racha
        newStreak += 1;
      } else {
        // Pasó más de un día, reinicio
        newStreak = 1;
      }
    } else {
      // Primera vez
      newStreak = 1;
    }

    // Actualización optimista (visual instantánea)
    set(state => ({
      user: state.user ? {
        ...state.user,
        current_streak: newStreak,
        last_interaction_date: today
      } as any : null
    }));

    // Guardar en DB
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
        // Intentamos cargar el perfil; si no existe (usuarios antiguos o fallo de trigger),
        // lo creamos en cliente para mantener consistencia.
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No existe perfil: lo creamos manualmente respetando RLS (auth.uid() = id)
          const insertRes = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'Usuario',
              avatar_url: (session.user.user_metadata as any)?.avatar_url || null,
            })
            .select('*')
            .single();

          if (!insertRes.error) {
            profile = insertRes.data;
          }
        }

        set({
          session: profile ? session : null,
          user: profile ? { ...(profile as any), email: session.user.email } as UserType : null,
          isAuthenticated: !!profile,
        });
      } else {
        // No hay sesión: nos aseguramos de limpiar estado
        set({ session: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error inicializando:', error);
    }

    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, session: null, isAuthenticated: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          const insertRes = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'Usuario',
              avatar_url: (session.user.user_metadata as any)?.avatar_url || null,
            })
            .select('*')
            .single();

          if (!insertRes.error) {
            profile = insertRes.data;
          }
        }

        set({
          session: profile ? session : null,
          user: profile ? { ...(profile as any), email: session.user.email } as UserType : null,
          isAuthenticated: !!profile,
        });
      }
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
    set({ isLoading: false });
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name } }
    });
    if (authError) {
      set({ error: authError.message, isLoading: false });
      throw authError;
    }
    set({ isLoading: false });
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  logout: async () => {
    // CORRECCIÓN: Envolvemos en try/catch y limpiamos estado SIEMPRE, falle la red o no.
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
      const redirectUrl = makeRedirectUri({ path: '/auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  }
}));