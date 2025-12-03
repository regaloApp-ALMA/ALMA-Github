import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import categories from '@/constants/categories';
import { useThemeStore } from '@/stores/themeStore';
import { X } from 'lucide-react-native';

const branchSuggestions = [
  { id: 'deportes', name: 'Deportes', description: 'Deportes que has practicado' },
  { id: 'viajes', name: 'Viajes', description: 'Lugares que has visitado' },
  { id: 'familia', name: 'Familia', description: 'Momentos familiares' },
  { id: 'hobbies', name: 'Hobbies', description: 'Pasatiempos favoritos' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  labelDark: { color: '#FFF' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  inputDark: { backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF' },
  suggestionsContainer: { backgroundColor: '#FFF', borderRadius: 8, marginTop: 8, padding: 12, borderWidth: 1, borderColor: colors.border, elevation: 2 },
  suggestionsContainerDark: { backgroundColor: '#222', borderColor: '#444' },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFF' },
  categoryText: { fontSize: 14, color: colors.text },
  createButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  createButtonDisabled: { backgroundColor: colors.gray },
  createButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default function AddBranchScreen() {
  const [name, setName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const { addBranch } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "Por favor escribe un nombre para la rama.");
      return;
    }

    let finalCategoryId = selectedCategory;
    let finalColor = colors.primary;

    if (showCustomCategory && customCategory.trim()) {
      finalCategoryId = customCategory.trim().toLowerCase().replace(/\s+/g, '_');
      finalColor = categories[Math.floor(Math.random() * categories.length)].color;
    } else {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) finalColor = category.color;
    }

    await addBranch({
      name: name.trim(),
      categoryId: finalCategoryId,
      color: finalColor,
      position: { x: 0, y: 0 }
    });

    if (router.canGoBack()) {
      router.dismissAll();
    }
    router.replace('/(tabs)/tree');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: 'Nueva Rama',
            headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
            headerTintColor: colors.white,
          }}
        />

        <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Nombre de la rama</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Viajes inolvidables"
              placeholderTextColor={isDarkMode ? '#666' : colors.gray}
              onFocus={() => setShowSuggestions(true)}
            />

            {showSuggestions && (
              <View style={[styles.suggestionsContainer, isDarkMode && styles.suggestionsContainerDark]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontWeight: 'bold', color: colors.textLight }}>Sugerencias:</Text>
                  <TouchableOpacity onPress={() => setShowSuggestions(false)}><X size={16} color={colors.textLight} /></TouchableOpacity>
                </View>
                {branchSuggestions.map((s) => (
                  <TouchableOpacity key={s.id} style={{ paddingVertical: 8 }} onPress={() => { setName(s.name); setShowSuggestions(false); Keyboard.dismiss(); }}>
                    <Text style={{ color: colors.primary }}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Categoría (Color)</Text>
            <View style={styles.categoriesContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && { backgroundColor: category.color, borderColor: category.color },
                  ]}
                  onPress={() => { setSelectedCategory(category.id); Keyboard.dismiss(); }}
                >
                  <Text style={[styles.categoryText, selectedCategory === category.id && { color: '#FFF', fontWeight: 'bold' }]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Crear Rama</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}