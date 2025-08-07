import { create } from 'zustand';
import { memories, recentActivities } from '@/mocks/data';

interface MemoryState {
  todayMemories: {
    id: string;
    title: string;
    description: string;
    date: string;
  }[];
  recentActivities: {
    id: string;
    userId: string;
    userName: string;
    userInitial: string;
    action: string;
    timestamp: string;
    timeAgo: string;
  }[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTodayMemories: () => void;
  fetchRecentActivities: () => void;
  addMemory: (memory: { title: string; description: string; date: string }) => void;
  addMemoryWithAI: (prompt: string) => Promise<void>;
}

export const useMemoryStore = create<MemoryState>()((set) => ({
  todayMemories: memories,
  recentActivities: recentActivities,
  isLoading: false,
  error: null,
  
  fetchTodayMemories: () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we're using mock data
      set({ todayMemories: memories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Error al cargar recuerdos", 
        isLoading: false 
      });
    }
  },
  
  fetchRecentActivities: () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we're using mock data
      set({ recentActivities, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Error al cargar actividades", 
        isLoading: false 
      });
    }
  },
  
  addMemory: (memory) => {
    const newMemory = {
      id: `memory_${Date.now()}`,
      ...memory,
    };
    
    set((state) => ({
      todayMemories: [...state.todayMemories, newMemory],
    }));
  },
  
  addMemoryWithAI: async (prompt) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente que ayuda a crear recuerdos emotivos y personales. Basándote en la descripción del usuario, crea un título y descripción para un recuerdo especial.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      
      // Parse AI response and create memory
      const newMemory = {
        id: `memory_${Date.now()}`,
        title: 'Recuerdo Generado por IA',
        description: data.completion,
        date: new Date().toISOString(),
      };
      
      set((state) => ({
        todayMemories: [...state.todayMemories, newMemory],
        isLoading: false,
      }));
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Error al generar recuerdo", 
        isLoading: false 
      });
    }
  },
}));