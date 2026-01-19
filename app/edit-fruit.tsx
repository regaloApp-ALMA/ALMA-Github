import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Platform, Switch } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Image as ImageIcon, X, Video, Save, Lock, Globe } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import { useUserStore } from '@/stores/userStore';
import { processMediaAsset } from '@/lib/mediaHelper';

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
  const [originalMediaUrls, setOriginalMediaUrls] = useState<string[]>([]); // Guardar el estado original
  const [isPublic, setIsPublic] = useState(true);
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
        const initialUrls = fruit.mediaUrls || [];
        setMediaUrls(initialUrls);
        setOriginalMediaUrls([...initialUrls]); // Guardar copia del array original
        setIsPublic(fruit.isPublic !== undefined ? fruit.isPublic : true);
        setIsLoading(false);
      } else {
        Alert.alert('Error', 'Recuerdo no encontrado');
        router.back();
      }
    }
  }, [tree, id]);

  const handlePickMedia = async () => {
    try {
      // Configuración optimizada: videoQuality para reducir peso de videos
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.7,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType?.Medium || 'medium' as any,
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets) {
        // VALIDACIÓN DE LÍMITES
        const currentImages = mediaUrls.filter(url => !url.match(/\.(mp4|mov|m4v)$/i)).length;
        const currentVideos = mediaUrls.filter(url => url.match(/\.(mp4|mov|m4v)$/i)).length;

        let newImagesCount = 0;
        let newVideosCount = 0;

        for (const asset of result.assets) {
          if (asset.type === 'video' || asset.uri.match(/\.(mp4|mov|m4v)$/i)) newVideosCount++;
          else newImagesCount++;
        }

        if (currentImages + newImagesCount > 10) {
          Alert.alert('Límite excedido', 'Solo puedes adjuntar un máximo de 10 fotos.');
          return;
        }
        if (currentVideos + newVideosCount > 3) {
          Alert.alert('Límite excedido', 'Solo puedes adjuntar un máximo de 3 videos.');
          return;
        }

        // 📸 OPTIMIZACIÓN: Procesar y validar cada asset
        const processedUris: string[] = [];

        for (const asset of result.assets) {
          try {
            // Fix TypeScript type issue: normalize duration (handle null)
            const processedUri = await processMediaAsset({
              uri: asset.uri,
              type: asset.type,
              duration: asset.duration ?? undefined // Convert null to undefined
            }, 'memory');
            if (processedUri) {
              processedUris.push(processedUri);
            }
          } catch (error: any) {
            console.error('Error procesando asset:', error);
            // Continuar con el siguiente asset si uno falla
          }
        }

        if (processedUris.length > 0) {
          setMediaUrls(prev => [...prev, ...processedUris]);
          console.log('📸 Media procesado y validado:', processedUris.length);
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

    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario.');
      return;
    }

    setIsSaving(true);
    try {
      // 📸 LÓGICA COMPLETA: Comparar original vs nuevo y subir solo lo necesario
      let finalMediaUrls: string[] = [];

      // Separar URLs locales (file://, content://, blob:, data:) de las remotas (https://)
      const localUris = mediaUrls.filter(uri =>
        uri.startsWith('file://') ||
        uri.startsWith('content://') ||
        uri.startsWith('blob:') ||
        uri.startsWith('data:')
      );

      const remoteUrls = mediaUrls.filter(uri =>
        !uri.startsWith('file://') &&
        !uri.startsWith('content://') &&
        !uri.startsWith('blob:') &&
        !uri.startsWith('data:')
      );

      // Subir nuevas imágenes locales
      if (localUris.length > 0) {
        setIsUploading(true);
        try {
          console.log('📤 Subiendo', localUris.length, 'archivos nuevos al storage...');
          const uploadPromises = localUris.map(uri =>
            uploadMedia(uri, user.id, 'memories')
          );
          const uploadResults = await Promise.all(uploadPromises);
          const validUploaded = uploadResults.filter(url => url !== null) as string[];
          console.log('✅', validUploaded.length, 'archivos nuevos subidos exitosamente');

          // Combinar URLs remotas existentes + nuevas subidas
          finalMediaUrls = [...remoteUrls, ...validUploaded];
        } catch (uploadError: any) {
          console.error('❌ Error subiendo archivos:', uploadError);
          Alert.alert('Error', 'No se pudieron subir algunos archivos. ' + (uploadError.message || ''));
          setIsUploading(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else {
        // No hay nuevas imágenes, solo usar las remotas (que ya están filtradas)
        finalMediaUrls = remoteUrls;
      }

      console.log('📊 URLs finales a guardar:', finalMediaUrls.length);
      console.log('📊 URLs originales:', originalMediaUrls.length);

      await updateFruit(id, {
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranch,
        mediaUrls: finalMediaUrls, // Array final con solo las URLs que queremos mantener
        isPublic: isPublic,
      });

      // Mostrar mensaje de éxito
      Alert.alert(
        '✅ Cambios guardados',
        'Tu recuerdo ha sido actualizado exitosamente.',
        [{
          text: 'Ver recuerdo',
          onPress: () => {
            router.dismissAll();
            router.replace({ pathname: '/fruit-details', params: { id: id } });
          }
        }]
      );
    } catch (error: any) {
      Alert.alert('Error', `No se pudo actualizar el recuerdo: ${error.message || 'Intenta de nuevo'}`);
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
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Privacidad</Text>
          <View style={[styles.privacyContainer, isDarkMode && styles.privacyContainerDark]}>
            <View style={styles.privacyHeader}>
              {isPublic ? (
                <Globe size={20} color={colors.primary} />
              ) : (
                <Lock size={20} color={isDarkMode ? '#666' : colors.gray} />
              )}
              <View style={styles.privacyTextContainer}>
                <Text style={[styles.privacyLabel, isDarkMode && styles.textWhite]}>
                  {isPublic ? 'Público' : 'Privado'}
                </Text>
                <Text style={[styles.privacyHint, isDarkMode && styles.textLight]}>
                  {isPublic
                    ? 'Visible para tus familiares'
                    : 'Solo tú puedes verlo'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: isDarkMode ? '#444' : colors.lightGray, true: colors.primaryLight }}
              thumbColor={isPublic ? colors.primary : (isDarkMode ? '#666' : colors.gray)}
            />
          </View>
        </View>

        <View style={styles.group}>
          <View style={{ marginBottom: 8, flexDirection: 'column' }}>
            <Text style={[styles.label, isDarkMode && styles.textWhite, { marginBottom: 2 }]}>
              Fotos y Videos {mediaUrls.length > 0 && `(${mediaUrls.length})`}
            </Text>
            <Text style={{ fontSize: 12, color: colors.gray, opacity: 0.8 }}>
              Límites: Máx 10 fotos, Máx 3 videos (15s c/u).
            </Text>
          </View>

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
            disabled={isSaving}
          >
            <ImageIcon size={32} color={colors.gray} />
            <Text style={[styles.uploadText, isDarkMode && styles.textLight]}>
              Toca para añadir más fotos/videos
            </Text>
            <Text style={[styles.uploadHint, isDarkMode && styles.textLight]}>
              Puedes seleccionar múltiples archivos
            </Text>
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
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  privacyContainerDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#444',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  privacyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  privacyHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
});
