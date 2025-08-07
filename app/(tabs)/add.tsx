import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Sparkles, Edit3, Leaf, Apple } from 'lucide-react-native';

export default function AddScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Añadir',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>¿Qué quieres añadir?</Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Ramas</Text>
          <Text style={[styles.sectionDescription, isDarkMode && styles.sectionDescriptionDark]}>
            Las ramas representan áreas importantes de tu vida
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionCard, isDarkMode && styles.optionCardDark]}
              onPress={() => router.push('/add-branch-ai')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#9333ea20' }]}>
                <Sparkles size={24} color="#9333ea" />
              </View>
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Con IA</Text>
              <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
                Describe la rama y la IA la creará por ti
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionCard, isDarkMode && styles.optionCardDark]}
              onPress={() => router.push('/add-branch')}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Leaf size={24} color={colors.primary} />
              </View>
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Manual</Text>
              <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
                Crea una rama personalizada paso a paso
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Frutos</Text>
          <Text style={[styles.sectionDescription, isDarkMode && styles.sectionDescriptionDark]}>
            Los frutos son recuerdos que crecen en tus ramas
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionCard, isDarkMode && styles.optionCardDark]}
              onPress={() => router.push('/add-memory-ai')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#9333ea20' }]}>
                <Sparkles size={24} color="#9333ea" />
              </View>
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Con IA</Text>
              <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
                Describe tu recuerdo y la IA lo convertirá en un fruto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionCard, isDarkMode && styles.optionCardDark]}
              onPress={() => router.push('/add-memory-manual')}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Apple size={24} color={colors.primary} />
              </View>
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Manual</Text>
              <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
                Crea un fruto detallado con fotos y ubicación
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6E8', // Fondo beige cálido para combinar con el árbol
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    marginTop: 8,
  },
  titleDark: {
    color: colors.white,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: colors.white,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 16,
  },
  sectionDescriptionDark: {
    color: '#AAA',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCardDark: {
    backgroundColor: '#1E1E1E',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
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
    lineHeight: 20,
  },
  optionDescriptionDark: {
    color: '#AAA',
  },
});