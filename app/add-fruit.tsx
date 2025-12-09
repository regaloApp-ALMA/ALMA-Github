import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { Image as ImageIcon, MapPin, Users, Heart, Tag } from 'lucide-react-native';

export default function AddFruitScreen() {
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const { tree, addFruit, fetchMyTree } = useTreeStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Inicializamos vacío, lo actualizaremos cuando cargue el árbol
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || '');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [emotions, setEmotions] = useState('');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
  const [isSaving, setIsSaving] = useState(false);

  // Asegurarnos de que tenemos datos del árbol al entrar
  useEffect(() => {
    if (!tree) {
      fetchMyTree();
    } else if (!selectedBranchId && tree.branches.length > 0) {
      // Si no hay rama seleccionada, pre-seleccionar la primera
      setSelectedBranchId(tree.branches[0].id);
    }
  }, [tree, selectedBranchId]);

  const handleCreate = async () => {
    if (!title.trim() || !selectedBranchId) {
      Alert.alert("Faltan datos", "Por favor añade un título y selecciona una rama.");
      return;
    }

    setIsSaving(true);
    try {
      await addFruit({
        title: title.trim(),
        description: description.trim(),
        branchId: selectedBranchId,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        people: people.split(',').map(person => person.trim()).filter(person => person),
        emotions: emotions.split(',').map(emotion => emotion.trim()).filter(emotion => emotion),
        isShared: false,
        position: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.6 + 0.2,
        },
      });

      // Volver al árbol
      router.dismissTo('/(tabs)/tree');
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el recuerdo. Inténtalo de nuevo.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = () => {
    // En una app real, abriría la galería
    setMediaUrl('https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
  };

  if (!tree) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nuevo Recuerdo',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Graduación, Viaje a Barcelona..."
            placeholderTextColor={colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe este recuerdo..."
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rama</Text>
          <View style={styles.branchesContainer}>
            {tree.branches.length === 0 ? (
              <Text style={styles.noBranchesText}>Primero debes crear una rama en tu árbol.</Text>
            ) : (
              tree.branches.map(branch => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.branchItem,
                    selectedBranchId === branch.id && {
                      backgroundColor: branch.color || colors.primary,
                      borderColor: branch.color || colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedBranchId(branch.id)}
                >
                  <Text
                    style={[
                      styles.branchText,
                      selectedBranchId === branch.id && { color: colors.white, fontWeight: 'bold' },
                    ]}
                  >
                    {branch.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Imagen</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
              <ImageIcon size={16} color={colors.white} />
              <Text style={styles.addButtonText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {mediaUrl && (
            <Image source={{ uri: mediaUrl }} style={styles.previewImage} />
          )}
        </View>

        {/* Campos adicionales opcionales */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Ubicación</Text>
            <MapPin size={16} color={colors.primary} />
          </View>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Ej: Madrid, Parque del Retiro..."
            placeholderTextColor={colors.gray}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, (!title.trim() || isSaving) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!title.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Guardar Recuerdo</Text>
          )}
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  branchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  branchText: {
    fontSize: 14,
    color: colors.text,
  },
  noBranchesText: {
    color: colors.gray,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});