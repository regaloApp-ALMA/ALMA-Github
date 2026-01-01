import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import colors from '@/constants/colors';

/**
 * Pantalla de callback para OAuth (Google)
 * Esta pantalla recibe la redirección después de autenticarse con Google
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, user, ensureProfile, initialize } = useUserStore();
  const [status, setStatus] = useState('Verificando autenticación...');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const processGoogleAuth = async () => {
      try {
        setStatus('Verificando sesión...');
        
        // Obtener la sesión actual directamente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
          if (mounted) {
            setStatus('Error de autenticación');
            Alert.alert(
              'Error',
              'No se pudo verificar la sesión. Por favor, intenta de nuevo.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth/login')
                }
              ]
            );
          }
          return;
        }

        if (!session?.user) {
          console.warn('⚠️ No hay sesión en callback');
          if (mounted) {
            setStatus('Error de autenticación');
            Alert.alert(
              'Error',
              'No se pudo autenticar. Por favor, intenta de nuevo.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth/login')
                }
              ]
            );
          }
          return;
        }

        setStatus('Creando perfil...');
        
        // Obtener nombre de Google (puede venir como full_name, name, o del email)
        const googleName = (session.user.user_metadata as any)?.full_name || 
                          (session.user.user_metadata as any)?.name ||
                          session.user.email?.split('@')[0] || 
                          'Usuario';
        
        // Crear/obtener perfil directamente
        const profile = await ensureProfile(
          session.user.id,
          session.user.email || '',
          googleName,
          (session.user.user_metadata as any)?.avatar_url
        );

        if (!profile) {
          console.error('❌ No se pudo crear/obtener perfil');
          if (mounted) {
            setStatus('Error creando perfil');
            Alert.alert(
              'Error',
              'No se pudo crear el perfil. Por favor, intenta de nuevo.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth/login')
                }
              ]
            );
          }
          return;
        }

        // IMPORTANTE: Actualizar el estado del store después de crear/obtener el perfil
        // Esto asegura que isAuthenticated se actualice correctamente
        await initialize();

        // Verificar si es usuario nuevo (creado hace menos de 10 segundos)
        const userCreatedAt = profile.createdAt ? new Date(profile.createdAt).getTime() : 0;
        const now = new Date().getTime();
        const isNewUser = (now - userCreatedAt) < 10000;

        if (mounted) {
          setHasProcessed(true);
          setStatus('¡Autenticación exitosa!');
          
          // Esperar un momento para que el estado se actualice
          setTimeout(() => {
            // Redirigir inmediatamente
            router.replace('/(tabs)');
            
            // Mostrar mensaje después de un pequeño delay (no bloqueante)
            setTimeout(() => {
              const message = isNewUser 
                ? '✅ Cuenta creada con Google\n¡Bienvenido a ALMA!'
                : '✅ Inicio de sesión exitoso\n¡Bienvenido de nuevo a ALMA!';
              
              Alert.alert(
                isNewUser ? 'Cuenta creada' : 'Inicio de sesión exitoso',
                message
              );
            }, 300);
          }, 500);
        }
      } catch (error: any) {
        console.error('❌ Error en callback de Google Auth:', error);
        if (mounted) {
          setStatus('Error de autenticación');
          Alert.alert(
            'Error',
            error.message || 'Ocurrió un error durante la autenticación. Por favor, intenta de nuevo.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        }
      }
    };

    // Esperar un momento para que Supabase procese la redirección
    const timer = setTimeout(() => {
      processGoogleAuth();
    }, 800);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [router, ensureProfile, initialize]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});

