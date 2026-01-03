import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useThemeStore } from "@/stores/themeStore";
import { useTreeStore } from "@/stores/treeStore";
import colors from "@/constants/colors";
import { ErrorBoundary } from "./error-boundary";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Cliente para gestionar el caché de datos (muy útil con Supabase)
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const { isAuthenticated, initialize, user, session } = useUserStore();
  const { fetchMyTree } = useTreeStore();
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      initialize(); // Verificar si hay sesión guardada al arrancar
    }
  }, [loaded]);

  // Cargar árbol cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🌳 [Layout] Usuario autenticado, cargando árbol...');
      fetchMyTree();
    }
  }, [isAuthenticated, user]);
  
  // Efecto adicional para detectar cambios de sesión y redirigir
  useEffect(() => {
    if (!loaded) return;
    
    const { session } = useUserStore.getState();
    if (session && !isAuthenticated) {
      // Si hay sesión pero isAuthenticated es false, esperar un momento y verificar de nuevo
      console.log('⏳ [Layout] Sesión detectada pero isAuthenticated es false, esperando...');
      const timer = setTimeout(() => {
        const { isAuthenticated: authCheck } = useUserStore.getState();
        if (authCheck) {
          console.log('✅ [Layout] isAuthenticated actualizado, redirigiendo...');
          router.replace('/(tabs)');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded, session]);

  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === 'auth';
    const inCallback = segments[1] === 'callback';

    // Si está autenticado, redirigir incondicionalmente fuera de auth
    if (isAuthenticated) {
      if (inAuthGroup && !inCallback) {
        // Si está en auth pero no en callback, redirigir a tabs
        console.log('🟢 [Layout] Usuario autenticado, redirigiendo a tabs desde auth');
        router.replace('/(tabs)');
      } else if (!inAuthGroup && segments[0] !== '(tabs)') {
        // Si está autenticado pero no está en tabs ni en auth, redirigir a tabs
        console.log('🟢 [Layout] Usuario autenticado, redirigiendo a tabs');
        router.replace('/(tabs)');
      }
    } else if (!isAuthenticated && !inAuthGroup) {
      // Si no está logueado y no está en login/registro, mandar a login
      console.log('🔴 [Layout] Usuario no autenticado, redirigiendo a login');
      router.replace('/auth/login');
    }
  }, [isAuthenticated, segments, loaded, router]);

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(theme === 'dark' ? '#121212' : colors.background);
      }
    }
  }, [theme]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      {/* Eliminamos trpc.Provider y dejamos solo QueryClient */}
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav theme={theme} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Atrás",
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#1E1E1E' : colors.background,
        },
        headerTintColor: theme === 'dark' ? colors.white : colors.text,
        contentStyle: {
          backgroundColor: theme === 'dark' ? '#121212' : colors.background,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
    </Stack>
  );
}