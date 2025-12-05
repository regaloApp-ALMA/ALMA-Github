import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Animated, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Sparkles, Mic, Check, RefreshCw, Image as ImageIcon, Wand2, BookOpen, X } from 'lucide-react-native';
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
  const [loadingMessage, setLoadingMessage] = useState('Conectando con tu historia...');

  const { addFruit, tree, fetchMyTree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  useEffect(() => {
    if (!tree) fetchMyTree();
  }, [tree]);

  useEffect(() => {
    if (isGenerating) {
      const messages = [
        'Conectando con tu historia...',
        'Tejiendo palabras mágicas...',
        'Dando forma a tus recuerdos...',
        'Casi listo...'
      ];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

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
              content: `Eres un asistente de memoria para la app ALMA. Tu misión es transformar las historias del usuario en recuerdos auténticos y humanos, como si fueran escritos por la propia persona.

REGLAS CRÍTICAS DE ESTILO (OBLIGATORIAS):
1. MÍMESIS TOTAL: NO escribas como una IA ni como un poeta genérico. Tu objetivo es CLONAR EXACTAMENTE el estilo de habla del usuario basándote en su prompt. Analiza su tono, vocabulario, longitud de frases y nivel de formalidad.

2. ADAPTACIÓN DE TONO:
   - Si el usuario escribe corto y directo → el recuerdo debe ser directo y conciso
   - Si es emotivo y detallado → sé emotivo y detallado
   - Si usa lenguaje coloquial/slang → usa lenguaje coloquial
   - Si es formal → mantén formalidad
   - Si escribe con errores o informal → refleja ese estilo natural

3. PRIMERA PERSONA OBLIGATORIA: Usa estrictamente la PRIMERA PERSONA DEL SINGULAR ('Yo fui', 'Nosotros comimos', 'Me sentí', 'Estaba'). Haz que parezca un diario personal auténtico, imperfecto y humano. NUNCA uses tercera persona.

4. PROHIBIDO: Evita COMPLETAMENTE frases cliché como:
   - 'un tapiz de recuerdos'
   - 'ecos del pasado'
   - 'tejiendo memorias'
   - 'hilos dorados de felicidad'
   - 'canto eterno'
   - Cualquier lenguaje artificialmente poético o metafórico exagerado
   
   Usa lenguaje natural, cotidiano y directo como hablaría una persona real.

5. FIDELIDAD: Sé específico SOLO con detalles reales que el usuario menciona. NO inventes cosas que no dijo. Si no menciona un detalle, no lo añadas.

Genera un JSON con:
- "title": título corto y directo (máximo 8 palabras), sin exagerar con metáforas
- "description": texto EXTENSO en primera persona. DEBE tener al menos 3-4 frases completas. Describe sensaciones, ambiente, emociones y detalles específicos que el usuario mencionó. Usa el mismo tono que el usuario (directo si es directo, emotivo si es emotivo).
- "category": una palabra corta (en minúsculas) que describa el tipo de recuerdo.

Ejemplo de descripción buena (tono natural):
"Ese día el sol se filtraba entre las cortinas de la cocina mientras preparábamos el desayuno juntos. Recuerdo el sonido de los huevos chisporroteando en la sartén y cómo reíamos por algo que ya no recuerdo exactamente, pero que en ese momento nos pareció lo más gracioso del mundo. El aroma del café recién hecho se mezclaba con el perfume de las flores que mamá había puesto en el centro de la mesa. En ese instante, todo parecía perfecto, como si el tiempo se hubiera detenido solo para nosotros."

Ejemplo MALO (demasiado poético/artificial):
"En el tapiz de la memoria, ese día quedó tejido con hilos dorados de felicidad. Los ecos del pasado resuenan aún en mi corazón, como un canto eterno de amor familiar."

NO hagas descripciones como: "Fue un día especial con mi familia." Eso es demasiado breve.`
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
    try {
      // SOLUCIÓN: Configuración simplificada sin videoExportPreset (causa errores de casting)
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: true,
        allowsMultipleSelection: true, // Permitir múltiples selecciones
        quality: 0.6,
        // COMPRESIÓN DE VÍDEO NATIVA (solo videoQuality, sin videoExportPreset)
        ...(ImagePicker.VideoQuality && {
          videoQuality: ImagePicker.VideoQuality.Medium,
        }),
      };
      
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && user?.id && result.assets) {
        setIsUploading(true);
        try {
          // Subir todos los archivos seleccionados
          const uploadPromises = result.assets.map(asset => 
            uploadMedia(asset.uri, user.id, 'memories')
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          const validUrls = uploadedUrls.filter(url => url !== null) as string[];
          setMediaUrls(prev => [...prev, ...validUrls]);
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
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
        branchId: selectedBranchId,
        mediaUrls: mediaUrls,
        isShared: false,
        position: { x: 0, y: 0 },
        location: { name: '' }
      } as any);

      Alert.alert("¡Guardado!", "Tu recuerdo ya brilla en tu árbol.");
      router.push('/(tabs)/tree');
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Creador Mágico', 
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.secondary }, 
          headerTintColor: '#FFF' 
        }} 
      />
      
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#f5f7fa', '#c3cfe2']}
        style={styles.gradient}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* ESTADO 1: Generación - Diseño tipo Diario Mágico */}
          {!generatedMemory ? (
            <View style={styles.magicContainer}>
              <View style={styles.magicHeader}>
                <View style={[styles.sparkleIcon, { backgroundColor: colors.secondary + '20' }]}>
                  <Wand2 size={32} color={colors.secondary} />
                </View>
                <Text style={[styles.magicTitle, isDarkMode && styles.textWhite]}>
                  Cuéntame tu historia
                </Text>
                <Text style={[styles.magicSubtitle, isDarkMode && styles.textLight]}>
                  Transformaré tus palabras en un recuerdo hermoso
                </Text>
              </View>

              {/* Input tipo Diario */}
              <View style={[styles.diaryCard, isDarkMode && styles.diaryCardDark]}>
                <View style={styles.diaryHeader}>
                  <BookOpen size={20} color={colors.secondary} />
                  <Text style={[styles.diaryLabel, isDarkMode && styles.textLight]}>Tu diario</Text>
                </View>
                <TextInput
                  style={[styles.diaryInput, isDarkMode && styles.diaryInputDark]}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Escribe aquí tu recuerdo... como si fuera una carta a tu yo del futuro."
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Botones de acción */}
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.mediaButton, isDarkMode && styles.mediaButtonDark]} 
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <ImageIcon size={20} color={colors.secondary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} 
                  onPress={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.loadingText}>{loadingMessage}</Text>
                    </View>
                  ) : (
                    <>
                      <Sparkles size={20} color="#FFF" />
                      <Text style={styles.generateText}>Crear con Magia ✨</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Preview de media con opción de eliminar */}
              {mediaUrls.length > 0 && (
                <ScrollView horizontal style={styles.mediaPreview} showsHorizontalScrollIndicator={false}>
                  {mediaUrls.map((url, i) => (
                    <View key={i} style={styles.mediaThumbContainer}>
                      <Image source={{ uri: url }} style={styles.miniThumb} />
                      <TouchableOpacity 
                        style={styles.removeMediaBtn} 
                        onPress={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <X size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            // ESTADO 2: Resultado - Tarjeta tipo Polaroid
            <View style={styles.polaroidContainer}>
              <View style={[styles.polaroidCard, isDarkMode && styles.polaroidCardDark]}>
                <View style={styles.polaroidHeader}>
                  <Sparkles size={24} color={colors.secondary} />
                  <Text style={[styles.polaroidTitle, isDarkMode && styles.textWhite]}>
                    Tu recuerdo mágico
                  </Text>
                </View>

                <View style={styles.polaroidContent}>
                  <TextInput 
                    style={[styles.polaroidTitleInput, isDarkMode && styles.textWhite]} 
                    value={generatedMemory.title} 
                    onChangeText={(t) => setGeneratedMemory({ ...generatedMemory, title: t })} 
                    placeholder="Título del recuerdo"
                  />
                  <TextInput 
                    style={[styles.polaroidBodyInput, isDarkMode && styles.textWhite]} 
                    value={generatedMemory.description} 
                    onChangeText={(t) => setGeneratedMemory({ ...generatedMemory, description: t })} 
                    multiline 
                    placeholder="Descripción..."
                  />
                </View>

                {/* Selector de rama */}
                <View style={styles.branchSelector}>
                  <Text style={[styles.sectionLabel, isDarkMode && styles.textLight]}>GUARDAR EN RAMA:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
                    {tree?.branches.map(branch => (
                      <TouchableOpacity
                        key={branch.id}
                        style={[
                          styles.branchChip,
                          selectedBranchId === branch.id && { 
                            backgroundColor: branch.color || colors.primary, 
                            borderColor: branch.color 
                          }
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

                {/* Media section */}
                <View style={styles.mediaSection}>
                  <TouchableOpacity style={styles.addMediaBtn} onPress={handlePickImage} disabled={isUploading}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color={colors.secondary} />
                    ) : (
                      <>
                        <ImageIcon size={18} color={colors.secondary} />
                        <Text style={styles.addMediaText}>Añadir Foto/Video</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {mediaUrls.length > 0 && (
                    <ScrollView horizontal style={styles.mediaScroll} showsHorizontalScrollIndicator={false}>
                      {mediaUrls.map((url, i) => (
                        <View key={i} style={styles.mediaThumbContainer}>
                          <Image source={{ uri: url }} style={styles.miniThumb} />
                          <TouchableOpacity 
                            style={styles.removeMediaBtn} 
                            onPress={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <X size={14} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Acciones */}
                <View style={styles.polaroidActions}>
                  <TouchableOpacity 
                    style={[styles.retryButton, isDarkMode && styles.retryButtonDark]} 
                    onPress={() => setGeneratedMemory(null)}
                  >
                    <RefreshCw size={18} color={colors.textLight} />
                    <Text style={[styles.retryText, isDarkMode && styles.textLight]}>Rehacer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
                    <Check size={20} color="#FFF" />
                    <Text style={styles.confirmText}>Guardar en el Árbol</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  // Magic Container (Estado 1)
  magicContainer: { marginTop: 20 },
  magicHeader: { alignItems: 'center', marginBottom: 30 },
  sparkleIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  magicTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  magicSubtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center' },
  
  // Diary Card
  diaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  diaryCardDark: { 
    backgroundColor: '#1E1E1E', 
    borderColor: '#333' 
  },
  diaryHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    gap: 8
  },
  diaryLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: colors.textLight 
  },
  diaryInput: { 
    fontSize: 16, 
    minHeight: 150, 
    color: '#333',
    lineHeight: 24
  },
  diaryInputDark: { 
    color: '#FFF' 
  },
  
  // Actions
  actionsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 20 
  },
  mediaButton: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  mediaButtonDark: { 
    backgroundColor: '#1E1E1E' 
  },
  generateButton: { 
    flex: 1, 
    backgroundColor: colors.secondary, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, 
    borderRadius: 28,
    gap: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  generateButtonDisabled: { 
    opacity: 0.7 
  },
  generateText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  loadingText: {
    color: '#FFF',
    fontSize: 14
  },
  
  // Polaroid Card (Estado 2)
  polaroidContainer: { marginTop: 20 },
  polaroidCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F0F0F0'
  },
  polaroidCardDark: { 
    backgroundColor: '#1E1E1E', 
    borderColor: '#333' 
  },
  polaroidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10
  },
  polaroidTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  polaroidContent: {
    marginBottom: 20
  },
  polaroidTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary + '40',
    paddingBottom: 8
  },
  polaroidBodyInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    minHeight: 100
  },
  
  // Branch Selector
  branchSelector: { marginBottom: 20 },
  sectionLabel: { 
    fontSize: 12, 
    color: '#888', 
    marginBottom: 8, 
    fontWeight: 'bold' 
  },
  branchScroll: { flexDirection: 'row' },
  branchChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#DDD', 
    marginRight: 8, 
    backgroundColor: '#FFF' 
  },
  branchChipText: { fontSize: 14 },
  
  // Media Section
  mediaSection: { marginBottom: 20 },
  addMediaBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    gap: 8
  },
  addMediaText: { 
    color: colors.secondary, 
    fontWeight: '600', 
    fontSize: 14 
  },
  mediaPreview: { marginTop: 10 },
  mediaScroll: { flexDirection: 'row', marginTop: 10 },
  mediaThumbContainer: { 
    position: 'relative', 
    marginRight: 8 
  },
  miniThumb: { 
    width: 60, 
    height: 60, 
    borderRadius: 8 
  },
  removeMediaBtn: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    backgroundColor: colors.error, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  
  // Actions
  polaroidActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    gap: 6
  },
  retryButtonDark: {
    borderColor: '#444'
  },
  retryText: {
    fontSize: 14,
    color: colors.text
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  confirmText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  
  // Text styles
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
});
