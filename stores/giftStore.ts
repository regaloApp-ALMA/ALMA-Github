import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { GiftType } from '@/types/gift';
import { useUserStore } from './userStore';
import { useTreeStore } from './treeStore';
import colors from '@/constants/colors';

interface GiftState {
  gifts: GiftType[];
  isLoading: boolean;
  error: string | null;

  fetchGifts: () => Promise<void>;
  createGift: (gift: {
    type: 'branch' | 'fruit' | 'timeCapsule';
    recipientEmail: string;
    message: string;
    content: any; // Datos del fruto/rama
    unlockDate?: string;
  }) => Promise<void>;
  acceptGift: (gift: GiftType) => Promise<void>;
  rejectGift: (id: string) => Promise<void>;
}

export const useGiftStore = create<GiftState>((set, get) => ({
  gifts: [],
  isLoading: false,
  error: null,

  fetchGifts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Buscar regalos donde soy el destinatario
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!sender_id(name, avatar_url)
        `)
        .or(`recipient_id.eq.${session.user.id},recipient_email.eq.${session.user.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGifts: GiftType[] = data.map((g: any) => ({
        id: g.id,
        type: g.type as any,
        senderId: g.sender_id,
        senderName: g.sender?.name || 'Alguien',
        recipientId: g.recipient_id || g.recipient_email,
        message: g.message,
        createdAt: g.created_at,
        status: g.status,
        contentId: 'data', // Placeholder
        contentData: g.content_data, // Importante: datos reales
        unlockDate: g.unlock_date,
        isNew: !g.is_read
      }));

      set({ gifts: formattedGifts, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching gifts:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createGift: async ({ type, recipientEmail, message, content, unlockDate }) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No sesión");

      // Intentar buscar si el email ya tiene ID de usuario
      const { data: recipientUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      const { error } = await supabase.from('gifts').insert({
        sender_id: session.user.id,
        recipient_email: recipientEmail,
        recipient_id: recipientUser?.id || null, // Si existe, lo vinculamos
        type,
        message,
        content_data: content, // Guardamos el JSON del recuerdo/rama
        unlock_date: unlockDate ? new Date(unlockDate).toISOString() : null,
        status: 'pending'
      });

      if (error) throw error;
      set({ isLoading: false });
      // Recargar lista por si me lo envié a mi mismo (demo)
      get().fetchGifts();

    } catch (error: any) {
      console.error('Error creating gift:', error);
      set({ error: error.message, isLoading: false });
      throw error; // Relanzar para manejar en UI
    }
  },

  acceptGift: async (gift) => {
    set({ isLoading: true });
    try {
      // 1. Marcar como aceptado
      const { error: updateError } = await supabase
        .from('gifts')
        .update({ status: 'accepted', is_read: true })
        .eq('id', gift.id);

      if (updateError) throw updateError;

      // 2. Añadir el contenido a MI árbol
      // Usamos las funciones del treeStore, pero accediendo directamente a Supabase aquí 
      // para evitar dependencias circulares complejas o usamos lógica directa.
      const { data: { session } } = await supabase.auth.getSession();

      // Obtener mi árbol ID
      const { data: myTree } = await supabase.from('trees').select('id').eq('owner_id', session?.user.id).single();

      if (gift.type === 'branch' && myTree) {
        // Crear rama
        await supabase.from('branches').insert({
          tree_id: myTree.id,
          name: gift.contentData.name || 'Regalo',
          category: gift.contentData.category || 'friends',
          color: gift.contentData.color || '#FF6B35',
          is_shared: true
        });
      } else if ((gift.type === 'fruit' || gift.type === 'timeCapsule') && myTree) {
        // Para fruto necesitamos una rama. Intentamos usar la rama original si existe, sino creamos una "Regalos"
        let targetBranchId: string | null = null;

        // Intentar encontrar la rama original si viene en contentData
        if (gift.contentData?.branchId) {
          const { data: originalBranch } = await supabase
            .from('branches')
            .select('id')
            .eq('id', gift.contentData.branchId)
            .single();
          
          if (originalBranch) {
            // Verificar si esa rama pertenece a mi árbol o está compartida
            const { data: myBranch } = await supabase
              .from('branches')
              .select('id')
              .eq('tree_id', myTree.id)
              .eq('id', gift.contentData.branchId)
              .single();
            
            if (myBranch) {
              targetBranchId = myBranch.id;
            }
          }
        }

        // Si no encontramos la rama original, buscar o crear una rama "Regalos"
        if (!targetBranchId) {
          let { data: giftsBranch } = await supabase
            .from('branches')
            .select('id')
            .eq('tree_id', myTree.id)
            .ilike('name', '%regalo%')
            .limit(1)
            .single();

          if (!giftsBranch) {
            // Crear rama "Regalos" si no existe
            const { data: newBranch } = await supabase
              .from('branches')
              .insert({
                tree_id: myTree.id,
                name: 'Regalos',
                category: 'friends',
                color: colors.primary,
                is_shared: false
              })
              .select('id')
              .single();
            
            if (newBranch) {
              targetBranchId = newBranch.id;
            }
          } else {
            targetBranchId = giftsBranch.id;
          }
        }

        // Si aún no tenemos rama, usar la primera disponible
        if (!targetBranchId) {
          const { data: firstBranch } = await supabase
            .from('branches')
            .select('id')
            .eq('tree_id', myTree.id)
            .limit(1)
            .single();
          
          if (firstBranch) {
            targetBranchId = firstBranch.id;
          }
        }

        if (targetBranchId) {
          await supabase.from('fruits').insert({
            branch_id: targetBranchId,
            title: gift.contentData?.title || 'Recuerdo regalado',
            description: gift.contentData?.description || gift.message,
            date: new Date().toISOString(),
            media_urls: gift.contentData?.mediaUrls || [],
            is_shared: true, // Marcar como compartido
            position: gift.contentData?.position || { x: 0, y: 0 },
            location: gift.contentData?.location || { name: '' }
          });
        }
      }

      // 3. Actualizar lista local
      set(state => ({
        gifts: state.gifts.map(g => g.id === gift.id ? { ...g, status: 'accepted' } : g),
        isLoading: false
      }));

      // Forzar recarga del árbol para ver el nuevo regalo
      useTreeStore.getState().fetchMyTree();

    } catch (error: any) {
      console.error('Error accepting gift:', error);
      set({ isLoading: false });
    }
  },

  rejectGift: async (id) => {
    try {
      await supabase.from('gifts').update({ status: 'rejected', is_read: true }).eq('id', id);
      set(state => ({
        gifts: state.gifts.map(g => g.id === id ? { ...g, status: 'rejected' } : g)
      }));
    } catch (error) {
      console.error(error);
    }
  },
}));