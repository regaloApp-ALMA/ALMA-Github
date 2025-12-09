import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Tree from '@/components/Tree';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function SharedTreeScreen() {
  const router = useRouter();
  const { sharedTree, isLoading, error } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    // Si no hay árbol compartido, volver atrás
    if (!isLoading && !sharedTree && !error) {
      Alert.alert(
        'Sin árbol compartido',
        'No se encontró un árbol compartido para mostrar.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [isLoading, sharedTree, error]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Árbol Compartido',
            headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, isDarkMode && styles.textWhite]}>
            Cargando árbol compartido...
          </Text>
        </View>
      </>
    );
  }

  if (error || !sharedTree) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Árbol Compartido',
            headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <View style={[styles.container, styles.errorContainer, isDarkMode && styles.containerDark]}>
          <Text style={[styles.errorText, isDarkMode && styles.textWhite]}>
            {error || 'No se pudo cargar el árbol compartido'}
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Árbol de ${sharedTree.name}`,
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />
      <View style={styles.treeContainer}>
        <Tree treeData={sharedTree} isShared={true} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  treeContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  textWhite: {
    color: '#FFF',
  },
});

