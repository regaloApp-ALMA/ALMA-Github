import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Image 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useMemoryStore } from '@/stores/memoryStore';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Camera, Image as ImageIcon, Video, Calendar } from 'lucide-react-native';

export default function AddMemoryManualScreen() {
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branchId || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachments, setAttachments] = useState<string[]>([]);
  
  const { addMemory } = useMemoryStore();
  const { tree, addFruit } = useTreeStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Por favor completa el título y la descripción');
      return;
    }
    
    // Add memory to store
    addMemory({
      title: title.trim(),
      description: description.trim(),
      date: selectedDate,
    });
    
    // If we have a branch selected, add as fruit
    if (selectedBranch) {
      addFruit({
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranch,
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
            setTitle('');
            setDescription('');
            setSelectedBranch('');
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setAttachments([]);
          },
        }
      ]
    );
    
    // Navigate back after a short delay to show the alert
    setTimeout(() => {
      if (branchId) {
        router.back(); // Go back to branch details
      } else {
        router.replace('/(tabs)/tree'); // Go to tree view
      }
    }, 100);
  };

  const addAttachment = (type: 'photo' | 'video') => {
    // In a real app, this would open camera/gallery
    Alert.alert(
      'Añadir ' + (type === 'photo' ? 'Foto' : 'Video'),
      'Esta funcionalidad se implementará con acceso a cámara y galería',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: branchId ? 'Añadir Fruto' : 'Añadir Recuerdo',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Título del recuerdo</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Mi primer día de universidad"
            placeholderTextColor={isDarkMode ? '#888' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Descripción</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe este momento especial..."
            placeholderTextColor={isDarkMode ? '#888' : colors.gray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Rama del árbol</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchSelector}>
            <TouchableOpacity
              style={[
                styles.branchOption,
                !selectedBranch && styles.branchOptionSelected,
                isDarkMode && styles.branchOptionDark
              ]}
              onPress={() => setSelectedBranch('')}
            >
              <Text style={[
                styles.branchOptionText,
                !selectedBranch && styles.branchOptionTextSelected,
                isDarkMode && styles.branchOptionTextDark
              ]}>
                Sin rama
              </Text>
            </TouchableOpacity>
            
            {tree.branches.map(branch => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchOption,
                  selectedBranch === branch.id && styles.branchOptionSelected,
                  selectedBranch === branch.id && { backgroundColor: branch.color },
                  isDarkMode && styles.branchOptionDark
                ]}
                onPress={() => setSelectedBranch(branch.id)}
              >
                <Text style={[
                  styles.branchOptionText,
                  selectedBranch === branch.id && styles.branchOptionTextSelected,
                  isDarkMode && styles.branchOptionTextDark
                ]}>
                  {branch.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDarkMode ? '#888' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Archivos adjuntos</Text>
          <View style={styles.attachmentButtons}>
            <TouchableOpacity
              style={[styles.attachmentButton, isDarkMode && styles.attachmentButtonDark]}
              onPress={() => addAttachment('photo')}
            >
              <Camera size={24} color={isDarkMode ? colors.white : colors.primary} />
              <Text style={[styles.attachmentButtonText, isDarkMode && styles.attachmentButtonTextDark]}>
                Foto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.attachmentButton, isDarkMode && styles.attachmentButtonDark]}
              onPress={() => addAttachment('photo')}
            >
              <ImageIcon size={24} color={isDarkMode ? colors.white : colors.primary} />
              <Text style={[styles.attachmentButtonText, isDarkMode && styles.attachmentButtonTextDark]}>
                Galería
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.attachmentButton, isDarkMode && styles.attachmentButtonDark]}
              onPress={() => addAttachment('video')}
            >
              <Video size={24} color={isDarkMode ? colors.white : colors.primary} />
              <Text style={[styles.attachmentButtonText, isDarkMode && styles.attachmentButtonTextDark]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!title.trim() || !description.trim()) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim() || !description.trim()}
        >
          <Text style={styles.saveButtonText}>Guardar Recuerdo</Text>
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
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: colors.white,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  branchSelector: {
    flexDirection: 'row',
  },
  branchOption: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  branchOptionDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  branchOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  branchOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  branchOptionTextDark: {
    color: colors.white,
  },
  branchOptionTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  attachmentButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  attachmentButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
  attachmentButtonTextDark: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});