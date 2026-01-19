import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';
import { useUserStore } from './userStore';

export type PendingInvitation = {
  id: string;
  tree_id: string;
  granter_id: string;
  sender: {
    name: string;
    avatar_url: string | null;
  };
  scope: 'all' | 'custom';
  allowed_branch_ids: string[] | null;
  created_at: string;
};

interface TreeState {
  tree: TreeType | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pendingInvitations: PendingInvitation[];
  sharedTree: TreeType | null; // Árbol compartido que estamos viendo
  viewingTree: TreeType | null; // Árbol que estamos visualizando (separado de sharedTree)
  deletionRequests: Array<{
    id: string;
    user_id: string;
    requester: {
      name: string;
      avatar_url: string | null;
    };
    relation: string;
    created_at: string;
  }>; // Solicitudes de eliminación recibidas

  fetchMyTree: (isRefresh?: boolean) => Promise<void>;
  fetchPendingInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string, granterId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  fetchSharedTree: (relativeIdOrTreeId: string, isTreeId?: boolean) => Promise<void>;
  updateRootRelation: (connectionId: string, newRelation: string) => Promise<void>;
  requestRemoveRoot: (rootId: string) => Promise<void>;
  fetchDeletionRequests: () => Promise<void>;
  confirmRemoveRoot: (connectionId: string) => Promise<void>;
  shareTree: (params: {
    recipientEmail: string;
    treeId: string;
    scope: 'all' | 'custom';
    allowedBranchIds?: string[] | null;
  }) => Promise<void>;

  //CORRECCIÓN AQUÍ: Actualizamos la definición para aceptar 'position'
  addBranch: (branch: {
    name: string;
    categoryId: string;
    color: string;
    description?: string;            // Opcional
    position?: { x: number; y: number }; // Opcional (Esto arregla tu error)
    isShared?: boolean;              // Opcional
  }) => Promise<void>;

  updateBranch: (branchId: string, updates: {
    name?: string;
    color?: string;
    position?: { side: 'left' | 'right'; verticalOffset: number };
  }) => Promise<void>;

  deleteBranch: (branchId: string) => Promise<void>;

  // Funciones de Frutos
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => Promise<string>; // Devuelve el ID del fruto creado
  updateFruit: (fruitId: string, updates: Partial<Omit<FruitType, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFruit: (fruitId: string) => Promise<void>;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  pendingInvitations: [],
  sharedTree: null,
  viewingTree: null,
  deletionRequests: [],

  fetchMyTree: async (isRefresh = false) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    if (isRefresh) set({ isRefreshing: true });
    else set({ isLoading: true });
    set({ error: null });

    try {
      // 1. Obtener Árbol - 🔧 CORRECCIÓN: Usar .limit(1) en lugar de .single() para manejar múltiples árboles
      let { data: treesData, error: treeError } = await supabase
        .from('trees')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true }) // Tomar el más antiguo si hay múltiples
        .limit(1);

      if (treeError) {
        console.error('❌ Error obteniendo árbol:', treeError);
        throw treeError;
      }

      let treeData = treesData && treesData.length > 0 ? treesData[0] : null;

      // Si no existe árbol, crearlo automáticamente
      if (!treeData) {
        console.log('🌳 No existe árbol, creando uno nuevo...');
        const { data: newTree, error: createError } = await supabase
          .from('trees')
          .insert([{ owner_id: userId, name: 'Mi Árbol' }])
          .select()
          .single();
        if (createError) {
          console.error('❌ Error creando árbol:', createError);
          throw createError;
        }
        treeData = newTree;
        console.log('✅ Árbol creado:', treeData.id);
      } else {
        console.log(`✅ Árbol encontrado: ${treeData.id} (creado: ${treeData.created_at})`);

        // ⚠️ ADVERTENCIA: Si hay múltiples árboles, informar al usuario
        const { count } = await supabase
          .from('trees')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId);

