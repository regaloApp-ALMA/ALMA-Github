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
  
  // Función auxiliar para limpiar sesión inválida
  clearInvalidSession: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Función auxiliar para limpiar sesión inválida
  clearInvalidSession: async () => {
    try {
      console.log('🧹 Limpiando sesión inválida...');
      await supabase.auth.signOut();
      set({ session: null, user: null, isAuthenticated: false, error: null });
    } catch (error) {
      console.error('Error limpiando sesión:', error);
      // Forzar limpieza del estado incluso si falla el signOut
      set({ session: null, user: null, isAuthenticated: false, error: null });
    }
  },

  // Función auxiliar para crear perfil si no existe (VERSIÓN ROBUSTA)
  ensureProfile: async (userId: string, email: string, name?: string, avatarUrl?: string) => {
    try {
      // Intentar obtener perfil existente
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Si hay error de permisos (42501), intentar crear el perfil directamente
      if (error && error.code === '42501') {
        console.warn('⚠️ Error de permisos al leer perfil, intentando crear...');
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
          console.error('❌ Error creando perfil después de 42501:', insertError);
          // Si falla la creación, esperar un momento y reintentar la lectura
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (retryResult.data) {
            profile = retryResult.data;
          } else {
            return null;
          }
        } else {
          profile = newProfile;
        }
      }
      // Si no existe (PGRST116), crearlo
      else if (error && error.code === 'PGRST116') {
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
          console.error('❌ Error creando perfil:', insertError);
          return null;
        }
        profile = newProfile;
      } 
      // Otros errores
      else if (error) {
        console.error('❌ Error obteniendo perfil:', error);
        return null;
      }

      // Mapear correctamente desde el SQL a UserType
      if (profile) {
        return {
          id: profile.id,
          name: profile.name || email?.split('@')[0] || 'Usuario', // ⚠️ Usar 'name', NO 'full_name'
          email: email,
          avatar_url: profile.avatar_url || undefined,
          bio: profile.bio || undefined,
          phone: profile.phone || undefined,
          location: profile.location || undefined,
          birth_date: profile.birth_date || undefined,
          current_streak: profile.current_streak || 0,
          // ⚠️ max_streak NO existe en el esquema SQL, se calcula dinámicamente si es necesario
          max_streak: profile.current_streak || 0, // Usar current_streak como fallback
          last_interaction_date: profile.last_interaction_date || undefined,
          createdAt: profile.created_at || new Date().toISOString(),
          settings: profile.settings || undefined,
        } as UserType;
      }
      return null;
    } catch (error) {
      console.error('❌ Error en ensureProfile:', error);
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

    // Calcular max_streak localmente (no se guarda en BD porque no existe en el esquema)
    const currentMaxStreak = (currentUser as any).max_streak || 0;
    const newMaxStreak = newStreak > currentMaxStreak ? newStreak : currentMaxStreak;

    set(state => ({
      user: state.user ? {
        ...state.user,
        current_streak: newStreak,
        max_streak: newMaxStreak, // Solo en memoria, no en BD
        last_interaction_date: today
      } as any : null
    }));

    try {
      // ⚠️ IMPORTANTE: Solo actualizar campos que existen en el esquema SQL
      // El esquema tiene: current_streak, last_interaction_date
      // NO tiene: max_streak
      await supabase.from('profiles').update({
        current_streak: newStreak,
        last_interaction_date: today
        // ⚠️ NO incluir max_streak porque no existe en el esquema SQL
      }).eq('id', currentUser.id);
    } catch (error) {
      console.error("Error guardando racha:", error);
    }
  },

  initialize: async () => {
    try {
      // Intentar obtener la sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Si hay error de refresh token inválido, limpiar sesión
      if (sessionError) {
        console.warn('⚠️ Error obteniendo sesión:', sessionError.message);
        
        // Si es error de refresh token inválido, limpiar todo
        if (sessionError.message?.includes('Refresh Token') || 
            sessionError.message?.includes('Invalid Refresh Token') ||
            sessionError.message?.includes('refresh_token_not_found')) {
          await get().clearInvalidSession();
          return;
        }
      }

      if (session) {
        // Verificar que la sesión sea válida
        try {
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
            error: null,
          });
        } catch (profileError: any) {
          console.error('❌ Error obteniendo perfil:', profileError);
          // Si falla, limpiar sesión
          await get().clearInvalidSession();
        }
      } else {
        set({ session: null, user: null, isAuthenticated: false, error: null });
      }
    } catch (error: any) {
      console.error('❌ Error inicializando:', error);
      
      // Si es error de refresh token, limpiar sesión
      if (error?.message?.includes('Refresh Token') || 
          error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('refresh_token_not_found')) {
        await get().clearInvalidSession();
      } else {
        set({ error: error?.message || 'Error al inicializar sesión' });
      }
    }

    // Listener para cambios de autenticación con manejo de errores
    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        if (event === 'SIGNED_OUT' || !session) {
          set({ user: null, session: null, isAuthenticated: false, error: null });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Verificar que la sesión sea válida antes de usarla
          if (session?.user) {
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
              error: null,
            });
          }
        }
      } catch (error: any) {
        console.error('❌ Error en onAuthStateChange:', error);
        
        // Si es error de refresh token, limpiar sesión
        if (error?.message?.includes('Refresh Token') || 
            error?.message?.includes('Invalid Refresh Token') ||
            error?.message?.includes('refresh_token_not_found')) {
          await get().clearInvalidSession();
        }
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