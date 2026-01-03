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

  // 🛡️ PROTECCIÓN DE RUTAS: Solo redirigir cuando sea necesario y cuando no esté cargando
  useEffect(() => {
    if (!loaded) return;
    
    const { isLoading } = useUserStore.getState();
    // ⚠️ CRÍTICO: No redirigir mientras está cargando la sesión
    if (isLoading) {
      console.log('⏳ [Layout] Cargando sesión, esperando...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inCallback = segments[1] === 'callback';
    const inTabs = segments[0] === '(tabs)';
    
    // Lista de rutas internas válidas que NO deben ser redirigidas
    const validInternalRoutes = [
      'branch-details',
      'fruit-details',
      'add-branch',
      'add-branch-options',
      'add-branch-ai',
      'add-fruit',
      'add-memory-options',
      'add-memory-ai',
      'add-memory-manual',
      'edit-fruit',
      'root-details',
      'share-tree',
      'shared-tree',
      'create-gift',
      'digital-legacy',
      'time-capsule',
      'family',
      'notifications',
      'profile-settings',
      'pricing',
      'privacy',
      'storage',
      'ai-assistant',
      'modal',
    ];
    
    const isInternalRoute = validInternalRoutes.includes(segments[0] || '') || 
                           validInternalRoutes.some(route => segments.some(s => s === route));

    if (isAuthenticated) {
      // Si está autenticado y está en auth (excepto callback), redirigir a tabs
      if (inAuthGroup && !inCallback) {
        console.log('🟢 [Layout] Usuario autenticado en auth, redirigiendo a tabs');
        router.replace('/(tabs)');
      }
      // Si está autenticado, permitir navegación libre dentro de la app
      // NO redirigir si está en tabs o en rutas internas válidas
    } else if (!isAuthenticated) {
      // Si NO está autenticado y NO está en auth, redirigir a login
      if (!inAuthGroup) {
        console.log('🔴 [Layout] Usuario no autenticado, redirigiendo a login');
        router.replace('/auth/login');
      }
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