import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import categories from '@/constants/categories';
import { Sparkles, Send } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

export default function AddBranchAIScreen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBranch, setGeneratedBranch] = useState<{
    name: string;
    description: string;
    category: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const { addBranch } = useTreeStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const generateBranch = async () => {
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
              content: `Eres un asistente especializado en crear ramas para árboles genealógicos familiares. 
              
              Basándote en la descripción del usuario, genera una rama con:
              - name: Un nombre corto y descriptivo para la rama (máximo 20 caracteres)
              - description: Una descripción detallada y emotiva de por qué esta rama es importante (2-3 frases)
              - category: Una de estas categorías exactas: "familia", "viajes", "trabajo", "educacion", "hobbies", "salud", "logros", "tradiciones"
              
              Responde SOLO con un JSON válido en este formato:
              {
                "name": "nombre de la rama",
                "description": "descripción detallada y emotiva",
                "category": "categoria_exacta"
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
        const branchData = JSON.parse(jsonStr.trim());
        
        setGeneratedBranch(branchData);
        setEditedName(branchData.name);
        setEditedDescription(branchData.description);
      } catch (jsonError) {
        console.error('Error parsing branch data:', jsonError, data.completion);
        throw new Error('Failed to parse the generated branch data');
      }
    } catch (error) {
      console.error('Error generating branch:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = () => {
    if (!generatedBranch) return;
    
    const category = categories.find(c => c.id === generatedBranch.category) || categories[0];
    
    addBranch({
      name: isEditing ? editedName : generatedBranch.name,
      categoryId: category.id,
      color: category.color,
      isShared,
      position: {
        x: Math.random() * 0.6 + 0.2,
        y: Math.random() * 0.6 + 0.2,
      },
    });
    
    router.replace('/(tabs)/tree');
  };

  const handleSaveEdit = () => {
    if (editedName.trim() && editedDescription.trim()) {
      setGeneratedBranch({
        ...generatedBranch!,
        name: editedName.trim(),
        description: editedDescription.trim()
      });
      setIsEditing(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Nueva Rama con IA',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Sparkles size={32} color="#9333ea" />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Crea una rama con IA
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Describe qué tipo de rama quieres crear y la IA te ayudará a darle forma
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>
            Describe tu rama
          </Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.textAreaDark]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ej: Quiero crear una rama sobre los viajes familiares que hemos hecho juntos, especialmente los veranos en la playa..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.generateButton,
            !prompt.trim() && styles.generateButtonDisabled,
            isDarkMode && styles.generateButtonDark
          ]}
          onPress={generateBranch}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Send size={20} color={colors.white} />
              <Text style={styles.generateButtonText}>Generar rama</Text>
            </>
          )}
        </TouchableOpacity>

        {generatedBranch && (
          <View style={[styles.resultContainer, isDarkMode && styles.resultContainerDark]}>
            <Text style={[styles.resultTitle, isDarkMode && styles.resultTitleDark]}>
              Rama generada
            </Text>
            
            <View style={[styles.branchPreview, isDarkMode && styles.branchPreviewDark]}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.editInput, isDarkMode && styles.editInputDark]}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Nombre de la rama"
                    placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                  />
                  <TextInput
                    style={[styles.editTextArea, isDarkMode && styles.editInputDark]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Descripción de la rama"
                    placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setEditedName(generatedBranch.name);
                        setEditedDescription(generatedBranch.description);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveEditButton]}
                      onPress={handleSaveEdit}
                    >
                      <Text style={styles.saveEditButtonText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.branchHeader}>
                    <Text style={[styles.branchName, isDarkMode && styles.branchNameDark]}>
                      {generatedBranch.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.editIconButton}
                      onPress={() => setIsEditing(true)}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.branchDescription, isDarkMode && styles.branchDescriptionDark]}>
                    {generatedBranch.description}
                  </Text>
                  <Text style={[styles.branchCategory, isDarkMode && styles.branchCategoryDark]}>
                    Categoría: {categories.find(c => c.id === generatedBranch.category)?.name || generatedBranch.category}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.privacySection}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Privacidad</Text>
              <View style={styles.privacyOptions}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    !isShared && styles.privacyOptionSelected,
                    isDarkMode && styles.privacyOptionDark,
                    !isShared && isDarkMode && styles.privacyOptionSelectedDark
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
                    isDarkMode && styles.privacyOptionDark,
                    isShared && isDarkMode && styles.privacyOptionSelectedDark
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
              style={[styles.createButton, isDarkMode && styles.createButtonDark]}
              onPress={handleCreate}
            >
              <Text style={styles.createButtonText}>Crear Rama</Text>
            </TouchableOpacity>
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
    lineHeight: 22,
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
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  textAreaDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    color: colors.white,
  },
  generateButton: {
    backgroundColor: '#9333ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateButtonDark: {
    backgroundColor: '#9333ea',
  },
  generateButtonDisabled: {
    backgroundColor: colors.gray,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  resultContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  resultTitleDark: {
    color: colors.white,
  },
  branchPreview: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  branchPreviewDark: {
    backgroundColor: colors.primary + '20',
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  branchNameDark: {
    color: colors.white,
  },
  branchDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  branchDescriptionDark: {
    color: '#AAA',
  },
  branchCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  branchCategoryDark: {
    color: colors.primary,
  },
  privacySection: {
    marginBottom: 20,
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
    borderColor: '#333',
  },
  privacyOptionSelected: {
    backgroundColor: colors.primary,
  },
  privacyOptionSelectedDark: {
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDark: {
    backgroundColor: colors.primary,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editIconButton: {
    padding: 4,
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
    minHeight: 100,
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