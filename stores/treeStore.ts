import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';

interface TreeState {
  tree: TreeType | null;
  isLoading: boolean;
  error: string | null;
  fetchMyTree: () => Promise<void>;
  addBranch: (branch: Omit<BranchType, 'id' | 'createdAt'>) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>; // ✅
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => Promise<void>;
  deleteFruit: (fruitId: string) => Promise<void>; // ✅
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: null,
  isLoading: false,
  error: null,

  fetchMyTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      // 1. Árbol
      const { data: treeData, error: treeError } = await supabase.from('trees').select('*').eq('owner_id', session.user.id).single();
      if (treeError) throw treeError;

      // 2. Ramas
      const { data: branchesDataRaw, error: branchesError } = await supabase.from('branches').select('*').eq('tree_id', treeData.id);
      if (branchesError) throw branchesError;

      const branchesData: BranchType[] = (branchesDataRaw || []).map((b: any) => ({
        id: b.id, name: b.name, categoryId: b.category, color: b.color, createdAt: b.created_at, isShared: b.is_shared, position: { x: 0, y: 0 }
      }));

      // 3. Frutos
      let fruitsData: FruitType[] = [];
      if (branchesData.length > 0) {
        const branchIds = branchesData.map(b => b.id);
        const { data: fruitsRaw, error: fruitsError } = await supabase.from('fruits').select('*').in('branch_id', branchIds);
        if (fruitsError) throw fruitsError;
        fruitsData = (fruitsRaw || []).map((f: any) => ({
          id: f.id, title: f.title, description: f.description, branchId: f.branch_id, mediaUrls: f.media_urls || [], createdAt: f.created_at, isShared: f.is_shared || false, position: { x: 0, y: 0 }
        }));
      }

      // 4. Raíces
      const { data: rootsData } = await supabase.from('family_connections').select(`id, relation, created_at, relative:profiles!relative_id (name)`).eq('user_id', session.user.id);
      const formattedRoots: RootType[] = (rootsData || []).map((r: any) => ({
        id: r.id, name: r.relative?.name || 'Fam', relation: r.relation || 'Fam', createdAt: r.created_at, treeId: treeData.id
      }));

      set({ tree: { id: treeData.id, ownerId: treeData.owner_id, name: treeData.name, createdAt: treeData.created_at, branches: branchesData, fruits: fruitsData, roots: formattedRoots }, isLoading: false });

    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addBranch: async (branch) => {
    const currentTree = get().tree;
    if (!currentTree) return;
    try {
      const { data, error } = await supabase.from('branches').insert({
        tree_id: currentTree.id, name: branch.name, category: branch.categoryId, color: branch.color
      }).select().single();
      if (error) throw error;
      // Update local
      const newB = { id: data.id, name: data.name, categoryId: data.category, color: data.color, createdAt: data.created_at, isShared: data.is_shared, position: { x: 0, y: 0 } };
      set(state => ({ tree: state.tree ? { ...state.tree, branches: [...state.tree.branches, newB] } : null }));
    } catch (e) { console.error(e); }
  },

  deleteBranch: async (branchId) => {
    try {
      const { error } = await supabase.from('branches').delete().eq('id', branchId);
      if (error) throw error;
      set(state => {
        if (!state.tree) return state;
        return {
          tree: {
            ...state.tree,
            branches: state.tree.branches.filter(b => b.id !== branchId),
            fruits: state.tree.fruits.filter(f => f.branchId !== branchId) // Cascading local delete
          }
        };
      });
    } catch (e) { console.error(e); throw e; }
  },

  addFruit: async (fruit) => {
    try {
      const { data, error } = await supabase.from('fruits').insert({
        branch_id: fruit.branchId, title: fruit.title, description: fruit.description, date: new Date().toISOString(), media_urls: fruit.mediaUrls || []
      }).select().single();
      if (error) throw error;
      const newF = { id: data.id, title: data.title, description: data.description, branchId: data.branch_id, mediaUrls: data.media_urls, createdAt: data.created_at, isShared: false, position: { x: 0, y: 0 } };
      set(state => ({ tree: state.tree ? { ...state.tree, fruits: [...state.tree.fruits, newF] } : null }));
    } catch (e) { console.error(e); throw e; }
  },

  deleteFruit: async (fruitId) => {
    try {
      const { error } = await supabase.from('fruits').delete().eq('id', fruitId);
      if (error) throw error;
      set(state => {
        if (!state.tree) return state;
        return {
          tree: {
            ...state.tree,
            fruits: state.tree.fruits.filter(f => f.id !== fruitId)
          }
        };
      });
    } catch (e) { console.error(e); throw e; }
  }
}));