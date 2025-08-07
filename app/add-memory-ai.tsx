import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useMemoryStore } from '@/stores/memoryStore';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Mic, Send, Sparkles } from 'lucide-react-native';

export default function AddMemoryAIScreen() {
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMemory, setGeneratedMemory] = useState<{
    title: string;
    description: string;
    branchId?: string;
    category?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  const { addMemory } = useMemoryStore();
  const { tree, addFruit } = useTreeStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const generateMemoryWithAI = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres un asistente especializado en crear recuerdos significativos para un árbol de vida digital. 
              
              Basándote en la descripción del usuario, genera un recuerdo estructurado que incluya:
              1. Un título emotivo y personal (máximo 50 caracteres)
              2. Una descripción detallada y emotiva del recuerdo (100-200 palabras)
              3. Sugiere una categoría apropiada: family, travel, friends, work, pets, hobbies
              
              El recuerdo debe ser personal, emotivo y capturar la esencia de lo que el usuario describe. 
              Usa un tono cálido y cercano, como si fueras un amigo íntimo recordando momentos especiales.
              
              Responde SOLO en formato JSON:
              {
                "title": "título del recuerdo",
                "description": "descripción detallada y emotiva",
                "category": "categoría sugerida"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      
      try {
        // The AI might return markdown-formatted JSON with ```json wrapping
        let jsonStr = data.completion;
        
        // Remove markdown code block formatting if present
        if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```json\s*|```/g, '');
        }
        
        // Parse the cleaned JSON string
        const memoryData = JSON.parse(jsonStr.trim());
        
        // Use provided branchId or find the appropriate branch
        const suggestedBranch = branchId ? 
          tree.branches.find(b => b.id === branchId) :
          tree.branches.find(b => b.categoryId === memoryData.category);
        
        const memory = {
          title: memoryData.title,
          description: memoryData.description,
          branchId: suggestedBranch?.id,
          category: memoryData.category
        };
        setGeneratedMemory(memory);
        setEditedTitle(memory.title);
        setEditedDescription(memory.description);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        const memory = {
          title: "Recuerdo Especial",
          description: data.completion,
          branchId: branchId,
          category: "family"
        };
        setGeneratedMemory(memory);
        setEditedTitle(memory.title);
        setEditedDescription(memory.description);
      }
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el recuerdo. Inténtalo de nuevo.');
      console.error('Error generating memory:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMemory = () => {
    if (!generatedMemory) return;
    
    const finalTitle = isEditing ? editedTitle : generatedMemory.title;
    const finalDescription = isEditing ? editedDescription : generatedMemory.description;
    
    // Add memory to store
    addMemory({
      title: finalTitle,
      description: finalDescription,
      date: new Date().toISOString(),
    });
    
    // If we have a branch, add as fruit
    if (generatedMemory.branchId) {
      addFruit({
        title: finalTitle,
        description: finalDescription,
        branchId: generatedMemory.branchId,
        isShared: false,
        position: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.6 + 0.2,
        },
      });
    }
    
    Alert.alert(
      'Recuerdo Guardado',
      'Tu recuerdo ha sido añadido al árbol de vida.',
      [
        {
          text: 'Ver Árbol',
          onPress: () => router.replace('/(tabs)/tree'),
        },
        {
          text: 'Crear Otro',
          onPress: () => {
            setGeneratedMemory(null);
            setPrompt('');
          },
        }
      ]
    );
  };

  const examplePrompts = [
    "El día que adopté a mi perro Max",
    "Mi primer viaje a París con mi familia",
    "La graduación de mi hermana",
    "Cuando aprendí a tocar la guitarra",
    "El cumpleaños sorpresa de mi abuela"
  ];

  return (
    <>
      <Stack.Screen 
        options={{
          title: branchId ? 'Crear Fruto con IA' : 'Crear Recuerdo con IA',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        {!generatedMemory ? (
          <>
            <View style={styles.header}>
              <Sparkles size={32} color={colors.primary} />
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                Cuéntame tu recuerdo
              </Text>
              <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                Describe brevemente el momento que quieres recordar y la IA creará un recuerdo emotivo para tu árbol
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Ej: El día que conocí a mi mejor amigo en el colegio..."
                placeholderTextColor={isDarkMode ? '#888' : colors.gray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.generateButton, !prompt.trim() && styles.generateButtonDisabled]}
                onPress={generateMemoryWithAI}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Send size={20} color={colors.white} />
                    <Text style={styles.generateButtonText}>Generar Recuerdo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.examplesContainer}>
              <Text style={[styles.examplesTitle, isDarkMode && styles.examplesTitleDark]}>
                Ejemplos de recuerdos:
              </Text>
              {examplePrompts.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.exampleItem, isDarkMode && styles.exampleItemDark]}
                  onPress={() => setPrompt(example)}
                >
                  <Text style={[styles.exampleText, isDarkMode && styles.exampleTextDark]}>
                    "{example}"
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={[styles.resultTitle, isDarkMode && styles.resultTitleDark]}>
                Recuerdo Generado
              </Text>
            </View>
            
            <View style={[styles.memoryCard, isDarkMode && styles.memoryCardDark]}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.editInput, isDarkMode && styles.editInputDark]}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    placeholder="Título del recuerdo"
                    placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                  />
                  <TextInput
                    style={[styles.editTextArea, isDarkMode && styles.editInputDark]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Descripción del recuerdo"
                    placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setEditedTitle(generatedMemory.title);
                        setEditedDescription(generatedMemory.description);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveEditButton]}
                      onPress={() => {
                        if (editedTitle.trim() && editedDescription.trim()) {
                          setGeneratedMemory({
                            ...generatedMemory!,
                            title: editedTitle.trim(),
                            description: editedDescription.trim()
                          });
                          setIsEditing(false);
                        }
                      }}
                    >
                      <Text style={styles.saveEditButtonText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.memoryHeader}>
                    <Text style={[styles.memoryTitle, isDarkMode && styles.memoryTitleDark]}>
                      {generatedMemory.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.editIconButton}
                      onPress={() => setIsEditing(true)}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.memoryDescription, isDarkMode && styles.memoryDescriptionDark]}>
                    {generatedMemory.description}
                  </Text>
                  
                  {generatedMemory.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        Categoría: {generatedMemory.category}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.regenerateButton]}
                onPress={() => {
                  setGeneratedMemory(null);
                  generateMemoryWithAI();
                }}
              >
                <Text style={styles.regenerateButtonText}>Regenerar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveMemory}
              >
                <Text style={styles.saveButtonText}>Guardar Recuerdo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  titleDark: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  subtitleDark: {
    color: '#ccc',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    marginBottom: 16,
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: colors.white,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: colors.gray,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  examplesContainer: {
    marginTop: 16,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  examplesTitleDark: {
    color: colors.white,
  },
  exampleItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleItemDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  exampleText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  exampleTextDark: {
    color: '#ccc',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultTitleDark: {
    color: colors.white,
  },
  memoryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  memoryCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  memoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  memoryTitleDark: {
    color: colors.white,
  },
  memoryDescription: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  memoryDescriptionDark: {
    color: '#ccc',
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  regenerateButton: {
    backgroundColor: colors.gray,
  },
  regenerateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editIconButton: {
    padding: 4,
    marginTop: -4,
  },
  editIcon: {
    fontSize: 16,
  },
  editInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  editInputDark: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: colors.white,
  },
  editTextArea: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveEditButton: {
    backgroundColor: colors.primary,
  },
  saveEditButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});