        if (count && count > 1) {
          console.warn(`⚠️ ADVERTENCIA: El usuario tiene ${count} árboles. Usando el más antiguo (${treeData.id}).`);
        }
      }

      console.log(`🔍 Buscando ramas para tree_id: ${treeData.id}`);

      // 2. Obtener Ramas
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('tree_id', treeData.id)
        .order('created_at', { ascending: true });

      if (branchesError) {
        console.error('❌ Error obteniendo ramas:', branchesError);
        throw branchesError;
      }

      console.log(`📦 Ramas obtenidas de Supabase: ${branches?.length || 0}`, branches?.map(b => ({ id: b.id, name: b.name, tree_id: b.tree_id })));

      const formattedBranches: BranchType[] = (branches || []).map((b: any) => {
        // 🔧 CORRECCIÓN: Parsear position si es string JSON
        let position = { x: 0, y: 0 };
        if (b.position) {
          if (typeof b.position === 'string') {
            try {
              position = JSON.parse(b.position);
            } catch (e) {
              console.warn('⚠️ Error parseando position:', b.position);
              position = { x: 0, y: 0 };
            }
          } else if (typeof b.position === 'object') {
            position = b.position;
          }
        }

        return {
          id: b.id,
          name: b.name,
          categoryId: b.category,
          color: b.color,
          createdAt: b.created_at,
          isShared: b.is_shared,
          position: position
        };
      });

      console.log(`📊 Ramas formateadas: ${formattedBranches.length}`, formattedBranches.map(b => ({ name: b.name, position: b.position })));

      // 3. Obtener Frutos - 🔧 CORRECCIÓN: Obtener frutos de todas las ramas del árbol
      // Si soy el dueño, veo todo. Si no, solo veo los públicos (RLS lo maneja)
      const branchIds = formattedBranches.map(b => b.id);
      let formattedFruits: FruitType[] = [];

      // Solo obtener frutos si hay ramas (los frutos siempre necesitan una rama)
      if (branchIds.length > 0) {
        // La política RLS ya filtra automáticamente según is_public y si soy dueño
        const { data: fruits, error: fruitsError } = await supabase
          .from('fruits')
          .select('*')
          .in('branch_id', branchIds)
          .order('created_at', { ascending: false });

        if (fruitsError) {
          console.error('❌ Error obteniendo frutos:', fruitsError);
          throw fruitsError;
        }

        formattedFruits = (fruits || []).map((f: any) => ({
          id: f.id,
          title: f.title,
          description: f.description || '',
          branchId: f.branch_id,
          mediaUrls: f.media_urls || [],
          createdAt: f.created_at,
          isShared: f.is_shared || false,
          isPublic: f.is_public !== undefined ? f.is_public : true, // Default true si no existe
          position: f.position || { x: 0, y: 0 },
          // ⚠️ NOTA: El SQL no tiene campo 'location' en fruits, se omite
        }));
      } else {
        console.log('ℹ️ No hay ramas, no se pueden cargar frutos');
      }

      // 4. Obtener Raíces (Familiares) - Incluir status, filtrar solo activas
      const { data: rootsData } = await supabase
        .from('family_connections')
        .select(`id, relation, created_at, status, relative:profiles!relative_id (name)`)
        .eq('user_id', userId)
        .eq('status', 'active'); // Solo mostrar conexiones activas

      const formattedRoots: RootType[] = (rootsData || []).map((r: any) => ({
        id: r.id,
        name: r.relative?.name || 'Familiar',
        relation: r.relation || 'Raíz',
        createdAt: r.created_at,
        treeId: treeData.id,
        status: r.status || 'active' // Incluir status, default 'active' para compatibilidad
      }));

      const updatedTree = {
        id: treeData.id,
        ownerId: treeData.owner_id,
        name: treeData.name,
        createdAt: treeData.created_at,
        branches: formattedBranches,
        fruits: formattedFruits,
        roots: formattedRoots
      };

      console.log(`✅ fetchMyTree completado: ${formattedBranches.length} ramas, ${formattedFruits.length} frutos`);

      set({
        tree: updatedTree,
        isLoading: false,
        isRefreshing: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching tree:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addBranch: async (branch) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // 🔧 CORRECCIÓN CRÍTICA: Obtener tree_id directamente de Supabase, no del estado local
    // Esto asegura que siempre usemos el tree_id correcto, incluso si el estado está desincronizado
    // Usar la misma lógica que fetchMyTree para garantizar consistencia
    let { data: treesData, error: treeError } = await supabase
      .from('trees')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true }) // Tomar el más antiguo si hay múltiples
      .limit(1);

    if (treeError) {
      console.error('❌ Error obteniendo árbol en addBranch:', treeError);
      throw treeError;
    }

    let treeData = treesData && treesData.length > 0 ? treesData[0] : null;

    if (!treeData) {
      // Crear árbol si no existe
      console.log('🌳 No existe árbol en addBranch, creando uno nuevo...');
      const { data: newTree, error: createError } = await supabase
        .from('trees')
        .insert([{ owner_id: userId, name: 'Mi Árbol' }])
        .select()
        .single();
      if (createError) {
        console.error('❌ Error creando árbol en addBranch:', createError);
        throw createError;
      }
      treeData = newTree;
      console.log('✅ Árbol creado en addBranch:', treeData?.id);
    } else {
      console.log(`✅ Árbol encontrado en addBranch: ${treeData?.id}`);
    }

    if (!treeData) {
      throw new Error('No se pudo obtener o crear el árbol');
    }

    const treeId = treeData.id;
    console.log(`🔍 addBranch usando tree_id: ${treeId}`);

    // Obtener ramas actuales para calcular posición
    const currentTree = get().tree;
    const branchesCount = currentTree?.branches?.length || 0;

    try {
      // 🧠 AUTO-LAYOUT: Calcular posición automática si es {0,0} o no existe
      let finalPosition = branch.position || { x: 0, y: 0 };

      // Si la posición es {0,0}, calcular automáticamente con algoritmo orgánico mejorado
      if (finalPosition.x === 0 && finalPosition.y === 0) {
        const isLeft = branchesCount % 2 === 0;
        const sideMultiplier = isLeft ? -1 : 1;

        // Altura variable: más arriba para las primeras ramas
        const verticalOffset = 120 + (branchesCount * 110);
        const newY = -verticalOffset; // Negativo para subir en el canvas

        // Longitud variable con variación orgánica
        const baseLength = 200;
        const lengthVariation = 30 * Math.sin(branchesCount * 0.5);
        const branchLength = baseLength + lengthVariation;

        // Ángulo variable para distribución más natural
        const angleVariation = (branchesCount % 3) * 8;
        const angle = 45 + angleVariation;
        const angleRad = (angle * Math.PI) / 180;

        const newX = sideMultiplier * branchLength * Math.cos(angleRad);

        finalPosition = { x: newX, y: newY };
        console.log(`🧠 Auto-layout orgánico calculado para rama ${branchesCount + 1}:`, finalPosition);
      }

      // ⚠️ IMPORTANTE: Solo enviar campos que existen en el SQL
      // El SQL tiene: id, tree_id, name, category, color, is_shared, position, created_at
      // NO tiene: user_id, description
      const insertData: any = {
        tree_id: treeId,
        name: branch.name.trim(),
        category: branch.categoryId,
        color: branch.color,
        is_shared: branch.isShared || false,
        position: finalPosition
      };

      console.log('📝 Insertando rama:', insertData);

      const { data: newBranch, error } = await supabase
        .from('branches')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando rama:', error);
        throw error;
      }

      console.log('✅ Rama insertada exitosamente:', newBranch);

      // ⚡ ACTUALIZACIÓN OPTIMISTA: Añadir inmediatamente al estado local
      const currentState = get();
      if (currentState.tree) {
        // 🔧 CORRECCIÓN: Parsear position si es string JSON
        let branchPosition = { x: 0, y: 0 };
        if (newBranch.position) {
          if (typeof newBranch.position === 'string') {
            try {
              branchPosition = JSON.parse(newBranch.position);
            } catch (e) {
              console.warn('⚠️ Error parseando position en addBranch:', newBranch.position);
              branchPosition = { x: 0, y: 0 };
            }
          } else if (typeof newBranch.position === 'object') {
            branchPosition = newBranch.position;
          }
        }

        const formattedBranch: BranchType = {
          id: newBranch.id,
          name: newBranch.name,
          categoryId: newBranch.category,
          color: newBranch.color,
          createdAt: newBranch.created_at,
          isShared: newBranch.is_shared || false,
          position: branchPosition
        };
        set({
          tree: {
            ...currentState.tree,
            branches: [...currentState.tree.branches, formattedBranch]
          }
        });
        console.log('✅ Estado actualizado inmediatamente con nueva rama');
      }

      // ⚡ SINCRONIZACIÓN FORZADA: Ejecutar fetchMyTree inmediatamente para asegurar consistencia
      console.log(`🔄 Sincronizando árbol después de crear rama "${newBranch.name}" (tree_id: ${treeId})`);
      try {
        await get().fetchMyTree(true); // Forzar refresh completo
        console.log('✅ fetchMyTree completado después de crear rama');

        // 🔍 VERIFICACIÓN: Comprobar que la rama esté en el estado
        const updatedTree = get().tree;
        if (updatedTree && updatedTree.branches) {
          const branchExists = updatedTree.branches.some(b => b.id === newBranch.id);
          console.log(`🔍 Verificación post-sync: Rama "${newBranch.name}" ${branchExists ? '✅ SÍ' : '❌ NO'} está en el estado`);
          console.log(`📊 Total de ramas en estado: ${updatedTree.branches.length}`);

          if (!branchExists) {
            console.warn('⚠️ La rama no está en el estado después de sincronizar. Esto puede indicar un problema con RLS o el tree_id.');
            // Intentar una segunda sincronización después de un pequeño delay
            setTimeout(async () => {
              await get().fetchMyTree(true);
              const retryTree = get().tree;
              const retryExists = retryTree?.branches?.some(b => b.id === newBranch.id);
              console.log(`🔄 Reintento: Rama ${retryExists ? '✅ encontrada' : '❌ aún no encontrada'}`);
            }, 500);
          }
        } else {
          console.warn('⚠️ No hay árbol en el estado después de sincronizar');
        }
      } catch (err) {
        console.error('❌ Error en fetchMyTree después de crear rama:', err);
        // No lanzar error, la actualización optimista ya se hizo
      }
    } catch (e: any) {
      console.error('❌ Error en addBranch:', e);
      set({ error: e.message || 'No se pudo crear la rama' });
      throw e;
    }
  },

  updateBranch: async (branchId: string, updates: {
    name?: string;
    color?: string;
    position?: { side: 'left' | 'right'; verticalOffset: number };
  }) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    console.log('🔧 Actualizando rama:', branchId, updates);

    // Actualización optimista: actualizar estado local inmediatamente
    const currentState = get();
    const previousTree = currentState.tree;

    if (previousTree) {
      const updatedBranches = previousTree.branches.map(branch => {
        if (branch.id === branchId) {
          return {
            ...branch,
            ...(updates.name && { name: updates.name }),
            ...(updates.color && { color: updates.color }),
            ...(updates.position && { position: updates.position as any }) // Allow flexible position format
          };
        }
        return branch;
      });

      set({
        tree: {
          ...previousTree,
          branches: updatedBranches
        }
      });
      console.log('✅ Estado local actualizado (optimista)');
    }

    try {
      // Preparar datos para Supabase
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.position !== undefined) updateData.position = updates.position;

      console.log('📝 Actualizando en Supabase:', updateData);

      const { error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', branchId);

      if (error) {
        console.error('❌ Error actualizando rama:', error);
        // Restaurar estado anterior si falla
        set({ tree: previousTree });
        throw error;
      }

      console.log('✅ Rama actualizada exitosamente en Supabase');

      // Sincronizar estado completo
      await get().fetchMyTree(true);
    } catch (e: any) {
      console.error('❌ Error en updateBranch:', e);
      set({ error: e.message || 'No se pudo actualizar la rama' });
      throw e;
    }
  },

  deleteBranch: async (branchId) => {
    console.log('🗑️ [TreeStore] Iniciando borrado de rama:', branchId);

    const state = get();
    const previousTree = state.tree;
    const previousSharedTree = state.sharedTree;
    const previousViewingTree = state.viewingTree;

    // Actualización optimista: eliminar del estado local inmediatamente
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          branches: previousTree.branches.filter(b => b.id !== branchId),
          fruits: previousTree.fruits.filter(f => f.branchId !== branchId)
        }
      });
      console.log('✅ [TreeStore] Estado local actualizado (optimista)');
    }

    if (previousSharedTree) {
      set({
        sharedTree: {
          ...previousSharedTree,
          branches: previousSharedTree.branches.filter(b => b.id !== branchId),
          fruits: previousSharedTree.fruits.filter(f => f.branchId !== branchId)
        }
      });
    }

    if (previousViewingTree) {
      set({
        viewingTree: {
          ...previousViewingTree,
          branches: previousViewingTree.branches.filter(b => b.id !== branchId),
          fruits: previousViewingTree.fruits.filter(f => f.branchId !== branchId)
        }
      });
    }

    try {
      // 🗑️ PASO 1: Obtener todos los frutos de la rama para borrar sus medios
      console.log('🗑️ [TreeStore] Obteniendo frutos de la rama para limpieza de basura...');
      const { data: fruits, error: fruitsError } = await supabase
        .from('fruits')
        .select('media_urls')
        .eq('branch_id', branchId);

      if (fruitsError) {
        console.warn('⚠️ Error obteniendo frutos para limpieza (continuando borrado de DB):', fruitsError);
      } else if (fruits && fruits.length > 0) {
        // Recopilar todas las URLs de todos los frutos
        const allMediaUrls = fruits.flatMap(f => f.media_urls || []);

        if (allMediaUrls.length > 0) {
          const filePaths: string[] = [];

          allMediaUrls.forEach((url: string) => {
            try {
              // Misma lógica de extracción de path que en deleteFruit
              const memoriesIndex = url.indexOf('/memories/');
              if (memoriesIndex !== -1) {
                let filePath = url.substring(memoriesIndex + '/memories/'.length);
                const queryIndex = filePath.indexOf('?');
                if (queryIndex !== -1) {
                  filePath = filePath.substring(0, queryIndex);
                }
                filePath = decodeURIComponent(filePath);
                if (filePath) filePaths.push(filePath);
              }
            } catch (e) {
              console.warn('⚠️ Error procesando URL para borrado:', url);
            }
          });

          if (filePaths.length > 0) {
            console.log(`🗑️ Eliminando ${filePaths.length} archivos asociados a la rama...`);
            const { error: storageError } = await supabase
              .storage
              .from('memories')
              .remove(filePaths);

            if (storageError) {
              console.warn('⚠️ Error en borrado masivo del storage:', storageError);
            } else {
              console.log('✅ Limpieza de archivos completada.');
            }
          }
        }
      }

      // 🗑️ PASO 2: Borrar la rama de la DB
      console.log('🗑️ [TreeStore] Ejecutando DELETE rama en Supabase...');
      // ON DELETE CASCADE en Postgres debería borrar los frutos automáticamente
      const { data, error } = await supabase.from('branches').delete().eq('id', branchId).select();

      if (error) {
        console.error('❌ [TreeStore] Error de Supabase al borrar rama:', error);

        // Si falla, restaurar todos los estados anteriores
        set({
          tree: previousTree,
          sharedTree: previousSharedTree,
          viewingTree: previousViewingTree
        });

        const isPermissionError = error.code === '42501' ||
          error.message?.toLowerCase().includes('policy') ||
          error.message?.toLowerCase().includes('permission') ||
          error.message?.toLowerCase().includes('rls');

        const errorMessage = isPermissionError
          ? 'Error de permisos: Verifica las políticas RLS en Supabase'
          : (error.message || 'No se pudo borrar la rama');

        throw new Error(errorMessage);
      }

      console.log('✅ [TreeStore] Rama borrada exitosamente en Supabase');
    } catch (error: any) {
      console.error('❌ [TreeStore] Error completo al borrar rama:', error);
      set({ error: 'No se pudo borrar la rama.' });
      await get().fetchMyTree();
      throw error;
    }
  },

  addFruit: async (fruit) => {
    try {
      // ⚠️ IMPORTANTE: Solo enviar campos que existen en el SQL
      // El SQL tiene: id, branch_id, title, description, media_urls, date, is_shared, is_public, position, created_at
      // NO tiene: user_id, tree_id, location
      const insertData: any = {
        branch_id: fruit.branchId,
        title: fruit.title.trim(),
        description: fruit.description || null,
        media_urls: Array.isArray(fruit.mediaUrls) ? fruit.mediaUrls : (fruit.mediaUrls ? [fruit.mediaUrls] : []),
        is_shared: fruit.isShared || false,
        is_public: fruit.isPublic !== undefined ? fruit.isPublic : true, // Default true
        date: fruit.date ? new Date(fruit.date).toISOString() : new Date().toISOString(),
        position: fruit.position || { x: 0, y: 0 },
      };

      // VALIDACIÓN DE SEGURIDAD: Prevenir guardado de blobs/files
      if (insertData.media_urls && Array.isArray(insertData.media_urls)) {
        const invalidUrls = insertData.media_urls.filter((url: string) =>
          url.startsWith('blob:') ||
          url.startsWith('file:') ||
          url.startsWith('content:') ||
          url.startsWith('data:')
        );

        if (invalidUrls.length > 0) {
          console.error('❌ INTENTO DE GUARDAR URLS TEMPORALES:', invalidUrls);
          throw new Error(`Error crítico: Se intentó guardar ${invalidUrls.length} archivo(s) sin subir correctamente. Por favor intenta de nuevo.`);
        }
      }

      console.log('📝 Insertando fruto:', insertData);

      const { data: newFruit, error } = await supabase
        .from('fruits')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando fruto:', error);
        throw error;
      }

      console.log('✅ Fruto insertado exitosamente:', newFruit);

      // ⚡ ACTUALIZACIÓN OPTIMISTA: Añadir inmediatamente al estado local
      const currentState = get();
      if (currentState.tree) {
        const formattedFruit: FruitType = {
          id: newFruit.id,
          title: newFruit.title,
          description: newFruit.description || '',
          branchId: newFruit.branch_id,
          mediaUrls: newFruit.media_urls || [],
          createdAt: newFruit.created_at,
          isShared: newFruit.is_shared || false,
          isPublic: newFruit.is_public !== undefined ? newFruit.is_public : true,
          position: newFruit.position || { x: 0, y: 0 },
        };
        set({
          tree: {
            ...currentState.tree,
            fruits: [...currentState.tree.fruits, formattedFruit]
          }
        });
        console.log('✅ Estado actualizado inmediatamente con nuevo fruto');
      }

      // ⚡ SINCRONIZACIÓN FORZADA: Ejecutar fetchMyTree inmediatamente para asegurar consistencia
      try {
        await get().fetchMyTree();
        console.log('✅ Árbol sincronizado después de crear fruto');
      } catch (err) {
        console.warn('⚠️ Error en fetchMyTree después de crear fruto:', err);
        // No lanzar error, la actualización optimista ya se hizo
      }

      // Actualizar racha
      useUserStore.getState().updateStreak();

      // Devolver el ID del fruto creado para redirección
      return newFruit.id;
    } catch (e: any) {
      console.error('❌ Error en addFruit:', e);
      set({ error: e.message || 'No se pudo crear el recuerdo' });
      throw e;
    }
  },

  updateFruit: async (fruitId: string, updates: Partial<Omit<FruitType, 'id' | 'createdAt'>>) => {
    try {
      // ⚠️ IMPORTANTE: Solo actualizar campos que existen en el SQL
      // El SQL tiene: title, description, media_urls, date, is_shared, is_public, position
      // NO tiene: location, user_id, tree_id
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.mediaUrls !== undefined) {
        updateData.media_urls = Array.isArray(updates.mediaUrls)
          ? updates.mediaUrls
          : (updates.mediaUrls ? [updates.mediaUrls] : []);
      }
      if (updates.branchId !== undefined) updateData.branch_id = updates.branchId;
      if (updates.isShared !== undefined) updateData.is_shared = updates.isShared;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.position !== undefined) updateData.position = updates.position;
      // ⚠️ NO incluir 'location' porque no existe en el SQL

      const { error } = await supabase
        .from('fruits')
        .update(updateData)
        .eq('id', fruitId);

      if (error) {
        console.error('❌ Error actualizando fruto:', error);
        throw error;
      }

      await get().fetchMyTree();
    } catch (e: any) {
      console.error('❌ Error en updateFruit:', e);
      set({ error: e.message || 'No se pudo actualizar el recuerdo' });
      throw e;
    }
  },

  deleteFruit: async (fruitId: string) => {
    console.log('🗑️ [TreeStore] Iniciando borrado de recuerdo:', fruitId);

    const state = get();
    const previousTree = state.tree;
    const previousSharedTree = state.sharedTree;
    const previousViewingTree = state.viewingTree;

    // Actualización optimista: eliminar del estado local inmediatamente
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          fruits: previousTree.fruits.filter(f => f.id !== fruitId)
        }
      });
      console.log('✅ [TreeStore] Estado local actualizado (optimista)');
    }

    // También actualizar sharedTree/viewingTree si están activos
    if (previousSharedTree) {
      set({
        sharedTree: {
          ...previousSharedTree,
          fruits: previousSharedTree.fruits.filter(f => f.id !== fruitId)
        }
      });
    }

    if (previousViewingTree) {
      set({
        viewingTree: {
          ...previousViewingTree,
          fruits: previousViewingTree.fruits.filter(f => f.id !== fruitId)
        }
      });
    }

    try {
      // 🗑️ PASO 1: Obtener el fruto con sus media_urls antes de borrarlo
      console.log('🗑️ [TreeStore] Obteniendo datos del recuerdo...');
      const { data: fruitData, error: fetchError } = await supabase
        .from('fruits')
        .select('media_urls')
        .eq('id', fruitId)
        .single();

      if (fetchError) {
        console.error('❌ [TreeStore] Error obteniendo recuerdo para borrar:', fetchError);
        console.error('❌ [TreeStore] Código:', fetchError.code);
        console.error('❌ [TreeStore] Mensaje:', fetchError.message);

        // Restaurar estado
        set({
          tree: previousTree,
          sharedTree: previousSharedTree,
          viewingTree: previousViewingTree
        });

        const enhancedError = new Error(fetchError.message || 'No se pudo obtener el recuerdo para borrar');
        (enhancedError as any).code = fetchError.code;
        (enhancedError as any).error = fetchError;
        throw enhancedError;
      }

      // 🗑️ PASO 2: Si tiene URLs de medios, borrar los archivos del storage
      if (fruitData?.media_urls && Array.isArray(fruitData.media_urls) && fruitData.media_urls.length > 0) {
        const filePaths: string[] = [];

        fruitData.media_urls.forEach((url: string) => {
          try {
            // Extraer la ruta relativa del archivo desde la URL completa
            // Formato esperado: https://[project].supabase.co/storage/v1/object/public/memories/[ruta]
            // O: https://[project].supabase.co/storage/v1/object/sign/memories/[ruta]?...

            // Buscar el patrón '/memories/' en la URL
            const memoriesIndex = url.indexOf('/memories/');
            if (memoriesIndex !== -1) {
              // Extraer todo lo que viene después de '/memories/'
              let filePath = url.substring(memoriesIndex + '/memories/'.length);

              // Si hay query params (como ?token=...), eliminarlos
              const queryIndex = filePath.indexOf('?');
              if (queryIndex !== -1) {
                filePath = filePath.substring(0, queryIndex);
              }

              // Decodificar la URL si está codificada
              filePath = decodeURIComponent(filePath);

              if (filePath) {
                filePaths.push(filePath);
                console.log(`📁 Archivo a borrar: ${filePath}`);
              }
            } else {
              console.warn(`⚠️ URL no contiene '/memories/': ${url}`);
            }
          } catch (urlError) {
            console.error('❌ Error procesando URL:', url, urlError);
          }
        });

        // Borrar archivos del storage si hay rutas válidas
        if (filePaths.length > 0) {
          console.log(`🗑️ Borrando ${filePaths.length} archivo(s) del storage...`);
          const { data: deleteData, error: storageError } = await supabase
            .storage
            .from('memories')
            .remove(filePaths);

          if (storageError) {
            console.error('⚠️ Error borrando archivos del storage (continuando con borrado de registro):', storageError);
            // No lanzar error aquí, continuar con el borrado del registro
          } else {
            console.log(`✅ ${deleteData?.length || 0} archivo(s) borrado(s) del storage`);
          }
        }
      }

      // 🗑️ PASO 3: Borrar el registro de la tabla fruits
      console.log('🗑️ [TreeStore] Ejecutando DELETE en Supabase...');
      const { data, error } = await supabase.from('fruits').delete().eq('id', fruitId).select();

      if (error) {
        console.error('❌ [TreeStore] Error de Supabase al borrar recuerdo:', error);
        console.error('❌ [TreeStore] Código de error:', error.code);
        console.error('❌ [TreeStore] Mensaje:', error.message);
        console.error('❌ [TreeStore] Detalles:', error.details);

        // Si falla, restaurar todos los estados anteriores
        set({
          tree: previousTree,
          sharedTree: previousSharedTree,
          viewingTree: previousViewingTree
        });

        // Verificar si es error de permisos/RLS
        const isPermissionError = error.code === '42501' ||
          error.message?.toLowerCase().includes('policy') ||
          error.message?.toLowerCase().includes('permission') ||
          error.message?.toLowerCase().includes('rls');

        // Crear un error más descriptivo
        const errorMessage = isPermissionError
          ? 'Error de permisos: Verifica las políticas RLS en Supabase'
          : (error.message || 'No se pudo borrar el recuerdo');

        const enhancedError = new Error(errorMessage);
        (enhancedError as any).code = error.code;
        (enhancedError as any).error = error;
        throw enhancedError;
      }

      console.log('✅ [TreeStore] Recuerdo borrado exitosamente en Supabase');
      console.log('✅ [TreeStore] Datos borrados:', data);

    } catch (error: any) {
      console.error('❌ [TreeStore] Error completo al borrar recuerdo:', error);
      // El estado ya se restauró arriba si falló
      set({ error: 'No se pudo borrar el recuerdo.' });
      // Recargar árbol para sincronizar
      await get().fetchMyTree();
      throw error;
    }
  },

  // 📬 FUNCIONES DE INVITACIONES
  fetchPendingInvitations: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    try {
      // 1. Obtener todas las invitaciones donde soy el receptor
      const { data: invitations, error: invitationsError } = await supabase
        .from('tree_permissions')
        .select(`
          id,
          tree_id,
          granter_id,
          scope,
          allowed_branch_ids,
          created_at,
          sender:profiles!granter_id (name, avatar_url)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('❌ Error obteniendo invitaciones:', invitationsError);
        set({ pendingInvitations: [] });
        return;
      }

      // 2. Obtener mis raíces actuales para filtrar invitaciones ya aceptadas
      const { data: myRoots } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', userId);

      const acceptedGranterIds = new Set((myRoots || []).map((r: any) => r.relative_id));

      // 3. Filtrar: solo mostrar invitaciones de personas que NO están en mis raíces
      const pending = (invitations || [])
        .filter((inv: any) => {
          const granterId = inv.granter_id;
          return granterId && !acceptedGranterIds.has(granterId);
        })
        .map((inv: any) => ({
          id: inv.id,
          tree_id: inv.tree_id,
          granter_id: inv.granter_id,
          sender: {
            name: inv.sender?.name || 'Usuario',
            avatar_url: inv.sender?.avatar_url || null,
          },
          scope: inv.scope || 'all',
          allowed_branch_ids: inv.allowed_branch_ids || null,
          created_at: inv.created_at,
        }));

      console.log(`✅ Invitaciones pendientes encontradas: ${pending.length}`);
      set({ pendingInvitations: pending });
    } catch (error: any) {
      console.error('❌ Error en fetchPendingInvitations:', error);
      set({ pendingInvitations: [] });
    }
  },

  acceptInvitation: async (invitationId: string, granterId: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      // 1. Obtener información del invitador antes de crear la conexión
      const { data: granterProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', granterId)
        .single();

      // 2. Crear conexión familiar (añadir como raíz)
      let connectionData: { id: string; relative_id: string } | null = null;

      const { data: newConnection, error: connectionError } = await supabase
        .from('family_connections')
        .insert({
          user_id: userId,
          relative_id: granterId,
          relation: 'Familiar',
        })
        .select()
        .single();

      if (connectionError) {
        // Si ya existe la conexión, no es un error crítico
        if (!connectionError.message?.includes('duplicate') && !connectionError.message?.includes('unique')) {
          console.error('❌ Error creando conexión familiar:', connectionError);
          throw connectionError;
        }
        console.log('ℹ️ La conexión familiar ya existía');

        // Si ya existe, obtener la conexión existente
        const { data: existingConnection } = await supabase
          .from('family_connections')
          .select('id, relative_id')
          .eq('user_id', userId)
          .eq('relative_id', granterId)
          .single();

        if (existingConnection) {
          connectionData = existingConnection;
        }
      } else if (newConnection) {
        connectionData = newConnection;
      }

      // 3. 📬 ACTUALIZACIÓN INMEDIATA DEL ESTADO LOCAL
      // Eliminar la invitación del array local de inmediato
      const currentState = get();
      const updatedInvitations = currentState.pendingInvitations.filter(
        inv => inv.id !== invitationId
      );

      // Añadir el nuevo familiar al array roots si tenemos la información
      let updatedRoots = currentState.tree?.roots || [];
      if (connectionData && granterProfile) {
        const newRoot: RootType = {
          id: connectionData.id,
          name: granterProfile.name || 'Familiar',
          relation: 'Familiar',
          createdAt: new Date().toISOString(),
          treeId: currentState.tree?.id || '',
          status: 'active'
        };

        // Verificar que no exista ya en roots para evitar duplicados
        const rootExists = updatedRoots.some(root => root.id === connectionData.id);
        if (!rootExists) {
          updatedRoots = [...updatedRoots, newRoot];
        }
      }

      // Actualizar el estado inmediatamente
      set({
        pendingInvitations: updatedInvitations,
        tree: currentState.tree ? {
          ...currentState.tree,
          roots: updatedRoots
        } : null
      });

      // 4. Recargar árbol para sincronizar con la BD (en background)
      get().fetchMyTree(true).catch(err => {
        console.warn('⚠️ Error al recargar árbol después de aceptar invitación:', err);
      });

      // 5. Recargar invitaciones para asegurar consistencia
      get().fetchPendingInvitations().catch(err => {
        console.warn('⚠️ Error al recargar invitaciones:', err);
      });

      console.log('✅ Invitación aceptada exitosamente');
    } catch (error: any) {
      console.error('❌ Error aceptando invitación:', error);
      throw error;
    }
  },

  rejectInvitation: async (invitationId: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      // Verificar que la invitación es para este usuario
      const { data: invitation, error: fetchError } = await supabase
        .from('tree_permissions')
        .select('id, recipient_id')
        .eq('id', invitationId)
        .eq('recipient_id', userId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitación no encontrada o inválida');
      }

      // Eliminar el permiso
      const { error: deleteError } = await supabase
        .from('tree_permissions')
        .delete()
        .eq('id', invitationId);

      if (deleteError) {
        console.error('❌ Error rechazando invitación:', deleteError);
        throw deleteError;
      }

      console.log('✅ Invitación rechazada exitosamente');
      await get().fetchPendingInvitations();
    } catch (error: any) {
      console.error('❌ Error en rejectInvitation:', error);
      throw error;
    }
  },

  fetchSharedTree: async (relativeIdOrTreeId: string, isTreeId: boolean = false) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      set({ isLoading: true, error: null });

      let treeData: any;

      if (isTreeId) {
        // Si es treeId, obtener directamente
        const { data: treesData, error: treeError } = await supabase
          .from('trees')
          .select('*')
          .eq('id', relativeIdOrTreeId)
          .single();

        if (treeError) {
          console.error('❌ Error obteniendo árbol compartido:', treeError);
          throw treeError;
        }

        if (!treesData) {
          set({ sharedTree: null, viewingTree: null, isLoading: false });
          return;
        }

        treeData = treesData;
      } else {
        // Si es relativeId, obtener el árbol del familiar
        const { data: treesData, error: treeError } = await supabase
          .from('trees')
          .select('*')
          .eq('owner_id', relativeIdOrTreeId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (treeError) {
          console.error('❌ Error obteniendo árbol compartido:', treeError);
          throw treeError;
        }

        if (!treesData || treesData.length === 0) {
          set({ sharedTree: null, viewingTree: null, isLoading: false });
          return;
        }

        treeData = treesData[0];
      }

      // 2. Verificar que tengo acceso a este árbol (permiso explícito o conexión familiar)
      // Primero verificar si tengo permiso explícito
      const { data: permissions } = await supabase
        .from('tree_permissions')
        .select('scope, allowed_branch_ids')
        .eq('tree_id', treeData.id)
        .eq('recipient_id', userId)
        .maybeSingle();

      // También verificar si soy familiar (tengo conexión familiar activa)
      const { data: familyConnection } = await supabase
        .from('family_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('relative_id', treeData.owner_id)
        .eq('status', 'active')
        .maybeSingle();

      // Si no tengo permiso explícito ni conexión familiar, no puedo ver el árbol
      if (!permissions && !familyConnection) {
        throw new Error('No tienes permiso para ver este árbol.');
      }

      const scope = permissions?.scope || 'all';
      const allowedBranchIds = permissions?.allowed_branch_ids || null;

      // 3. Obtener TODAS las ramas del árbol (en tiempo real, no copias estáticas)
      // Si el scope es 'custom', solo obtener ramas permitidas
      let branchesQuery = supabase
        .from('branches')
        .select('*')
        .eq('tree_id', treeData.id);

      if (scope === 'custom' && allowedBranchIds && allowedBranchIds.length > 0) {
        branchesQuery = branchesQuery.in('id', allowedBranchIds);
      }

      const { data: branches, error: branchesError } = await branchesQuery.order('created_at', { ascending: true });

      if (branchesError) {
        console.error('❌ Error obteniendo ramas compartidas:', branchesError);
        throw branchesError;
      }

      const formattedBranches: BranchType[] = (branches || []).map((b: any) => {
        let position = { x: 0, y: 0 };
        if (b.position) {
          if (typeof b.position === 'string') {
            try {
              position = JSON.parse(b.position);
            } catch (e) {
              position = { x: 0, y: 0 };
            }
          } else if (typeof b.position === 'object') {
            position = b.position;
          }
        }

        return {
          id: b.id,
          name: b.name,
          categoryId: b.category,
          color: b.color,
          createdAt: b.created_at,
          isShared: b.is_shared,
          position: position,
        };
      });

      // 4. Obtener frutos de las ramas permitidas
      const branchIds = formattedBranches.map(b => b.id);
      let formattedFruits: FruitType[] = [];

      if (branchIds.length > 0) {
        // Si NO soy el dueño, filtrar explícitamente solo frutos públicos
        const userId = useUserStore.getState().user?.id;
        const isOwner = treeData.owner_id === userId;

        let fruitsQuery = supabase
          .from('fruits')
          .select('*')
          .in('branch_id', branchIds);

        if (!isOwner) {
          fruitsQuery = fruitsQuery.eq('is_public', true);
        }

        const { data: fruits, error: fruitsError } = await fruitsQuery
          .order('created_at', { ascending: false });

        if (fruitsError) {
          console.error('❌ Error obteniendo frutos compartidos:', fruitsError);
          throw fruitsError;
        }

        formattedFruits = (fruits || []).map((f: any) => ({
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
      }

      // 5. Obtener información del dueño del árbol
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', treeData.owner_id)
        .single();

      const sharedTree: TreeType = {
        id: treeData.id,
        ownerId: treeData.owner_id,
        name: ownerProfile?.name || 'Árbol Familiar',
        createdAt: treeData.created_at,
        branches: formattedBranches,
        fruits: formattedFruits,
        roots: [], // No mostramos raíces del árbol compartido
      };

      console.log(`✅ Árbol compartido cargado (en tiempo real): ${formattedBranches.length} ramas, ${formattedFruits.length} frutos`);
      set({ sharedTree, viewingTree: sharedTree, isLoading: false, error: null });
    } catch (error: any) {
      console.error('❌ Error en fetchSharedTree:', error);
      set({ error: error.message || 'No se pudo cargar el árbol compartido', isLoading: false, sharedTree: null, viewingTree: null });
      throw error;
    }
  },

  updateRootRelation: async (connectionId: string, newRelation: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      // Verificar que la conexión pertenece al usuario
      const { data: connection, error: fetchError } = await supabase
        .from('family_connections')
        .select('id, user_id')
        .eq('id', connectionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !connection) {
        throw new Error('Conexión no encontrada o inválida');
      }

      // Actualizar la relación
      const { error: updateError } = await supabase
        .from('family_connections')
        .update({ relation: newRelation.trim() })
        .eq('id', connectionId);

      if (updateError) {
        console.error('❌ Error actualizando relación:', updateError);
        throw updateError;
      }

      console.log('✅ Relación actualizada exitosamente');
      await get().fetchMyTree(true);
    } catch (error: any) {
      console.error('❌ Error en updateRootRelation:', error);
      throw error;
    }
  },

  // 🗑️ FUNCIONES DE ELIMINACIÓN SEGURA DE RAÍCES
  requestRemoveRoot: async (rootId: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      // Actualizar status a 'pending_deletion' en lugar de borrar
      const { error } = await supabase
        .from('family_connections')
        .update({ status: 'pending_deletion' })
        .eq('id', rootId)
        .eq('user_id', userId); // Solo el dueño puede solicitar eliminación

      if (error) {
        console.error('❌ Error solicitando eliminación de raíz:', error);
        throw error;
      }

      console.log('✅ Solicitud de eliminación creada para raíz:', rootId);

      // Actualizar estado local
      const currentTree = get().tree;
      if (currentTree) {
        const updatedRoots = currentTree.roots.map(root =>
          root.id === rootId ? { ...root, status: 'pending_deletion' as const } : root
        );
        set({
          tree: {
            ...currentTree,
            roots: updatedRoots
          }
        });
      }

      // Recargar árbol para sincronizar
      await get().fetchMyTree(true);
    } catch (error: any) {
      console.error('❌ Error en requestRemoveRoot:', error);
      throw error;
    }
  },

  fetchDeletionRequests: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    try {
      // Buscar conexiones donde YO soy el relative_id y el status es 'pending_deletion'
      const { data: requests, error } = await supabase
        .from('family_connections')
        .select(`
          id,
          user_id,
          relation,
          created_at,
          requester:profiles!user_id (name, avatar_url)
        `)
        .eq('relative_id', userId)
        .eq('status', 'pending_deletion')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo solicitudes de eliminación:', error);
        set({ deletionRequests: [] });
        return;
      }

      const formatted = (requests || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        requester: {
          name: r.requester?.name || 'Usuario',
          avatar_url: r.requester?.avatar_url || null,
        },
        relation: r.relation || 'Familiar',
        created_at: r.created_at,
      }));

      console.log(`✅ Solicitudes de eliminación encontradas: ${formatted.length}`);
      set({ deletionRequests: formatted });
    } catch (error: any) {
      console.error('❌ Error en fetchDeletionRequests:', error);
      set({ deletionRequests: [] });
    }
  },

  confirmRemoveRoot: async (connectionId: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      // Verificar que la solicitud existe y es para este usuario
      const { data: connection, error: fetchError } = await supabase
        .from('family_connections')
        .select('id, relative_id, status')
        .eq('id', connectionId)
        .eq('relative_id', userId)
        .eq('status', 'pending_deletion')
        .single();

      if (fetchError || !connection) {
        throw new Error('Solicitud de eliminación no encontrada o inválida');
      }

      // Borrar definitivamente la conexión
      const { error: deleteError } = await supabase
        .from('family_connections')
        .delete()
        .eq('id', connectionId);

      if (deleteError) {
        console.error('❌ Error confirmando eliminación:', deleteError);
        throw deleteError;
      }

      console.log('✅ Eliminación confirmada y conexión borrada:', connectionId);

      // Recargar solicitudes y árbol
      await get().fetchDeletionRequests();
      await get().fetchMyTree(true);
    } catch (error: any) {
      console.error('❌ Error en confirmRemoveRoot:', error);
      throw error;
    }
  },

  // 📤 FUNCIÓN PARA COMPARTIR ÁRBOL CON VALIDACIÓN DE DUPLICADOS
  shareTree: async (params) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    const { recipientEmail, treeId, scope, allowedBranchIds } = params;
    const normalizedEmail = recipientEmail.toLowerCase().trim();

    try {
      // 🚫 VALIDACIÓN 1: Buscar si el usuario destino existe en ALMA
      const { data: recipientUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      const recipientId = recipientUser?.id || null;

      // 🚫 VALIDACIÓN 2: Verificar si ya existe un permiso para este email en este árbol
      const { data: existingPermission } = await supabase
        .from('tree_permissions')
        .select('id')
        .eq('tree_id', treeId)
        .or(`recipient_email.eq.${normalizedEmail}${recipientId ? `,recipient_id.eq.${recipientId}` : ''}`)
        .maybeSingle();

      if (existingPermission) {
        throw new Error('Ya has compartido tu árbol con esta persona.');
      }

      // 🚫 VALIDACIÓN 3: Si el usuario tiene cuenta, verificar si ya existe una conexión familiar
      if (recipientId) {
        const { data: existingConnection } = await supabase
          .from('family_connections')
          .select('id')
          .eq('user_id', userId)
          .eq('relative_id', recipientId)
          .maybeSingle();

        if (existingConnection) {
          throw new Error('Ya has compartido tu árbol con esta persona o ya es parte de tu familia.');
        }
      }

      // ✅ Si pasa todas las validaciones, crear el permiso
      const { error: permissionError } = await supabase
        .from('tree_permissions')
        .insert({
          tree_id: treeId,
          recipient_email: normalizedEmail,
          recipient_id: recipientId,
          scope: scope,
          allowed_branch_ids: scope === 'custom' ? allowedBranchIds : null,
          access_level: 'view',
          granter_id: userId,
        });

      if (permissionError) {
        console.error('❌ Error creando permiso:', permissionError);
        throw permissionError;
      }

      // ✅ Si el usuario tiene cuenta, crear conexión familiar
      if (recipientId) {
        const { error: connectionError } = await supabase
          .from('family_connections')
          .insert({
            user_id: userId,
            relative_id: recipientId,
            relation: 'Familiar'
          });

        // Si la conexión ya existe (edge case), no es un error crítico
        if (connectionError && !connectionError.message?.includes('duplicate') && !connectionError.message?.includes('unique')) {
          console.warn('⚠️ Error creando conexión familiar (no crítico):', connectionError);
        }
      }

      console.log('✅ Árbol compartido exitosamente con:', normalizedEmail);
    } catch (error: any) {
      console.error('❌ Error en shareTree:', error);
      throw error;
    }
  },
}));