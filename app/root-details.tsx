import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { Trees, Edit2, Save, X } from 'lucide-react-native';

export default function RootDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [relative, setRelative] = useState<any>(null);
  const [isEditingRelation, setIsEditingRelation] = useState(false);
  const [relationText, setRelationText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { theme } = useThemeStore();
  const { updateRootRelation, fetchSharedTree, isLoading } = useTreeStore();
  const { user } = useUserStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    async function fetchRelative() {
      // Buscar en family_connections el familiar con este ID de conexión
      const { data } = await supabase
        .from('family_connections')
        .select('id, relation, relative:profiles!relative_id(*)')
        .eq('id', id)
        .eq('user_id', user?.id) // Solo conexiones del usuario actual
        .single();

      if (data) {
        setRelative({
          ...data.relative,
          connectionId: data.id,
          relation: data.relation
        });
        setRelationText(data.relation || 'Familiar');
      }
    }
    if (id && user) {
      fetchRelative();
    }
  }, [id, user]);

  const handleSaveRelation = async () => {
    if (!relationText.trim()) {
      Alert.alert('Error', 'La relación no puede estar vacía.');
      return;
    }

    if (!relative?.connectionId) {
      Alert.alert('Error', 'No se encontró la conexión.');
      return;
    }

    setIsSaving(true);
    try {
      await updateRootRelation(relative.connectionId, relationText.trim());
      setRelative({ ...relative, relation: relationText.trim() });
      setIsEditingRelation(false);
      Alert.alert('Éxito', 'Relación actualizada correctamente.');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar la relación. ' + (error.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewTree = async () => {
    if (!relative?.id) {
      Alert.alert('Error', 'No se pudo obtener la información del familiar.');
      return;
    }

    try {
      await fetchSharedTree(relative.id, false);
      router.push('/shared-tree');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el árbol compartido. ' + (error.message || ''));
    }
  };

  if (!relative) {
    return (
      <View style={[styles.container, isDarkMode && styles.bgDark, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isDarkMode && styles.textWhite]}>Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: relative.name || 'Familiar',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }} 
      />
      <ScrollView style={[styles.container, isDarkMode && styles.bgDark]}>
        <View style={styles.header}>
          {relative.avatar_url ? (
            <Image source={{ uri: relative.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{relative.name?.charAt(0) || 'F'}</Text>
            </View>
          )}
          <Text style={[styles.name, isDarkMode && styles.textWhite]}>{relative.name}</Text>
          
          {/* Relación editable */}
          <View style={styles.relationContainer}>
            {isEditingRelation ? (
              <View style={styles.relationEditContainer}>
                <TextInput
                  style={[styles.relationInput, isDarkMode && styles.relationInputDark]}
                  value={relationText}
                  onChangeText={setRelationText}
                  placeholder="Ej: Madre, Padre, Abuela..."
                  placeholderTextColor={isDarkMode ? '#777' : colors.gray}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveRelation}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Save size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setRelationText(relative.relation || 'Familiar');
                    setIsEditingRelation(false);
                  }}
                >
                  <X size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.relationDisplayContainer}>
                <Text style={[styles.relation, isDarkMode && styles.textLight]}>
                  {relative.relation || 'Familiar'}
                </Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditingRelation(true)}
                >
                  <Edit2 size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.label, isDarkMode && styles.textLight]}>Email</Text>
          <Text style={[styles.value, isDarkMode && styles.textWhite]}>{relative.email || 'No disponible'}</Text>
        </View>

        {/* Botón para ver árbol */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.viewTreeButton, isDarkMode && styles.viewTreeButtonDark]}
            onPress={handleViewTree}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Trees size={24} color={colors.white} />
                <Text style={styles.viewTreeButtonText}>
                  Ver Árbol de {relative.name}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  bgDark: { 
    backgroundColor: '#121212' 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
  },
  header: { 
    alignItems: 'center', 
    padding: 30, 
    backgroundColor: colors.primary + '20',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarText: { 
    fontSize: 40, 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  name: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 8,
  },
  relationContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  relationDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relation: { 
    fontSize: 18, 
    color: colors.primary, 
    fontWeight: '600' 
  },
  editButton: {
    padding: 4,
  },
  relationEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '80%',
  },
  relationInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    textAlign: 'center',
  },
  relationInputDark: {
    backgroundColor: '#2C2C2C',
    color: colors.white,
    borderColor: colors.primary,
  },
  saveButton: {
    padding: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
  },
  section: { 
    padding: 20,
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionDark: {
    backgroundColor: '#1E1E1E',
  },
  label: { 
    fontSize: 14, 
    color: '#888', 
    marginBottom: 5 
  },
  value: { 
    fontSize: 16, 
    color: '#333', 
    marginBottom: 20 
  },
  textWhite: { 
    color: '#FFF' 
  },
  textLight: { 
    color: '#CCC' 
  },
  actionSection: {
    padding: 20,
    marginTop: 16,
  },
  viewTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  viewTreeButtonDark: {
    backgroundColor: colors.primary,
  },
  viewTreeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
