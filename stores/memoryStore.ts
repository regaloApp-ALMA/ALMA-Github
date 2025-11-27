import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface MemoryState {
  todayMemories: any[];
  recentActivities: any[];
  isLoading: boolean;
  error: string | null;

  fetchHomeData: () => Promise<void>;
  addMemory: (memory: any) => Promise<void>;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  todayMemories: [],
  recentActivities: [],
  isLoading: false,
  error: null,

  fetchHomeData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. RECUERDOS DE HOY (Efemérides)
      // Como SQL es complejo para filtrar "mismo día y mes" en timestamp, 
      // por simplicidad para el MVP traeremos los últimos 5 recuerdos propios.
      // (Para hacerlo perfecto necesitaríamos una función SQL "month()" y "day()")
      const { data: memories } = await supabase
        .from('fruits')
        .select('id, title, description, date, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // 2. ACTIVIDAD RECIENTE (De Familiares)
      // Buscamos frutos creados por gente que está en mis 'family_connections'
      // Primero obtenemos los IDs de mis familiares
      const { data: connections } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', session.user.id);

      const familyIds = connections?.map(c => c.relative_id) || [];

      let activities: any[] = [];

      if (familyIds.length > 0) {
        // Buscar árboles de esos familiares
        const { data: familyTrees } = await supabase
          .from('trees')
          .select('id, owner_id')
          .in('owner_id', familyIds);

        const treeIds = familyTrees?.map(t => t.id) || [];

        if (treeIds.length > 0) {
          // Buscar ramas de esos árboles
          const { data: familyBranches } = await supabase
            .from('branches')
            .select('id')
            .in('tree_id', treeIds);

          const branchIds = familyBranches?.map(b => b.id) || [];

          if (branchIds.length > 0) {
            // Buscar frutos en esas ramas
            const { data: recentFruits } = await supabase
              .from('fruits')
              .select(`
                 id, title, created_at,
                 branch:branches(
                   tree:trees(
                     owner:profiles(name)
                   )
                 )
               `)
              .in('branch_id', branchIds)
              .order('created_at', { ascending: false })
              .limit(10);

            // Formatear para la UI
            activities = (recentFruits || []).map((f: any) => ({
              id: f.id,
              userId: f.branch?.tree?.owner?.id, // Dato aproximado
              userName: f.branch?.tree?.owner?.name || 'Familiar',
              userInitial: (f.branch?.tree?.owner?.name || 'F').charAt(0),
              action: `añadió el recuerdo "${f.title}"`,
              timestamp: f.created_at,
              timeAgo: 'recientemente' // Podríamos usar date-fns aquí
            }));
          }
        }
      }

      set({
        todayMemories: memories || [],
        recentActivities: activities,
        isLoading: false
      });

    } catch (error: any) {
      console.error('Error fetching home data:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addMemory: async (memory) => {
    // Esta función ya la gestiona treeStore para insertar en DB
    // La mantenemos aquí si la UI la llama, redirigiendo
    console.log("Use treeStore.addFruit instead");
  },

  // ... resto del código ...

  // Añadir ": string" después de prompt
  addMemoryWithAI: async (prompt: string) => {
    // Aquí iría tu lógica de IA futura
    console.log("Generando con IA:", prompt);
  }
}));