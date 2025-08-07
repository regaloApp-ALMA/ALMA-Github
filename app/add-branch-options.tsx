import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Sparkles, Edit3 } from 'lucide-react-native';

export default function AddBranchOptionsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const handleAIOption = () => {
    router.push('/add-branch-ai');
  };

  const handleManualOption = () => {
    router.push('/add-branch');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Nueva Rama',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            ¿Cómo quieres crear tu rama?
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Elige la forma que prefieras para añadir una nueva rama a tu árbol
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.option, styles.aiOption, isDarkMode && styles.optionDark]}
            onPress={handleAIOption}
          >
            <View style={styles.optionIcon}>
              <Sparkles size={32} color="#9333ea" />
            </View>
            <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>
              Con IA
            </Text>
            <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
              Describe el tipo de rama que quieres y la IA la creará con una descripción emotiva
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, styles.manualOption, isDarkMode && styles.optionDark]}
            onPress={handleManualOption}
          >
            <View style={styles.optionIcon}>
              <Edit3 size={32} color={colors.primary} />
            </View>
            <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>
              Manual
            </Text>
            <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
              Crea tu rama paso a paso eligiendo nombre, categoría y descripción personalizada
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  titleDark: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleDark: {
    color: '#AAA',
  },
  optionsContainer: {
    gap: 20,
  },
  option: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionDark: {
    backgroundColor: '#1E1E1E',
  },
  aiOption: {
    borderWidth: 2,
    borderColor: '#9333ea20',
  },
  manualOption: {
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  optionIcon: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  optionTitleDark: {
    color: colors.white,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionDescriptionDark: {
    color: '#AAA',
  },
});