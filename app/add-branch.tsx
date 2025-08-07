import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import categories from '@/constants/categories';
import { useThemeStore } from '@/stores/themeStore';
import { Edit3, Plus } from 'lucide-react-native';

// Sugerencias de ramas personalizadas
const branchSuggestions = [
  { id: 'deportes', name: 'Deportes', description: 'Deportes que has practicado' },
  { id: 'coches', name: 'Coches', description: 'Vehículos que has tenido' },
  { id: 'mascotas', name: 'Mascotas', description: 'Tus animales de compañía' },
  { id: 'hobbies', name: 'Hobbies', description: 'Pasatiempos favoritos' },
  { id: 'libros', name: 'Libros', description: 'Lecturas que te han marcado' },
  { id: 'peliculas', name: 'Películas', description: 'Cine que te ha inspirado' },
  { id: 'musica', name: 'Música', description: 'Canciones de tu vida' },
  { id: 'comida', name: 'Gastronomía', description: 'Platos y restaurantes favoritos' },
];

export default function AddBranchScreen() {
  const [name, setName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [isShared, setIsShared] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const { addBranch } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const handleCreate = () => {
    if (!name.trim()) return;
    
    const category = categories.find(c => c.id === selectedCategory);
    
    const branchId = addBranch({
      name: name.trim(),
      categoryId: selectedCategory,
      color: category?.color || colors.primary,
      isShared,
      position: {
        x: Math.random() * 0.6 + 0.2, // Random position between 0.2 and 0.8
        y: Math.random() * 0.6 + 0.2,
      },
    });
    
    // Navigate back to tree to see the animation
    router.replace('/(tabs)/tree');
  };

  const selectSuggestion = (suggestion: { id: string, name: string }) => {
    setName(suggestion.name);
    setShowSuggestions(false);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Nueva Rama Manual',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Edit3 size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Crear rama manualmente
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Personaliza cada detalle de tu nueva rama
          </Text>
        </View>
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Nombre de la rama</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Viajes, Familia, Trabajo..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            onFocus={() => setShowSuggestions(true)}
          />
          
          {showSuggestions && (
            <View style={[styles.suggestionsContainer, isDarkMode && styles.suggestionsContainerDark]}>
              <Text style={[styles.suggestionsTitle, isDarkMode && styles.suggestionsTitleDark]}>Sugerencias de ramas</Text>
              {branchSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Text style={[styles.suggestionName, isDarkMode && styles.suggestionNameDark]}>{suggestion.name}</Text>
                  <Text style={[styles.suggestionDescription, isDarkMode && styles.suggestionDescriptionDark]}>{suggestion.description}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.closeSuggestions}
                onPress={() => setShowSuggestions(false)}
              >
                <Text style={styles.closeSuggestionsText}>Cerrar sugerencias</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Categoría</Text>
          <TouchableOpacity 
            style={[styles.customCategoryButton, isDarkMode && styles.customCategoryButtonDark]}
            onPress={() => setShowCustomCategory(!showCustomCategory)}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.customCategoryButtonText, isDarkMode && styles.customCategoryButtonTextDark]}>Crear categoría personalizada</Text>
          </TouchableOpacity>
          
          {showCustomCategory && (
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark, { marginBottom: 16 }]}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Nombre de la nueva categoría"
              placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            />
          )}
          <View style={styles.categoriesContainer}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && {
                    backgroundColor: category.color,
                    borderColor: category.color,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && { color: colors.white },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Privacidad</Text>
          <View style={styles.privacyOptions}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                !isShared && styles.privacyOptionSelected,
                isDarkMode && styles.privacyOptionDark
              ]}
              onPress={() => setIsShared(false)}
            >
              <Text
                style={[
                  styles.privacyOptionText,
                  !isShared && styles.privacyOptionTextSelected,
                  isDarkMode && styles.privacyOptionTextDark
                ]}
              >
                Privada
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.privacyOption,
                isShared && styles.privacyOptionSelected,
                isDarkMode && styles.privacyOptionDark
              ]}
              onPress={() => setIsShared(true)}
            >
              <Text
                style={[
                  styles.privacyOptionText,
                  isShared && styles.privacyOptionTextSelected,
                  isDarkMode && styles.privacyOptionTextDark
                ]}
              >
                Compartida
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.createButton, !name.trim() && styles.createButtonDisabled, isDarkMode && styles.createButtonDark]}
          onPress={handleCreate}
          disabled={!name.trim()}
        >
          <Text style={styles.createButtonText}>Crear Rama</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  headerTitleDark: {
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  headerSubtitleDark: {
    color: '#AAA',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  labelDark: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    color: colors.white,
  },
  suggestionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsContainerDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  suggestionsTitleDark: {
    color: colors.white,
  },
  suggestionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  suggestionName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
  },
  suggestionNameDark: {
    color: colors.white,
  },
  suggestionDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  suggestionDescriptionDark: {
    color: '#AAA',
  },
  closeSuggestions: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  closeSuggestionsText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
  },
  privacyOptions: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  privacyOptionDark: {
    backgroundColor: '#1E1E1E',
  },
  privacyOptionSelected: {
    backgroundColor: colors.primary,
  },
  privacyOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  privacyOptionTextDark: {
    color: colors.white,
  },
  privacyOptionTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDark: {
    backgroundColor: colors.primary,
  },
  customCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  customCategoryButtonDark: {
    backgroundColor: colors.primary + '20',
  },
  customCategoryButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
  customCategoryButtonTextDark: {
    color: colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});