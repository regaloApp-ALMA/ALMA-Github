import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import categories from '@/constants/categories';
import { Sparkles, Send } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  textWhite: { color: '#FFF' },
  subtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center', lineHeight: 22 },
  inputContainer: { marginTop: 10 },
  input: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, height: 180, textAlignVertical: 'top', fontSize: 16, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  inputDark: { backgroundColor: '#2C2C2C', color: '#FFF' },
  button: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: colors.primary, shadowOpacity: 0.3, elevation: 4 },
  disabled: { opacity: 0.7 }
});

export default function AddBranchAIScreen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addBranch } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const generateAndCreate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres un arquitecto de memorias para la app ALMA. 
              Basándote en la descripción, genera un JSON con:
              1. "name": Nombre corto (máx 25 chars).
              2. "category": Categoría (ej: family, viajes, hobbies).
              Responde SOLO el JSON.`
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      let jsonStr = data.completion;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }

      const result = JSON.parse(jsonStr.trim());
      const catObj = categories.find(c => c.id === result.category) || categories.find(c => c.id === 'hobbies')!;

      await addBranch({
        name: result.name,
        categoryId: result.category || 'hobbies',
        color: catObj.color,
        position: { x: 0, y: 0 }
      });

      // 🎯 Navegación automática: Volver al árbol y recargar
      router.dismissAll();
      router.replace('/(tabs)/tree');
      
      // Mostrar mensaje después de un pequeño delay (no bloqueante)
      setTimeout(() => {
        Alert.alert('¡Rama Creada!', `Se ha añadido "${result.name}" a tu árbol.`);
      }, 300);

    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la rama. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Diseñador de Ramas',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: '#FFF'
        }}
      />
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Sparkles size={48} color={colors.primary} />
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Diseña tu nueva rama</Text>
          <Text style={styles.subtitle}>Cuéntame qué quieres organizar y crearé el espacio perfecto.</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="Ej: Quiero un espacio para guardar todas las recetas que hacía mi abuela..."
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <TouchableOpacity
            style={[styles.button, isGenerating && styles.disabled]}
            onPress={generateAndCreate}
            disabled={isGenerating}
          >
            {isGenerating ? <ActivityIndicator color="#FFF" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Crear Rama</Text>
                <Send size={20} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}