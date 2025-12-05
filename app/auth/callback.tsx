import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';

/**
 * Pantalla de callback para OAuth (Google)
 * Esta pantalla recibe la redirección después de autenticarse con Google
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    // Esperar un momento para que el listener de auth actualice el estado
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        // Si no se autenticó, volver al login
        router.replace('/auth/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

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

