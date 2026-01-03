import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { Plus, Share2, Lock, Trash2, Unlock } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

export default function BranchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, sharedTree, viewingTree, fetchMyTree, fetchSharedTree } = useTreeStore();
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingBranch, setIsLoadingBranch] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteBranch } = useTreeStore();

  // Determinar qué árbol usar (propio o compartido)
  const activeTree = viewingTree || sharedTree || tree;
  const isSharedTree = !!(viewingTree || sharedTree);
  const isOwner = activeTree?.ownerId === user?.id;

  // Estados locales para cuando no hay árbol en el store
  const [branchData, setBranchData] = useState<any>(null);
  const [fruitsData, setFruitsData] = useState<any[]>([]);

  useEffect(() => {
    if (!activeTree) {
      // Si no hay árbol en el store, cargar el propio
      fetchMyTree();
    }
  }, [activeTree]);

  // Si no hay árbol en el store, cargar rama y frutos directamente desde Supabase
  useEffect(() => {
    if (!activeTree && id && user) {
      setIsLoadingBranch(true);
      async function loadBranchData() {
        try {
          // 1. Cargar la rama con información del árbol
          const { data: branch, error: branchError } = await supabase
            .from('branches')
            .select('*, tree:trees!inner(owner_id, id)')
            .eq('id', id)
            .single();

          if (branchError) throw branchError;

          if (branch) {
            setBranchData(branch);
            const isOwnerBranch = branch.tree?.owner_id === user?.id;

            // 2. Cargar frutos según permisos
            let fruitsQuery = supabase
              .from('fruits')
              .select('*')
              .eq('branch_id', id);

            // Si NO es el dueño, solo frutos públicos
            if (!isOwnerBranch) {
              fruitsQuery = fruitsQuery.eq('is_public', true);
            }

            const { data: fruits, error: fruitsError } = await fruitsQuery
              .order('created_at', { ascending: false });

            if (fruitsError) throw fruitsError;
            setFruitsData(fruits || []);
          }
        } catch (error) {
          console.error('Error cargando rama:', error);
          Alert.alert('Error', 'No se pudo cargar la información de la rama.');
        } finally {
          setIsLoadingBranch(false);
        }
      }
      loadBranchData();
    }
  }, [activeTree, id, user]);

  // Determinar qué datos usar
  const branch = activeTree?.branches.find(b => b.id === id) || branchData;
  const branchFruits = activeTree 
    ? activeTree.fruits.filter(f => {
        if (f.branchId === id) {
          // Si es el dueño, ver todos los frutos. Si no, solo los públicos
          return isOwner || (f.isPublic !== undefined ? f.isPublic : true);
        }
        return false;
      })
    : fruitsData.map((f: any) => ({
        id: f.id,
        title: f.title,
        description: f.description || '',
        branchId: f.branch_id,
        mediaUrls: f.media_urls || [],
        createdAt: f.created_at,
        isShared: f.is_shared || false,
        isPublic: f.is_public !== undefined ? f.is_public : true,
        position: f.position || { x: 0, y: 0 },
      }));

  const finalIsOwner = activeTree ? isOwner : (branchData?.tree?.owner_id === user?.id);

  if ((!activeTree && isLoadingBranch) || (!branch && !isLoadingBranch)) {
    return <View style={[styles.center, isDarkMode && styles.bgDark]}><ActivityIndicator /></View>;
  }

  if (!branch) {
    return <View style={[styles.center, isDarkMode && styles.bgDark]}><Text style={isDarkMode && styles.textWhite}>Rama no encontrada</Text></View>;
  }

  if (!branch) {
    return <View style={[styles.center, isDarkMode && styles.bgDark]}><Text style={isDarkMode && styles.textWhite}>Rama no encontrada</Text></View>;
  }

  // --- LÓGICA DE ELIMINAR ---
  const handleDeleteBranch = () => {
    console.log('🔴 [DEBUG] Botón borrar presionado - handleDeleteBranch llamado');
    console.log('🔴 [DEBUG] ID de rama:', id);
    console.log('🔴 [DEBUG] isDeleting:', isDeleting);
    console.log('🔴 [DEBUG] finalIsOwner:', finalIsOwner);
    
    if (isDeleting) {
      console.log('⚠️ [DEBUG] Ya se está borrando, ignorando clic');
      return; // Prevenir múltiples clics
    }
    
    console.log('🗑️ [Branch Delete] Iniciando borrado de rama:', id);
    
    // Asegurar que Alert se ejecute en el hilo principal
    setTimeout(() => {
      Alert.alert(
        "¿Eliminar Rama?",
        "Esta acción no se puede deshacer y borrará todo el contenido asociado.",
        [
          { 
            text: "Cancelar", 
            style: "cancel",
            onPress: () => {
              console.log('❌ [Branch Delete] Cancelado por el usuario');
            }
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              console.log('✅ [Branch Delete] Usuario confirmó, ejecutando borrado...');
              setIsDeleting(true);
              
              try {
                await deleteBranch(id);
                console.log('✅ [Branch Delete] Rama borrada exitosamente');
                
                // Recargar árbol para sincronizar
                await fetchMyTree();
                
                // Redirigir al árbol principal
                router.replace('/(tabs)/tree');
              } catch (e: any) {
                console.error('❌ [Branch Delete] Error completo:', e);
                console.error('❌ [Branch Delete] Error message:', e.message);
                console.error('❌ [Branch Delete] Error code:', e.code);
                setIsDeleting(false);
                
                const errorMessage = e.message || e.error?.message || "No se pudo eliminar la rama";
                Alert.alert("Error", errorMessage);
                
                // Si hay un error de RLS o permisos, mostrarlo claramente
                if (e.code === '42501' || e.message?.includes('permission') || e.message?.includes('RLS')) {
                  Alert.alert(
                    "Error de permisos", 
                    "No tienes permisos para eliminar esta rama. Verifica las políticas de seguridad en Supabase."
                  );
                }
              }
            }
          }
        ],
        { cancelable: true }
      );
    }, 0);
  };

  // --- LÓGICA DE PRIVACIDAD ---
  const togglePrivacy = async () => {
    if (!finalIsOwner) return; // Solo el dueño puede cambiar privacidad
    
    setIsUpdating(true);
    const currentValue = branch.isShared || branch.is_shared || false;
    const newValue = !currentValue;
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_shared: newValue })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar estado local
      if (branchData) {
        setBranchData({ ...branchData, is_shared: newValue });
      }
      
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
          headerRight: () => finalIsOwner ? (
            <TouchableOpacity 
              onPress={handleDeleteBranch} 
              style={{ 
                marginRight: 10, 
                opacity: isDeleting ? 0.5 : 1,
                zIndex: 1000,
                padding: 8,
                minWidth: 40,
                minHeight: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              disabled={isDeleting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Trash2 size={20} color="white" />
              )}
            </TouchableOpacity>
          ) : null
        }}
      />

      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, { backgroundColor: branch.color || colors.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.branchInfo}>
              {branchFruits.length} {branchFruits.length === 1 ? 'recuerdo' : 'recuerdos'} • Creada el {new Date(branch.createdAt || branch.created_at).toLocaleDateString()}
            </Text>

            {finalIsOwner && (
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.privacyButton} onPress={togglePrivacy} disabled={isUpdating}>
                  {(branch.isShared || branch.is_shared) ? <Unlock size={16} color="white" /> : <Lock size={16} color="white" />}
                  <Text style={styles.actionText}>
                    {(branch.isShared || branch.is_shared) ? 'Pública' : 'Privada'}
                  </Text>
                  {isUpdating && <ActivityIndicator size="small" color="white" style={{ marginLeft: 5 }} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {branchFruits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, isDarkMode && styles.textWhite]}>
                {finalIsOwner ? 'Rama vacía' : 'Sin recuerdos compartidos'}
              </Text>
              <Text style={[styles.emptyStateText, isDarkMode && styles.textLight]}>
                {finalIsOwner 
                  ? 'Añade tu primer recuerdo para ver crecer esta rama.'
                  : 'Esta rama aún no tiene recuerdos compartidos.'}
              </Text>
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
        
        {/* Botón Añadir Recuerdo siempre visible */}
        {finalIsOwner && (
          <View style={styles.fixedAddButton}>
            <TouchableOpacity
              style={[styles.addButtonFixed, { backgroundColor: branch.color || colors.primary }]}
              onPress={() => router.push(`/add-memory-options?branchId=${id}`)}
            >
              <Plus size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Añadir recuerdo</Text>
            </TouchableOpacity>
          </View>
        )}
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
  fixedAddButton: { position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 10 },
  addButtonFixed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
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