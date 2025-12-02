import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';
import { useUserStore } from './userStore';

type NewBranchPayload = {
  name: string;
  categoryId: string;
  color: string;
  isShared?: boolean;
  position?: { x: number; y: number };
};

interface TreeState {
  tree: TreeType | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchMyTree: (isRefresh?: boolean) => Promise<void>;

  // Funciones de Ramas
  addBranch: (branch: NewBranchPayload) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;

  // Funciones de Frutos
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => Promise<void>;
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
      // 1. Obtener Árbol
      let { data: treeData, error: treeError } = await supabase
        .from('trees')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (treeError && treeError.code !== 'PGRST116') throw treeError;

      // Si no existe árbol, crearlo automáticamente
      if (!treeData) {
        const { data: newTree, error: createError } = await supabase
          .from('trees')
          .insert([{ owner_id: userId, name: 'Mi Árbol' }])
          .select()
          .single();
        if (createError) throw createError;
        treeData = newTree;
      }

      // 2. Obtener Ramas
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('tree_id', treeData.id)
        .order('created_at', { ascending: true });
      if (branchesError) throw branchesError;

      const formattedBranches: BranchType[] = (branches || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        categoryId: b.category, // Mapeo importante: DB 'category' -> Type 'categoryId'
        color: b.color,
        createdAt: b.created_at,
        isShared: b.is_shared,
        position: { x: 0, y: 0 }
      }));

      // 3. Obtener Frutos
      const branchIds = formattedBranches.map(b => b.id);
      let formattedFruits: FruitType[] = [];

      if (branchIds.length > 0) {
        const { data: fruits, error: fruitsError } = await supabase
          .from('fruits')
          .select('*')
          .in('branch_id', branchIds)
          .order('created_at', { ascending: false });

        if (fruitsError) throw fruitsError;

        formattedFruits = (fruits || []).map((f: any) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          branchId: f.branch_id,
          mediaUrls: f.media_urls || [],
          createdAt: f.created_at,
          isShared: f.is_shared || false,
          position: { x: 0, y: 0 }
        }));
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

      set({
        tree: {
          id: treeData.id,
          ownerId: treeData.owner_id,
          name: treeData.name,
          createdAt: treeData.created_at,
          branches: formattedBranches,
          fruits: formattedFruits,
          roots: formattedRoots
        }, isLoading: false
      });

    } catch (error: any) {
      console.error('Error fetching tree:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addBranch: async (branch) => {
    const currentTree = get().tree;
    if (!currentTree) return;
    try {
      const { error } = await supabase.from('branches').insert({
        tree_id: currentTree.id,
        name: branch.name,
        category: branch.categoryId,
        color: branch.color,
        is_shared: branch.isShared ?? false
      });
      if (error) throw error;
      get().fetchMyTree();
    } catch (e) { console.error(e); }
  },

  deleteBranch: async (branchId) => {
    const previousTree = get().tree;

    // 1. UI Instantánea: Borramos la rama Y sus frutos visualmente
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          branches: previousTree.branches.filter(b => b.id !== branchId),
          // Importante: filtramos también los frutos visualmente para actualizar contadores
          fruits: previousTree.fruits.filter(f => f.branchId !== branchId)
        }
      });
    }

    try {
      // 2. Borrado en DB
      // Como configuraste "CASCADE" en Supabase, borrar la rama borra sus frutos automáticamente
      const { error } = await supabase.from('branches').delete().eq('id', branchId);
      if (error) throw error;

    } catch (error: any) {
      console.error('Error deleting branch:', error);
      // Si falla, restauramos
      set({ tree: previousTree, error: 'No se pudo borrar la rama.' });
      get().fetchMyTree();
    }
  },

  addFruit: async (fruit) => {
    try {
      const { error } = await supabase.from('fruits').insert({
        branch_id: fruit.branchId,
        title: fruit.title,
        description: fruit.description,
        media_urls: fruit.mediaUrls,
        is_shared: fruit.isShared,
        date: new Date().toISOString()
      });
      if (error) throw error;
      get().fetchMyTree();
    } catch (e) { console.error(e); }
  },

  // --- AQUÍ ESTÁ LA SOLUCIÓN AL BUG DE BORRADO DE FRUTOS ---
  deleteFruit: async (fruitId: string) => {
    const previousTree = get().tree;

    // 1. UI Instantánea: Filtramos SOLO el fruto que coincide con el ID
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          fruits: previousTree.fruits.filter(f => f.id !== fruitId)
        }
      });
    }

    try {
      // 2. Borrado en DB: Usamos .eq('id', fruitId) para ser quirúrgicos
      const { error } = await supabase.from('fruits').delete().eq('id', fruitId);

      if (error) throw error;

    } catch (error: any) {
      console.error('Error deleting fruit:', error);
      // Si falla, restauramos la vista anterior
      set({ tree: previousTree, error: 'No se pudo borrar el recuerdo.' });
      get().fetchMyTree(); // Recargamos para asegurar consistencia
    }
  }
}));