import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { Plus, Share2, Lock, Trash2, Unlock } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';

export default function BranchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, fetchMyTree } = useTreeStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const [isUpdating, setIsUpdating] = useState(false);
  const { deleteBranch } = useTreeStore();

  useEffect(() => {
    if (!tree) fetchMyTree();
  }, [tree]);

  if (!tree) return <View style={[styles.center, isDarkMode && styles.bgDark]}><ActivityIndicator /></View>;

  const branch = tree.branches.find(b => b.id === id);
  const branchFruits = tree.fruits.filter(f => f.branchId === id);

  if (!branch) return <View style={[styles.center, isDarkMode && styles.bgDark]}><Text>Rama no encontrada</Text></View>;

  // --- LÓGICA DE ELIMINAR ---
  const handleDeleteBranch = () => {
    Alert.alert(
      "Eliminar Rama",
      "¿Estás seguro? Se borrarán todos los recuerdos dentro de esta rama. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Borrar en Supabase (El 'on delete cascade' de la DB borrará los frutos automáticamente)
              const { error } = await supabase.from('branches').delete().eq('id', id);
              if (error) throw error;

              // Recargar y salir
              await fetchMyTree();
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  // --- LÓGICA DE PRIVACIDAD ---
  const togglePrivacy = async () => {
    setIsUpdating(true);
    const newValue = !branch.isShared;
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_shared: newValue })
        .eq('id', id);

      if (error) throw error;
      await fetchMyTree(); // Recargar para ver el cambio
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: branch.name,
          headerStyle: { backgroundColor: branch.color || colors.primary },
          headerTintColor: colors.white,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteBranch} style={{ marginRight: 10 }}>
              <Trash2 size={20} color="white" />
            </TouchableOpacity>
          )
        }}
      />

      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, { backgroundColor: branch.color || colors.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.branchInfo}>
              {branchFruits.length} recuerdos • Creada el {new Date(branch.createdAt).toLocaleDateString()}
            </Text>

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.privacyButton} onPress={togglePrivacy} disabled={isUpdating}>
                {branch.isShared ? <Unlock size={16} color="white" /> : <Lock size={16} color="white" />}
                <Text style={styles.actionText}>
                  {branch.isShared ? 'Pública' : 'Privada'}
                </Text>
                {isUpdating && <ActivityIndicator size="small" color="white" style={{ marginLeft: 5 }} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {branchFruits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, isDarkMode && styles.textWhite]}>Rama vacía</Text>
              <Text style={[styles.emptyStateText, isDarkMode && styles.textLight]}>
                Añade tu primer recuerdo para ver crecer esta rama.
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: branch.color || colors.primary }]}
                onPress={() => router.push(`/add-memory-options?branchId=${id}`)}
              >
                <Plus size={20} color={colors.white} />
                <Text style={styles.addButtonText}>Añadir recuerdo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fruitsContainer}>
              {branchFruits.map(fruit => (
                <TouchableOpacity
                  key={fruit.id}
                  style={[styles.fruitCard, isDarkMode && styles.fruitCardDark]}
                  onPress={() => router.push({ pathname: '/fruit-details', params: { id: fruit.id } })}
                >
                  {fruit.mediaUrls && fruit.mediaUrls.length > 0 && (
                    <Image source={{ uri: fruit.mediaUrls[0] }} style={styles.fruitImage} />
                  )}

                  <View style={styles.fruitContent}>
                    <Text style={[styles.fruitTitle, isDarkMode && styles.textWhite]}>{fruit.title}</Text>
                    <Text style={[styles.fruitDate, isDarkMode && styles.textLight]}>
                      {new Date(fruit.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.fruitDescription, isDarkMode && styles.textLight]} numberOfLines={2}>
                      {fruit.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#121212' },
  bgDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 10, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { paddingHorizontal: 20 },
  branchInfo: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 10 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  privacyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  actionText: { color: 'white', marginLeft: 6, fontWeight: '600', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: colors.textLight, marginBottom: 20 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  fruitsContainer: { paddingBottom: 40 },
  fruitCard: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  fruitCardDark: { backgroundColor: '#1E1E1E' },
  fruitImage: { width: '100%', height: 150 },
  fruitContent: { padding: 16 },
  fruitTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: colors.text },
  fruitDate: { fontSize: 12, color: colors.textLight, marginBottom: 6 },
  fruitDescription: { fontSize: 14, color: colors.textLight },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
});