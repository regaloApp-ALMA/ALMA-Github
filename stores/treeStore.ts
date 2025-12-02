import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';
import { useUserStore } from './userStore';

type TreePermissionScope = 'all' | 'custom';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const possibleError = error as { message?: string; details?: string; hint?: string };
    if (possibleError.message) return possibleError.message;
    if (possibleError.details) return possibleError.details;
    if (possibleError.hint) return possibleError.hint;
    try {
      return JSON.stringify(error);
    } catch (stringifyError) {
      console.warn('Error stringifying unknown error', stringifyError);
    }
  }
  return String(error);
};

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
  fetchTreeByPermission: (treeId: string) => Promise<void>;
  addBranch: (branch: NewBranchPayload) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => Promise<void>;
  deleteFruit: (fruitId: string) => Promise<void>;
}

const formatBranches = (branches: any[]): BranchType[] =>
  (branches || []).map((b) => ({
    id: b.id,
    name: b.name,
    categoryId: b.category,
    color: b.color,
    createdAt: b.created_at,
    isShared: Boolean(b.is_shared),
    position: { x: 0, y: 0 },
  }));

const formatFruits = (fruits: any[]): FruitType[] =>
  (fruits || []).map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    branchId: f.branch_id,
    mediaUrls: f.media_urls || [],
    createdAt: f.created_at,
    isShared: Boolean(f.is_shared),
    position: { x: 0, y: 0 },
  }));

const formatRoots = (roots: any[]): RootType[] =>
  (roots || []).map((r) => ({
    id: r.id,
    name: r.relative?.name || 'Familiar',
    relation: r.relation || 'Raíz',
    createdAt: r.created_at,
    treeId: r.tree_id,
  }));

const fetchBranches = async (treeId: string, branchFilter?: string[]) => {
  if (Array.isArray(branchFilter) && branchFilter.length === 0) {
    return { branches: [] as BranchType[], branchIds: [] as string[] };
  }

  let query = supabase
    .from('branches')
    .select('*')
    .eq('tree_id', treeId)
    .order('created_at', { ascending: true });

  if (Array.isArray(branchFilter)) {
    query = query.in('id', branchFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  const formatted = formatBranches(data || []);
  return { branches: formatted, branchIds: formatted.map((b) => b.id) };
};

const fetchFruits = async (branchIds: string[]) => {
  if (!branchIds.length) return [] as FruitType[];
  const { data, error } = await supabase
    .from('fruits')
    .select('*')
    .in('branch_id', branchIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return formatFruits(data || []);
};

const fetchRoots = async (ownerId: string) => {
  const { data, error } = await supabase
    .from('family_connections')
    .select('id, relation, created_at, tree_id, relative:profiles!relative_id (name)')
    .eq('user_id', ownerId);
  if (error) throw error;
  return formatRoots(data || []);
};

const buildTreeState = async (treeData: any, branchFilter?: string[]): Promise<TreeType> => {
  const { branches, branchIds } = await fetchBranches(treeData.id, branchFilter);
  const fruits = await fetchFruits(branchIds);
  const roots = await fetchRoots(treeData.owner_id);
  return {
    id: treeData.id,
    ownerId: treeData.owner_id,
    name: treeData.name,
    createdAt: treeData.created_at,
    branches,
    fruits,
    roots,
  };
};

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
      let { data: treeData, error: treeError } = await supabase
        .from('trees')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (treeError && treeError.code !== 'PGRST116') throw treeError;

      if (!treeData) {
        const { data: newTree, error: createError } = await supabase
          .from('trees')
          .insert([{ owner_id: userId, name: 'Mi Árbol' }])
          .select()
          .single();
        if (createError) throw createError;
        treeData = newTree;
      }

      const tree = await buildTreeState(treeData);
      set({ tree, isLoading: false, isRefreshing: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error fetching tree:', message, error);
      set({ error: message, isLoading: false, isRefreshing: false });
    }
  },

  fetchTreeByPermission: async (treeId: string) => {
    const userState = useUserStore.getState().user;
    if (!userState) return;

    set({ isLoading: true, error: null });

    try {
      const recipientFilters = [`recipient_id.eq.${userState.id}`];
      if (userState.email) {
        recipientFilters.push(`recipient_email.eq.${userState.email.toLowerCase()}`);
      }

      const { data: permission, error: permissionError } = await supabase
        .from('tree_permissions')
        .select('scope, allowed_branch_ids, tree_id')
        .eq('tree_id', treeId)
        .or(recipientFilters.join(','))
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (permissionError) throw permissionError;
      if (!permission) throw new Error('No tienes acceso a este árbol.');

      const { data: treeData, error: treeError } = await supabase
        .from('trees')
        .select('*')
        .eq('id', permission.tree_id)
        .single();
      if (treeError) throw treeError;

      const selectedScope = (permission.scope as TreePermissionScope) || 'all';
      const branchFilter = selectedScope === 'all' ? undefined : permission.allowed_branch_ids || [];
      const tree = await buildTreeState(treeData, branchFilter as string[] | undefined);
      set({ tree, isLoading: false, isRefreshing: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error fetching shared tree:', message, error);
      set({ error: message, isLoading: false, isRefreshing: false });
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
        is_shared: branch.isShared ?? false,
      });
      if (error) throw error;
      get().fetchMyTree();
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error adding branch:', message, error);
      set({ error: message });
    }
  },

  deleteBranch: async (branchId) => {
    const previousTree = get().tree;
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          branches: previousTree.branches.filter((b) => b.id !== branchId),
          fruits: previousTree.fruits.filter((f) => f.branchId !== branchId),
        },
      });
    }

    try {
      const { error } = await supabase.from('branches').delete().eq('id', branchId);
      if (error) throw error;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error deleting branch:', message, error);
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
        date: new Date().toISOString(),
      });
      if (error) throw error;
      get().fetchMyTree();
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error adding fruit:', message, error);
      set({ error: message });
    }
  },

  deleteFruit: async (fruitId: string) => {
    const previousTree = get().tree;
    if (previousTree) {
      set({
        tree: {
          ...previousTree,
          fruits: previousTree.fruits.filter((f) => f.id !== fruitId),
        },
      });
    }

    try {
      const { error } = await supabase.from('fruits').delete().eq('id', fruitId);
      if (error) throw error;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Error deleting fruit:', message, error);
      set({ tree: previousTree, error: 'No se pudo borrar el recuerdo.' });
      get().fetchMyTree();
    }
  },
}));
