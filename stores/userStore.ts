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
        // 🔄 VALIDAR RACHA: Si ha pasado más de 1 día desde la última interacción, la racha debe ser 0
        const today = new Date();
        const lastInteractionDate = profile.last_interaction_date;
        let currentStreak = profile.current_streak || 0;
        let shouldUpdateStreak = false;

        if (lastInteractionDate) {
          // Calcular diferencia de días entre hoy y la última interacción
          const diff = differenceInCalendarDays(today, new Date(lastInteractionDate));
          
          // Si la diferencia es mayor a 1 (ayer no interactuó), la racha debe ser 0
          if (diff > 1) {
            currentStreak = 0;
            shouldUpdateStreak = true;
            console.log(`🔄 Racha caducada: última interacción hace ${diff} días. Resetear a 0.`);
          }
        } else if (currentStreak > 0) {
          // Si no hay fecha de última interacción pero hay racha > 0, resetear
          currentStreak = 0;
          shouldUpdateStreak = true;
          console.log('🔄 Racha caducada: no hay fecha de última interacción. Resetear a 0.');
        }

        // Opcional: Actualizar la BD en segundo plano si detectamos racha caducada
        if (shouldUpdateStreak) {
          // Actualizar en segundo plano sin bloquear la respuesta (usar IIFE async)
          (async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ current_streak: 0 })
                .eq('id', profile.id);
              
              if (error) {
                console.warn('⚠️ Error actualizando racha caducada en BD:', error);
              } else {
                console.log('✅ Racha caducada actualizada en BD');
              }
            } catch (error) {
              console.warn('⚠️ Error actualizando racha caducada en BD:', error);
              // No lanzar error, es opcional
            }
          })();
        }

        return {
          id: profile.id,
          name: profile.name || email?.split('@')[0] || 'Usuario', // ⚠️ Usar 'name', NO 'full_name'
          email: email,
          avatar_url: profile.avatar_url || undefined,
          bio: profile.bio || undefined,
          phone: profile.phone || undefined,
          location: profile.location || undefined,
          birth_date: profile.birth_date || undefined,
          current_streak: currentStreak, // Usar el valor validado (0 si caducó)
          // ⚠️ max_streak NO existe en el esquema SQL, se calcula dinámicamente si es necesario
          // Mantener el máximo histórico: si la racha no está caducada, usar current_streak como max,
          // si está caducada (0), mantener el valor anterior de current_streak como max (último máximo conocido)
          max_streak: shouldUpdateStreak ? (profile.current_streak || 0) : currentStreak,
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
    
    // 🛡️ Si ya interactuó hoy, no hacer nada
    if (lastDate === today) {
      console.log('✅ Ya interactuó hoy, no actualizar racha');
      return;
    }

    // 🛡️ Calcular nueva racha según la diferencia de días
    let newStreak = 1; // Por defecto, empezar en 1 (primera acción hoy)

    if (lastDate) {
      const todayDate = new Date(today);
      const lastDateObj = new Date(lastDate);
      const diff = differenceInCalendarDays(todayDate, lastDateObj);
      
      if (diff === 1) {
        // Ayer interactuó: continuar la racha (+1)
        const currentStreak = (currentUser as any).current_streak || 0;
        newStreak = currentStreak + 1;
        console.log(`✅ Racha continua: ${currentStreak} -> ${newStreak} días`);
      } else if (diff > 1) {
        // No interactuó ayer (o hace más días): resetear a 1
        newStreak = 1;
        console.log(`🔄 Racha reseteada: última interacción hace ${diff} días. Nueva racha: 1`);
      }
      // Si diff === 0 (mismo día), no debería llegar aquí porque ya retornamos arriba
    } else {
      // Primera interacción: empezar en 1
      newStreak = 1;
      console.log('🆕 Primera interacción: racha iniciada en 1');
    }

    // Calcular max_streak localmente (no se guarda en BD porque no existe en el esquema)
    const currentMaxStreak = (currentUser as any).max_streak || 0;
    const newMaxStreak = newStreak > currentMaxStreak ? newStreak : currentMaxStreak;

    // Actualizar estado local
    set(state => ({
      user: state.user ? {
        ...state.user,
        current_streak: newStreak,
        max_streak: newMaxStreak, // Solo en memoria, no en BD
        last_interaction_date: today
      } as any : null
    }));

    // Guardar en BD
    try {
      // ⚠️ IMPORTANTE: Solo actualizar campos que existen en el esquema SQL
      // El esquema tiene: current_streak, last_interaction_date
      // NO tiene: max_streak
      await supabase.from('profiles').update({
        current_streak: newStreak,
        last_interaction_date: today
        // ⚠️ NO incluir max_streak porque no existe en el esquema SQL
      }).eq('id', currentUser.id);
      
      console.log(`✅ Racha guardada: ${newStreak} días`);
    } catch (error) {
      console.error("❌ Error guardando racha:", error);
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      console.log('🔄 [UserStore] Inicializando sesión...');
      
      // Intentar obtener la sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Si hay error de refresh token inválido, limpiar sesión
      if (sessionError) {
        console.warn('⚠️ [UserStore] Error obteniendo sesión:', sessionError.message);
        
        // Si es error de refresh token inválido, limpiar todo
        if (sessionError.message?.includes('Refresh Token') || 
            sessionError.message?.includes('Invalid Refresh Token') ||
            sessionError.message?.includes('refresh_token_not_found')) {
          await get().clearInvalidSession();
          set({ isLoading: false });
          return;
        }
      }

      if (session && session.user) {
        console.log('✅ [UserStore] Sesión encontrada, verificando perfil...');
        // Verificar que la sesión sea válida
        try {
          const profile = await get().ensureProfile(
            session.user.id,
            session.user.email || '',
            (session.user.user_metadata as any)?.name,
            (session.user.user_metadata as any)?.avatar_url
          );

          if (profile) {
            console.log('✅ [UserStore] Perfil obtenido, usuario autenticado');
            set({
              session: session,
              user: profile,
              isAuthenticated: true,
              error: null,
              isLoading: false,
            });
          } else {
            console.warn('⚠️ [UserStore] No se pudo obtener perfil, limpiando sesión');
            await get().clearInvalidSession();
            set({ isLoading: false });
          }
        } catch (profileError: any) {
          console.error('❌ [UserStore] Error obteniendo perfil:', profileError);
          // ⚠️ NO limpiar sesión automáticamente si hay un error temporal
          // Solo limpiar si es un error crítico
          if (profileError?.code === '42501' || profileError?.message?.includes('permission denied')) {
            console.error('❌ [UserStore] Error de permisos, limpiando sesión');
            await get().clearInvalidSession();
          } else {
            // Error temporal, mantener sesión pero marcar como no autenticado
            set({ 
              session: session, 
              user: null, 
              isAuthenticated: false, 
              error: profileError?.message || 'Error obteniendo perfil',
              isLoading: false 
            });
          }
        }
      } else {
        console.log('ℹ️ [UserStore] No hay sesión activa');
        set({ session: null, user: null, isAuthenticated: false, error: null, isLoading: false });
      }
    } catch (error: any) {
      console.error('❌ [UserStore] Error inicializando:', error);
      
      // Si es error de refresh token, limpiar sesión
      if (error?.message?.includes('Refresh Token') || 
          error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('refresh_token_not_found')) {
        await get().clearInvalidSession();
      } else {
        set({ 
          error: error?.message || 'Error al inicializar sesión', 
          isLoading: false 
        });
      }
    }

    // Listener para cambios de autenticación con manejo de errores
    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        console.log('🔵 [Auth State Change] Event:', event, 'Session:', session ? 'exists' : 'null');
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('🔴 [Auth State Change] Usuario deslogueado');
          set({ user: null, session: null, isAuthenticated: false, error: null, isLoading: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Verificar que la sesión sea válida antes de usarla
          if (session?.user) {
            console.log('🟢 [Auth State Change] Usuario autenticado, creando/obteniendo perfil...');
            
            // Obtener nombre de Google (puede venir como full_name, name, o del email)
            const googleName = (session.user.user_metadata as any)?.full_name || 
                              (session.user.user_metadata as any)?.name ||
                              session.user.email?.split('@')[0] || 
                              'Usuario';
            
            const profile = await get().ensureProfile(
              session.user.id,
              session.user.email || '',
              googleName,
              (session.user.user_metadata as any)?.avatar_url
            );

            if (profile) {
              console.log('✅ [Auth State Change] Perfil obtenido, actualizando estado...');
              set({
                session: session,
                user: profile,
                isAuthenticated: true,
                error: null,
                isLoading: false,
              });
              console.log('✅ [Auth State Change] Estado actualizado, isAuthenticated = true');
            } else {
              console.error('❌ [Auth State Change] No se pudo obtener perfil');
              set({ 
                session: null, 
                user: null, 
                isAuthenticated: false, 
                error: 'No se pudo crear el perfil',
                isLoading: false 
              });
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error en onAuthStateChange:', error);
        
        // Si es error de refresh token, limpiar sesión
        if (error?.message?.includes('Refresh Token') || 
            error?.message?.includes('Invalid Refresh Token') ||
            error?.message?.includes('refresh_token_not_found')) {
          await get().clearInvalidSession();
        } else {
          set({ error: error?.message || 'Error en autenticación', isLoading: false });
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
      
      // Actualizar el estado inmediatamente después de un login exitoso
      // El listener onAuthStateChange también actualizará como respaldo
      if (data.session && data.user) {
        const profile = await get().ensureProfile(
          data.user.id,
          data.user.email || email,
          (data.user.user_metadata as any)?.name,
          (data.user.user_metadata as any)?.avatar_url
        );

        set({
          session: profile ? data.session : null,
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false });
      }
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

      // Si el registro devuelve una sesión, crear perfil y actualizar estado
      // (Sin verificación de email, Supabase devuelve sesión directamente)
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
          error: null,
        });

        return { session: profile ? data.session : null };
      } else {
        // Si no hay sesión (caso raro sin verificación de email), intentar obtenerla
        console.warn('⚠️ Registro sin sesión inmediata, intentando obtener sesión...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession && data.user) {
          const profile = await get().ensureProfile(
            data.user.id,
            data.user.email || email,
            name,
            (data.user.user_metadata as any)?.avatar_url
          );

          set({
            session: profile ? currentSession : null,
            user: profile,
            isAuthenticated: !!profile,
            isLoading: false,
            error: null,
          });

          return { session: profile ? currentSession : null };
        }
        
        // Si aún no hay sesión, no hacer auto-login
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
      // 🎯 Determinar el scheme correcto según el entorno
      const redirectUrl = makeRedirectUri({
        path: '/auth/callback',
        scheme: 'alma', // Scheme personalizado para producción
        // En desarrollo, makeRedirectUri usará 'exp' automáticamente
      });

      console.log('🔵 [Google Auth] Redirect URL generada:', redirectUrl);
      console.log('🔵 [Google Auth] IMPORTANTE: Asegúrate de que esta URL esté en Supabase Dashboard > Authentication > URL Configuration > Redirect URLs');
      console.log('🔵 [Google Auth] Para producción, añade también: alma://auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // Permitir que el navegador maneje la redirección
        },
      });

      if (error) {
        console.error('❌ [Google Auth] Error de Supabase:', error);
        let errorMessage = error.message || 'Error al iniciar sesión con Google';
        if (error.message?.includes('network') || error.message?.includes('Network')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
        } else if (error.message?.includes('redirect')) {
          errorMessage = 'Error en la configuración de redirección. Verifica que la URL de redirección esté configurada en Supabase.';
        }
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage);
      }

      if (!data?.url) {
        const errorMsg = 'No se recibió URL de autenticación de Google.';
        console.error('❌ [Google Auth]', errorMsg);
        set({ error: errorMsg, isLoading: false });
        throw new Error(errorMsg);
      }

      // Abrir en el navegador y esperar la redirección
      try {
        console.log('🔵 [Google Auth] Abriendo navegador...');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        console.log('🔵 [Google Auth] Resultado del navegador:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('✅ [Google Auth] Redirección exitosa, procesando...');
          // El listener onAuthStateChange actualizará el estado automáticamente
          // No desactivar isLoading aquí, el listener lo hará cuando actualice el estado
        } else if (result.type === 'cancel') {
          console.log('⚠️ [Google Auth] Usuario canceló la autenticación');
          set({ isLoading: false, error: null });
          return;
        } else if (result.type === 'dismiss') {
          console.log('⚠️ [Google Auth] Navegador cerrado');
          set({ isLoading: false, error: null });
          return;
        } else {
          console.warn('⚠️ [Google Auth] Resultado inesperado:', result);
          set({ isLoading: false });
        }
      } catch (browserError: any) {
        console.error('❌ [Google Auth] Error abriendo navegador:', browserError);
        let errorMessage = 'No se pudo abrir el navegador para autenticación.';
        if (browserError.message?.includes('network') || browserError.message?.includes('Network')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        } else if (browserError.message?.includes('scheme')) {
          errorMessage = 'Error de configuración. Verifica que el scheme de la app esté correctamente configurado.';
        }
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ [Google Auth] Error completo:', error);
      set({ 
        error: error.message || 'Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.', 
        isLoading: false 
      });
      throw error;
    }
  }
}));