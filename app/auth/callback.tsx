import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';

/**
 * Pantalla de callback para OAuth (Google)
 * Esta pantalla recibe la redirección después de autenticarse con Google
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, user, initialize } = useUserStore();
  const [status, setStatus] = useState('Verificando autenticación...');
  const [hasChecked, setHasChecked] = useState(false);

  // Inicializar para forzar verificación de sesión
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Esperar a que isAuthenticated se actualice (el listener lo hará)
  useEffect(() => {
    if (hasChecked) return;
    
    let checkTimer: NodeJS.Timeout;
    let errorTimer: NodeJS.Timeout;
    
    const checkAuth = () => {
      if (isAuthenticated && user) {
        setHasChecked(true);
        setStatus('¡Autenticación exitosa!');
        
        // Verificar si es usuario nuevo (creado hace menos de 10 segundos)
        const userCreatedAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
        const now = new Date().getTime();
        const isNewUser = (now - userCreatedAt) < 10000;
        
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
      } else {
        // Esperar un poco más antes de dar error
        errorTimer = setTimeout(() => {
          if (!isAuthenticated && !hasChecked) {
            setHasChecked(true);
            setStatus('Error de autenticación');
            Alert.alert(
              'Error',
              'No se pudo completar la autenticación. Por favor, intenta de nuevo.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/auth/login');
                  }
                }
              ]
            );
          }
        }, 4000); // Aumentar tiempo de espera para conexiones lentas
      }
    };

    // Esperar un momento para que el listener actualice el estado
    // Aumentar el tiempo para dar más oportunidad al listener
    checkTimer = setTimeout(checkAuth, 2000);

    return () => {
      if (checkTimer) clearTimeout(checkTimer);
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [isAuthenticated, user, hasChecked, router]);

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

