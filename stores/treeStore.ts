import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';
import { useUserStore } from './userStore';

interface TreeState {
  tree: TreeType | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchMyTree: (isRefresh?: boolean) => Promise<void>;

  // CORRECCIÓN AQUÍ: Actualizamos la definición para aceptar 'position'
  addBranch: (branch: {
    name: string;
    categoryId: string;
    color: string;
    description?: string;            // Opcional
    position?: { x: number; y: number }; // Opcional (Esto arregla tu error)
    isShared?: boolean;              // Opcional
  }) => Promise<void>;

  deleteBranch: (branchId: string) => Promise<void>;

  // Funciones de Frutos
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => Promise<void>;
  updateFruit: (fruitId: string, updates: Partial<Omit<FruitType, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFruit: (fruitId: string) => Promise<void>;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

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
      const branchIds = formattedBranches.map(b => b.id);
      let formattedFruits: FruitType[] = [];

      // Solo obtener frutos si hay ramas (los frutos siempre necesitan una rama)
      if (branchIds.length > 0) {
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
          position: f.position || { x: 0, y: 0 },
          // ⚠️ NOTA: El SQL no tiene campo 'location' en fruits, se omite
        }));
      } else {
        console.log('ℹ️ No hay ramas, no se pueden cargar frutos');
      }

      // 4. Obtener Raíces (Familiares)
      const { data: rootsData } = await supabase
        .from('family_connections')
        .select(`id, relation, created_at, relative:profiles!relative_id (name)`)
        .eq('user_id', userId);

      const formattedRoots: RootType[] = (rootsData || []).map((r: any) => ({
        id: r.id,
        name: r.relative?.name || 'Familiar',
        relation: r.relation || 'Raíz',
        createdAt: r.created_at,
        treeId: treeData.id
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
      console.log('✅ Árbol creado en addBranch:', treeData.id);
    } else {
      console.log(`✅ Árbol encontrado en addBranch: ${treeData.id}`);
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

  deleteBranch: async (branchId) => {
    const previousTree = get().tree;

    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          branches: previousTree.branches.filter(b => b.id !== branchId),
          fruits: previousTree.fruits.filter(f => f.branchId !== branchId)
        }
      });
    }

    try {
      const { error } = await supabase.from('branches').delete().eq('id', branchId);
      if (error) throw error;

    } catch (error: any) {
      console.error('Error deleting branch:', error);
      set({ tree: previousTree, error: 'No se pudo borrar la rama.' });
      get().fetchMyTree();
    }
  },

  addFruit: async (fruit) => {
    try {
      // ⚠️ IMPORTANTE: Solo enviar campos que existen en el SQL
      // El SQL tiene: id, branch_id, title, description, media_urls, date, is_shared, position, created_at
      // NO tiene: user_id, tree_id, location
      const insertData: any = {
        branch_id: fruit.branchId,
        title: fruit.title.trim(),
        description: fruit.description || null,
        media_urls: Array.isArray(fruit.mediaUrls) ? fruit.mediaUrls : (fruit.mediaUrls ? [fruit.mediaUrls] : []),
        is_shared: fruit.isShared || false,
        date: fruit.date ? new Date(fruit.date).toISOString() : new Date().toISOString(),
        position: fruit.position || { x: 0, y: 0 },
      };

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
    } catch (e: any) {
      console.error('❌ Error en addFruit:', e);
      set({ error: e.message || 'No se pudo crear el recuerdo' });
      throw e;
    }
  },

  updateFruit: async (fruitId: string, updates: Partial<Omit<FruitType, 'id' | 'createdAt'>>) => {
    try {
      // ⚠️ IMPORTANTE: Solo actualizar campos que existen en el SQL
      // El SQL tiene: title, description, media_urls, date, is_shared, position
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
    const previousTree = get().tree;

    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          fruits: previousTree.fruits.filter(f => f.id !== fruitId)
        }
      });
    }

    try {
      const { error } = await supabase.from('fruits').delete().eq('id', fruitId);
      if (error) throw error;

    } catch (error: any) {
      console.error('Error deleting fruit:', error);
      set({ tree: previousTree, error: 'No se pudo borrar el recuerdo.' });
      get().fetchMyTree();
    }
  }
}));