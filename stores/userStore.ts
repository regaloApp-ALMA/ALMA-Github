import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '@/types/user';
import { currentUser } from '@/mocks/data';
import { trpcClient } from '@/lib/trpc';

interface UserState {
  user: UserType | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserType>) => void;
  updateUser: (updates: Partial<UserType>) => void;
  addConnection: (userId: string) => void;
  removeConnection: (userId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await trpcClient.auth.login.mutate({ email, password });
          
          if (result.success) {
            const userData: UserType = {
              ...currentUser,
              ...result.user,
            };
            
            set({ 
              user: userData,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            throw new Error('Error en el inicio de sesión');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Error de autenticación", 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real app, this would integrate with Google Auth
          // For now, we're using mock data
          set({ 
            user: currentUser,
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Error de autenticación con Google", 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await trpcClient.auth.register.mutate({ name, email, password });
          
          if (result.success) {
            const userData: UserType = {
              ...currentUser,
              ...result.user,
              connections: [],
              treeId: `tree_${result.user.id}`,
            };
            
            set({ 
              user: userData,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            throw new Error('Error en el registro');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Error de registro", 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      
      addConnection: (userId) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              connections: [...state.user.connections, userId],
            },
          };
        });
      },
      
      removeConnection: (userId) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              connections: state.user.connections.filter((id) => id !== userId),
            },
          };
        });
      },
    }),
    {
      name: 'alma-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);