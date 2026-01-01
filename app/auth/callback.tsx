import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';

/**
 * Pantalla de callback para OAuth (Google)
 * Esta pantalla recibe la redirección después de autenticarse con Google
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, initialize } = useUserStore();

  useEffect(() => {
    // El listener onAuthStateChange en initialize() actualizará el estado automáticamente
    // Esperar a que isAuthenticated se actualice y redirigir
    let timer: NodeJS.Timeout;
    
    const checkAndRedirect = () => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        // Esperar un poco más si aún no está autenticado
        timer = setTimeout(() => {
          if (isAuthenticated) {
            router.replace('/(tabs)');
          } else {
            // Si después de esperar aún no está autenticado, volver al login
            router.replace('/auth/login');
          }
        }, 2000);
      }
    };

    // Inicializar para forzar verificación de sesión
    initialize().then(() => {
      // Esperar un momento para que el listener actualice el estado
      timer = setTimeout(checkAndRedirect, 1000);
    }).catch((error) => {
      console.error('Error inicializando en callback:', error);
      router.replace('/auth/login');
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, router, initialize]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
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
});

