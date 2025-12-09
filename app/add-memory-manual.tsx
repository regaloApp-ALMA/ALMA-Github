import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Image as ImageIcon, X, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import { useUserStore } from '@/stores/userStore';

export default function AddMemoryManualScreen() {
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const { tree, fetchMyTree, addFruit } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branchId || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]); // Ahora guarda URIs locales (file://...)
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tree) fetchMyTree();
    else if (!selectedBranch && tree.branches.length > 0) {
      setSelectedBranch(tree.branches[0].id);
    }
  }, [tree]);

  const handlePickMedia = async () => {
    try {
      // SOLUCIÓN: Configuración simplificada sin videoExportPreset (causa errores de casting)
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.7,
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets) {
        // 📸 OPTIMIZACIÓN: Solo guardar URIs locales, NO subir todavía
        // Las URIs locales son del tipo: file:///path/to/image.jpg
        const localUris = result.assets.map(asset => asset.uri);
        setMediaUrls(prev => [...prev, ...localUris]);
        console.log('📸 Media seleccionado (URIs locales guardadas):', localUris.length);
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

    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario.');
      return;
    }

    setIsSaving(true);
    try {
      // 📸 OPTIMIZACIÓN: Subir fotos/videos SOLO al guardar
      let uploadedUrls: string[] = [];
      
      if (mediaUrls.length > 0) {
        setIsUploading(true);
        try {
          // Filtrar URIs locales (file://) y subirlas
          const localUris = mediaUrls.filter(uri => uri.startsWith('file://') || uri.startsWith('content://'));
          const alreadyUploaded = mediaUrls.filter(uri => !uri.startsWith('file://') && !uri.startsWith('content://'));
          
          // Subir solo las que son locales
          if (localUris.length > 0) {
            console.log('📤 Subiendo', localUris.length, 'archivos al storage...');
            const uploadPromises = localUris.map(uri => 
              uploadMedia(uri, user.id, 'memories')
            );
            const uploadResults = await Promise.all(uploadPromises);
            const validUploaded = uploadResults.filter(url => url !== null) as string[];
            uploadedUrls = [...alreadyUploaded, ...validUploaded];
            console.log('✅', validUploaded.length, 'archivos subidos exitosamente');
          } else {
            uploadedUrls = alreadyUploaded;
          }
        } catch (uploadError: any) {
          console.error('❌ Error subiendo archivos:', uploadError);
          Alert.alert('Error', 'No se pudieron subir algunos archivos. ' + (uploadError.message || ''));
          setIsUploading(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Guardar el recuerdo con las URLs públicas
      await addFruit({
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranch,
        mediaUrls: uploadedUrls,
        isShared: false,
        position: { x: 0, y: 0 }
      } as any);

      router.push('/(tabs)/tree');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!tree) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nuevo Recuerdo',
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
            placeholderTextColor={colors.gray}
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
            placeholderTextColor={colors.gray}
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
                  Toca para añadir fotos/videos
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
          {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Guardar en el Árbol</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  saveButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  disabled: { opacity: 0.7 },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
