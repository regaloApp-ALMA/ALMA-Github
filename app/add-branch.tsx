import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import categories from '@/constants/categories';
import { useThemeStore } from '@/stores/themeStore';
import { X } from 'lucide-react-native';

// Sugerencias vibrantes y variadas
const branchSuggestions = [
  { id: 'viajes', name: 'Viajes', description: 'Lugares que has visitado' },
  { id: 'logros', name: 'Logros', description: 'Metas alcanzadas' },
  { id: 'mascotas', name: 'Mascotas', description: 'Amigos peludos' },
  { id: 'amigos', name: 'Amigos', description: 'Amistades duraderas' },
  { id: 'recetas', name: 'Recetas', description: 'Sabores familiares' },
  { id: 'hobbies', name: 'Pasatiempos', description: 'Lo que amas hacer' },
  { id: 'casa', name: 'Casa', description: 'Hogar dulce hogar' },
  { id: 'carrera', name: 'Carrera', description: 'Vida profesional' },
  { id: 'deportes', name: 'Deportes', description: 'Actividad física' },
  { id: 'musica', name: 'Música', description: 'Conciertos y canciones' },
  { id: 'lectura', name: 'Libros', description: 'Mundos literarios' },
  { id: 'arte', name: 'Arte', description: 'Creatividad visual' },
  { id: 'familia', name: 'Familia', description: 'Reuniones y lazos' },
  { id: 'salud', name: 'Salud', description: 'Bienestar y cuidado' },
  { id: 'proyectos', name: 'Proyectos', description: 'Ideas en construcción' },
  { id: 'momentos', name: 'Momentos', description: 'Instantes únicos' },
];

// Grid de colores modernos
const MODERN_COLORS = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2',
  '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA',
  '#26A69A', '#66BB6A', '#9CCC65', '#D4E157',
  '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'
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
  categoryItem: { width: 44, height: 44, borderRadius: 22, marginRight: 10, marginBottom: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryItemSelected: { borderColor: colors.text, borderRadius: 10 },
  createButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  createButtonDisabled: { backgroundColor: colors.gray },
  createButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default function AddBranchScreen() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(MODERN_COLORS[5]); // Default un azul bonito
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addBranch, fetchMyTree } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "Por favor escribe un nombre para la rama.");
      return;
    }

    setIsLoading(true);
    try {
      // Usar nombre como ID de categoría
      const finalCategoryId = name.trim().toLowerCase().replace(/\s+/g, '_');

      await addBranch({
        name: name.trim(),
        categoryId: finalCategoryId,
        color: selectedColor,
        position: { x: 0, y: 0 }
      });

      // Forzar recarga del árbol
      await fetchMyTree(true);

      // Mostrar mensaje de éxito
      Alert.alert(
        '✅ Rama creada',
        `La rama "${name.trim()}" ha sido añadida a tu árbol exitosamente.`,
        [{
          text: 'Ver árbol',
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)/tree');
          }
        }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la rama');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nueva Rama',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView
        style={[styles.container, isDarkMode && styles.containerDark]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Elige un color</Text>
          <View style={styles.categoriesContainer}>
            {MODERN_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.categoryItem,
                  { backgroundColor: color },
                  selectedColor === color && styles.categoryItemSelected,
                  selectedColor === color && { borderColor: isDarkMode ? '#FFF' : '#333' }
                ]}
                onPress={() => { setSelectedColor(color); Keyboard.dismiss(); }}
              >
                {selectedColor === color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, (!name.trim() || isLoading) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Crear Rama</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}