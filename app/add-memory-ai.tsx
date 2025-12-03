import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Sparkles, Mic, Check, RefreshCw, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import { useUserStore } from '@/stores/userStore';

export default function AddMemoryAIScreen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedMemory, setGeneratedMemory] = useState<{ title: string, description: string, category?: string } | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const { addFruit, tree, fetchMyTree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  useEffect(() => {
    if (!tree) fetchMyTree();
  }, [tree]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedMemory(null);

    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres un poeta de la memoria para la app ALMA. Genera un JSON con: 
              - "title": título emotivo y corto,
              - "description": texto detallado en primera persona,
              - "category": una palabra corta (en minúsculas) que describa el tipo de recuerdo (por ejemplo "family", "viajes", "trabajo" o cualquier otra que tenga sentido para el usuario, no hace falta que sea de una lista fija).
              Tono íntimo y cálido.`
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      let jsonStr = data.completion;
      // Limpieza básica de bloques de código si la IA los incluye
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }

      const result = JSON.parse(jsonStr.trim());
      setGeneratedMemory(result);

      // INTELIGENCIA DE RAMA: Pre-seleccionar la mejor opción
      if (tree && tree.branches.length > 0) {
        let bestMatch = tree.branches[0].id; // Por defecto la primera

        if (result.category) {
          // 1. Buscar por ID de categoría exacto
          const catMatch = tree.branches.find(b => b.categoryId === result.category);
          if (catMatch) {
            bestMatch = catMatch.id;
          } else {
            // 2. Buscar por nombre (contiene texto)
            const nameMatch = tree.branches.find(b =>
              b.name.toLowerCase().includes(result.category!.toLowerCase())
            );
            if (nameMatch) bestMatch = nameMatch.id;
          }
        }
        setSelectedBranchId(bestMatch);
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "La IA necesita un descanso. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && user?.id) {
      setIsUploading(true);
      try {
        const url = await uploadMedia(result.assets[0].uri, user.id, 'memories');
        if (url) setMediaUrls([...mediaUrls, url]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!generatedMemory) return;

    if (!selectedBranchId) {
      Alert.alert("Falta Rama", "Por favor, selecciona en qué rama quieres guardar este recuerdo.");
      return;
    }

    try {
      await addFruit({
        title: generatedMemory.title,
        description: generatedMemory.description,
        branchId: selectedBranchId, // Usamos la que el usuario ha confirmado/elegido
        mediaUrls: mediaUrls,
        isShared: false,
        position: { x: 0, y: 0 },
        location: { name: '' }
      } as any);

      Alert.alert("¡Guardado!", "Tu recuerdo ya brilla en tu árbol.");
      router.replace('/(tabs)/tree');
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Creador Mágico', headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.secondary }, headerTintColor: '#FFF' }} />
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>

        {/* ESTADO 1: Generación */}
        {!generatedMemory ? (
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Cuéntame ese momento especial..."
              placeholderTextColor={colors.gray}
              multiline
            />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
                {isUploading ? <ActivityIndicator size="small" color={colors.secondary} /> : <ImageIcon size={24} color={colors.secondary} />}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.genButton, isGenerating && styles.disabled]} onPress={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.genText}>Generar ✨</Text>}
              </TouchableOpacity>
            </View>

            {mediaUrls.length > 0 && (
              <ScrollView horizontal style={styles.mediaScroll}>
                {mediaUrls.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.miniThumb} />
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          // ESTADO 2: Revisión y Guardado
          <View style={[styles.resultContainer, isDarkMode && styles.cardDark]}>
            <TextInput style={[styles.resultTitleInput, isDarkMode && styles.textWhite]} value={generatedMemory.title} onChangeText={(t) => setGeneratedMemory({ ...generatedMemory, title: t })} />
            <TextInput style={[styles.resultBodyInput, isDarkMode && styles.textWhite]} value={generatedMemory.description} onChangeText={(t) => setGeneratedMemory({ ...generatedMemory, description: t })} multiline />

            {/* SELECTOR DE RAMA (NUEVO) */}
            <View style={styles.branchSelector}>
              <Text style={[styles.sectionLabel, isDarkMode && styles.textLight]}>GUARDAR EN RAMA:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
                {tree?.branches.map(branch => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.branchChip,
                      selectedBranchId === branch.id && { backgroundColor: branch.color || colors.primary, borderColor: branch.color }
                    ]}
                    onPress={() => setSelectedBranchId(branch.id)}
                  >
                    <Text style={[
                      styles.branchChipText,
                      selectedBranchId === branch.id ? { color: '#FFF', fontWeight: 'bold' } : { color: colors.text }
                    ]}>
                      {branch.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.mediaSection}>
              <TouchableOpacity style={styles.addMediaBtn} onPress={handlePickImage}>
                <ImageIcon size={20} color={colors.primary} />
                <Text style={styles.addMediaText}>Añadir Foto/Video</Text>
              </TouchableOpacity>
              <ScrollView horizontal style={styles.mediaScroll}>
                {mediaUrls.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.miniThumb} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryButton} onPress={() => setGeneratedMemory(null)}>
                <RefreshCw size={20} color={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
                <Check size={20} color="#FFF" />
                <Text style={styles.confirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20 },
  cardDark: { backgroundColor: '#1E1E1E' },
  input: { fontSize: 18, minHeight: 120, textAlignVertical: 'top', color: '#333' },
  inputDark: { color: '#FFF' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  iconBtn: { padding: 10, backgroundColor: '#F3E5F5', borderRadius: 50 },
  genButton: { backgroundColor: colors.secondary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  disabled: { opacity: 0.7 },
  genText: { color: '#FFF', fontWeight: 'bold' },
  resultContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginTop: 20 },
  resultTitleInput: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  resultBodyInput: { fontSize: 16, lineHeight: 24, color: '#444', minHeight: 100 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },

  // Estilos del selector de ramas
  branchSelector: { marginTop: 20, marginBottom: 10 },
  sectionLabel: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 'bold' },
  branchScroll: { flexDirection: 'row' },
  branchChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#FFF' },
  branchChipText: { fontSize: 14 },

  mediaSection: { marginTop: 10, marginBottom: 20 },
  addMediaBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  addMediaText: { color: colors.primary, fontWeight: 'bold', marginLeft: 8 },
  mediaScroll: { flexDirection: 'row', marginTop: 10 },
  miniThumb: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
  resultActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  retryButton: { padding: 10 },
  confirmButton: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30 },
  confirmText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 }
});