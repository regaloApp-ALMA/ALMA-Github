import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TreeType, BranchType, FruitType, RootType } from '@/types/tree';
import { myTree } from '@/mocks/data';

interface TreeState {
  tree: TreeType;
  isLoading: boolean;
  error: string | null;
  newlyAddedBranchId: string | null;
  
  // Actions
  addBranch: (branch: Omit<BranchType, 'id' | 'createdAt'>) => string;
  setNewlyAddedBranch: (branchId: string) => void;
  updateBranch: (id: string, updates: Partial<BranchType>) => void;
  deleteBranch: (id: string) => void;
  clearNewlyAddedBranch: () => void;
  
  addFruit: (fruit: Omit<FruitType, 'id' | 'createdAt'>) => void;
  updateFruit: (id: string, updates: Partial<FruitType>) => void;
  deleteFruit: (id: string) => void;
  
  addRoot: (root: Omit<RootType, 'id' | 'createdAt'>) => void;
  updateRoot: (id: string, updates: Partial<RootType>) => void;
  deleteRoot: (id: string) => void;
  
  fetchTree: (userId: string) => Promise<void>;
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      tree: myTree,
      isLoading: false,
      error: null,
      newlyAddedBranchId: null,
      
      addBranch: (branch) => {
        const newBranch: BranchType = {
          ...branch,
          id: `branch_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tree: {
            ...state.tree,
            branches: [...state.tree.branches, newBranch],
          },
          newlyAddedBranchId: newBranch.id,
        }));
        
        return newBranch.id;
      },
      
      setNewlyAddedBranch: (branchId) => {
        set({ newlyAddedBranchId: branchId });
      },
      
      clearNewlyAddedBranch: () => {
        set({ newlyAddedBranchId: null });
      },
      
      updateBranch: (id, updates) => {
        set((state) => ({
          tree: {
            ...state.tree,
            branches: state.tree.branches.map((branch) =>
              branch.id === id ? { ...branch, ...updates } : branch
            ),
          },
        }));
      },
      
      deleteBranch: (id) => {
        set((state) => ({
          tree: {
            ...state.tree,
            branches: state.tree.branches.filter((branch) => branch.id !== id),
            // Also remove fruits attached to this branch
            fruits: state.tree.fruits.filter((fruit) => fruit.branchId !== id),
          },
        }));
      },
      
      addFruit: (fruit) => {
        const newFruit: FruitType = {
          ...fruit,
          id: `fruit_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tree: {
            ...state.tree,
            fruits: [...state.tree.fruits, newFruit],
          },
        }));
      },
      
      updateFruit: (id, updates) => {
        set((state) => ({
          tree: {
            ...state.tree,
            fruits: state.tree.fruits.map((fruit) =>
              fruit.id === id ? { ...fruit, ...updates } : fruit
            ),
          },
        }));
      },
      
      deleteFruit: (id) => {
        set((state) => ({
          tree: {
            ...state.tree,
            fruits: state.tree.fruits.filter((fruit) => fruit.id !== id),
          },
        }));
      },
      
      addRoot: (root) => {
        const newRoot: RootType = {
          ...root,
          id: `root_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tree: {
            ...state.tree,
            roots: [...state.tree.roots, newRoot],
          },
        }));
      },
      
      updateRoot: (id, updates) => {
        set((state) => ({
          tree: {
            ...state.tree,
            roots: state.tree.roots.map((root) =>
              root.id === id ? { ...root, ...updates } : root
            ),
          },
        }));
      },
      
      deleteRoot: (id) => {
        set((state) => ({
          tree: {
            ...state.tree,
            roots: state.tree.roots.filter((root) => root.id !== id),
          },
        }));
      },
      
      fetchTree: async (userId) => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real app, this would be an API call
          // For now, we're using mock data
          set({ tree: myTree, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Error desconocido", 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'alma-tree-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);