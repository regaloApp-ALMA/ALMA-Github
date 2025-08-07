import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useUserStore } from "@/stores/userStore";
import { useThemeStore } from "@/stores/themeStore";
import colors from "@/constants/colors";

import { ErrorBoundary } from "./error-boundary";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Create a client
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const { isAuthenticated } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Check if the user is authenticated
  useEffect(() => {
    if (!loaded) return;
    
    const inAuthGroup = segments[0] === 'auth';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login page if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to the home page if authenticated and trying to access auth pages
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, loaded, router]);

  // Set status bar based on theme
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
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav theme={theme} />
        </QueryClientProvider>
      </trpc.Provider>
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
    </Stack>
  );
}