import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/dateHelper';

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

      // 1. RECUERDOS CERCANOS A HOY (±7 días) DEL USUARIO Y SU FAMILIA
      // ----------------------------------------------------------------
      // a) Obtener mis árboles
      const { data: myTrees } = await supabase
        .from('trees')
        .select('id')
        .eq('owner_id', session.user.id);

      const myTreeIds = myTrees?.map(t => t.id) || [];

      // b) Obtener IDs de familiares conectados
      const { data: connections } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', session.user.id);

      const familyIds = connections?.map(c => c.relative_id) || [];

      // c) Obtener árboles de mis familiares
      let allTreeIds = [...myTreeIds];

      if (familyIds.length > 0) {
        const { data: familyTrees } = await supabase
          .from('trees')
          .select('id, owner_id')
          .in('owner_id', familyIds);

        const familyTreeIds = familyTrees?.map(t => t.id) || [];
        allTreeIds = [...allTreeIds, ...familyTreeIds];
      }

      // d) Con todos los árboles (míos + familia), obtener sus ramas y frutos
      let memories: any[] = [];

      if (allTreeIds.length > 0) {
        const { data: branches } = await supabase
          .from('branches')
          .select('id, tree_id')
          .in('tree_id', allTreeIds);

        const branchIds = branches?.map(b => b.id) || [];

        if (branchIds.length > 0) {
          const { data: fruits } = await supabase
            .from('fruits')
            .select('id, title, description, date, created_at, branch_id')
            .in('branch_id', branchIds)
            .order('date', { ascending: true });

          const today = new Date();
          const dayMs = 24 * 60 * 60 * 1000;

          // Filtrar recuerdos: día y mes actual, años anteriores, con rango de +/- 15 días
          const todayMonth = today.getMonth();
          const todayDay = today.getDate();
          
          const filteredMemories = (fruits || []).filter((f: any) => {
            if (!f.date) return false;
            const d = new Date(f.date);
            const memoryMonth = d.getMonth();
            const memoryDay = d.getDate();
            
            // Calcular diferencia en días (ignorando año)
            const thisYear = new Date(today.getFullYear(), memoryMonth, memoryDay);
            const diffDays = Math.abs(
              Math.floor((thisYear.getTime() - today.getTime()) / dayMs)
            );
            
            // Incluir si está en el rango de +/- 15 días del día/mes actual
            return diffDays <= 15;
          });

          // Ordenar por antigüedad: los más antiguos primero (priorizar recuerdos de hace años)
          filteredMemories.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB; // Ascendente = más antiguos primero
          });

          // Limitar a máximo 3 tarjetas
          memories = filteredMemories.slice(0, 3);
        }
      }

      // 2. ACTIVIDAD RECIENTE (De Familiares)
      // --------------------------------------
      // Buscamos frutos creados por gente que está en mis 'family_connections'
      // Primero obtenemos los IDs de mis familiares
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

            // Filtrar actividad de los últimos 7 días
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Formatear para la UI y filtrar por fecha
            activities = (recentFruits || [])
              .filter((f: any) => {
                const createdAt = new Date(f.created_at);
                return createdAt >= sevenDaysAgo;
              })
              .map((f: any) => ({
                id: f.id,
                userId: f.branch?.tree?.owner?.id, // Dato aproximado
                userName: f.branch?.tree?.owner?.name || 'Familiar',
                userInitial: (f.branch?.tree?.owner?.name || 'F').charAt(0),
                action: `añadió el recuerdo "${f.title}"`,
                timestamp: f.created_at,
                timeAgo: formatRelativeTime(f.created_at) // Usar helper para formateo correcto
              }));
          }
        }
      }

      set({
        todayMemories: (memories || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          date: m.date,
          type: 'memory' as const,
        })),
        recentActivities: activities,
        isLoading: false,
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