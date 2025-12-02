import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type MemoryItem = {
  id: string;
  title: string;
  description: string;
  date?: string | null;
  createdAt: string;
  type?: 'birthday' | 'memory';
};

export type ActivityItem = {
  id: string;
  userId?: string;
  userName: string;
  userInitial: string;
  action: string;
  timestamp: string;
  timeAgo: string;
};

interface MemoryState {
  todayMemories: MemoryItem[];
  recentActivities: ActivityItem[];
  isLoading: boolean;
  error: string | null;

  fetchHomeData: () => Promise<void>;
  addMemory: (memory: MemoryItem) => Promise<void>;
  addMemoryWithAI: (prompt: string) => Promise<void>;
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
      if (!session?.user?.id) {
        console.log('[MemoryStore] No session found. Clearing home data.');
        set({ todayMemories: [], recentActivities: [], isLoading: false });
        return;
      }

      console.log('[MemoryStore] Fetching home data for user', session.user.id);

      const { data: memories, error: memoriesError } = await supabase
        .from('fruits')
        .select('id, title, description, date, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (memoriesError) throw memoriesError;

      const normalizedMemories: MemoryItem[] = (memories || []).map((memory: any) => ({
        id: memory.id,
        title: memory.title,
        description: memory.description,
        date: memory.date,
        createdAt: memory.created_at,
        type: 'memory',
      }));

      const { data: connections, error: connectionsError } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', session.user.id);

      if (connectionsError) throw connectionsError;

      const familyIds = (connections || [])
        .map((connection: { relative_id: string | null }) => connection.relative_id)
        .filter((id): id is string => Boolean(id));

      let activities: ActivityItem[] = [];

      if (familyIds.length > 0) {
        const { data: familyTrees, error: familyTreesError } = await supabase
          .from('trees')
          .select('id, owner_id')
          .in('owner_id', familyIds);

        if (familyTreesError) throw familyTreesError;

        const treeIds = (familyTrees || []).map((tree: { id: string }) => tree.id);

        if (treeIds.length > 0) {
          const { data: familyBranches, error: familyBranchesError } = await supabase
            .from('branches')
            .select('id')
            .in('tree_id', treeIds);

          if (familyBranchesError) throw familyBranchesError;

          const branchIds = (familyBranches || []).map((branch: { id: string }) => branch.id);

          if (branchIds.length > 0) {
            const { data: recentFruits, error: recentFruitsError } = await supabase
              .from('fruits')
              .select(`
                id, title, created_at,
                branch:branches(
                  tree:trees(
                    owner:profiles(id, name)
                  )
                )
              `)
              .in('branch_id', branchIds)
              .order('created_at', { ascending: false })
              .limit(10);

            if (recentFruitsError) throw recentFruitsError;

            activities = (recentFruits || []).map((fruit: any) => {
              const owner = fruit.branch?.tree?.owner;
              const userName = owner?.name || 'Familiar';

              return {
                id: fruit.id,
                userId: owner?.id,
                userName,
                userInitial: userName.charAt(0),
                action: `añadió el recuerdo "${fruit.title}"`,
                timestamp: fruit.created_at,
                timeAgo: 'recientemente',
              };
            });
          }
        }
      }

      console.log('[MemoryStore] Home data ready', {
        memories: normalizedMemories.length,
        activities: activities.length,
      });

      set({
        todayMemories: normalizedMemories,
        recentActivities: activities,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[MemoryStore] Error fetching home data:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addMemory: async (_memory: MemoryItem) => {
    console.log('[MemoryStore] Redirect addMemory to treeStore.addFruit');
  },

  addMemoryWithAI: async (prompt: string) => {
    console.log('[MemoryStore] Generating AI memory with prompt:', prompt);
  },
}));
