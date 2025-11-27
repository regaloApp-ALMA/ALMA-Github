import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Image as ImageIcon } from 'lucide-react-native';
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
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tree) fetchMyTree();
    else if (!selectedBranch && tree.branches.length > 0) {
      setSelectedBranch(tree.branches[0].id);
    }
  }, [tree]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && user?.id) {
      setIsUploading(true);
      try {
        const url = await uploadMedia(result.assets[0].uri, user.id, 'memories');
        if (url) setMediaUrl(url);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedBranch) {
      Alert.alert('Faltan datos', 'Escribe un título y elige una rama.');
      return;
    }

    setIsSaving(true);
    try {
      // SOLUCIÓN AL ERROR: Ajustamos el objeto al tipo esperado o casteamos
      await addFruit({
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranch,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        isShared: false,
        // Pasamos location y position aunque sean opcionales
        location: { name: '' },
        position: { x: 0, y: 0 }
      } as any);

      router.replace('/(tabs)/tree');
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
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Foto</Text>
          {mediaUrl ? (
            <View>
              <Image source={{ uri: mediaUrl }} style={styles.preview} />
              <TouchableOpacity onPress={() => setMediaUrl('')} style={styles.removeBtn}><Text style={{ color: 'white' }}>X</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.uploadBox, isDarkMode && styles.uploadBoxDark]} onPress={handlePickImage}>
              {isUploading ? <ActivityIndicator /> : <ImageIcon size={32} color={colors.gray} />}
              <Text style={{ color: colors.gray, marginTop: 8 }}>Toca para subir</Text>
            </TouchableOpacity>
          )}
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
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
  area: { height: 120, textAlignVertical: 'top' },
  chips: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#FFF' },
  chipText: { fontWeight: '600', color: colors.text },
  uploadBox: { height: 150, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  uploadBoxDark: { backgroundColor: '#2C2C2C', borderColor: '#444' },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  disabled: { opacity: 0.7 },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});