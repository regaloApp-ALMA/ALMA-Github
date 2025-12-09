import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Image as ImageIcon, X, Video, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import { useUserStore } from '@/stores/userStore';

export default function EditFruitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, fetchMyTree, updateFruit } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tree) {
      fetchMyTree();
    } else if (id) {
      // Cargar datos del fruto existente
      const fruit = tree.fruits.find(f => f.id === id);
      if (fruit) {
        setTitle(fruit.title);
        setDescription(fruit.description || '');
        setSelectedBranch(fruit.branchId);
        setMediaUrls(fruit.mediaUrls || []);
        setIsLoading(false);
      } else {
        Alert.alert('Error', 'Recuerdo no encontrado');
        router.back();
      }
    }
  }, [tree, id]);

  const handlePickMedia = async () => {
    try {
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.7,
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && user?.id && result.assets) {
        setIsUploading(true);
        try {
          const uploadPromises = result.assets.map(asset => 
            uploadMedia(asset.uri, user.id, 'memories')
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          const validUrls = uploadedUrls.filter(url => url !== null) as string[];
          setMediaUrls(prev => [...prev, ...validUrls]);
        } catch (error) {
          Alert.alert('Error', 'No se pudieron subir algunos archivos');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error: any) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'No se pudo abrir la galería. ' + (error.message || ''));
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('video') || url.includes('.m4v');
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedBranch) {
      Alert.alert('Faltan datos', 'Escribe un título y elige una rama.');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'ID del recuerdo no encontrado');
      return;
    }

    setIsSaving(true);
    try {
      await updateFruit(id, {
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranch,
        mediaUrls: mediaUrls,
      });

      Alert.alert('¡Guardado!', 'El recuerdo se ha actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el recuerdo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !tree) {
    return (
      <View style={[styles.center, isDarkMode && styles.centerDark]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Recuerdo',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: '#FFF',
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.group}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Título</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: El día de la graduación"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Rama</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {tree.branches.map(branch => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.chip,
                  selectedBranch === branch.id && { backgroundColor: branch.color || colors.primary, borderColor: branch.color }
                ]}
                onPress={() => setSelectedBranch(branch.id)}
              >
                <Text style={[styles.chipText, selectedBranch === branch.id && { color: '#FFF' }]}>
                  {branch.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Historia</Text>
          <TextInput
            style={[styles.input, styles.area, isDarkMode && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Cuéntalo todo..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>
            Fotos y Videos {mediaUrls.length > 0 && `(${mediaUrls.length})`}
          </Text>
          
          {mediaUrls.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
              {mediaUrls.map((url, index) => (
                <View key={index} style={styles.mediaItem}>
                  {isVideoUrl(url) ? (
                    <View style={styles.videoContainer}>
                      <Video size={24} color={colors.white} />
                      <Text style={styles.videoLabel}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: url }} style={styles.mediaPreview} />
                  )}
                  <TouchableOpacity 
                    style={styles.removeMediaBtn} 
                    onPress={() => removeMedia(index)}
                  >
                    <X size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity 
            style={[styles.uploadBox, isDarkMode && styles.uploadBoxDark]} 
            onPress={handlePickMedia}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <ImageIcon size={32} color={colors.gray} />
                <Text style={[styles.uploadText, isDarkMode && styles.textLight]}>
                  Toca para añadir más fotos/videos
                </Text>
                <Text style={[styles.uploadHint, isDarkMode && styles.textLight]}>
                  Puedes seleccionar múltiples archivos
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  centerDark: { backgroundColor: '#121212' },
  group: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: colors.text },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
  area: { height: 120, textAlignVertical: 'top' },
  chips: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#FFF' },
  chipText: { fontWeight: '600', color: colors.text },
  uploadBox: { 
    height: 150, 
    borderWidth: 2, 
    borderColor: '#E0E0E0', 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFF' 
  },
  uploadBoxDark: { backgroundColor: '#2C2C2C', borderColor: '#444' },
  uploadText: { color: colors.gray, marginTop: 8, fontWeight: '600' },
  uploadHint: { color: colors.gray, marginTop: 4, fontSize: 12 },
  mediaScroll: { flexDirection: 'row', marginBottom: 12 },
  mediaItem: { position: 'relative', marginRight: 12 },
  mediaPreview: { width: 100, height: 100, borderRadius: 12 },
  videoContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 12, 
    backgroundColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  videoLabel: { color: colors.white, fontSize: 12, marginTop: 4 },
  removeMediaBtn: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: colors.error, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  saveButton: { 
    backgroundColor: colors.primary, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 40 
  },
  disabled: { opacity: 0.7 },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
