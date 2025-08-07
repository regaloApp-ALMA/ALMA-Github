import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GiftType } from '@/types/gift';
import { gifts } from '@/mocks/data';

interface GiftState {
  gifts: GiftType[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGifts: (userId: string) => Promise<void>;
  sendGift: (gift: Omit<GiftType, 'id' | 'createdAt' | 'status' | 'isNew'>) => void;
  createGift: (gift: Omit<GiftType, 'id' | 'createdAt' | 'status' | 'isNew'>) => void;
  acceptGift: (id: string) => void;
  rejectGift: (id: string) => void;
  markAsRead: (id: string) => void;
}

export const useGiftStore = create<GiftState>()(
  persist(
    (set) => ({
      gifts: gifts,
      isLoading: false,
      error: null,
      
      fetchGifts: async (userId) => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real app, this would be an API call
          // For now, we're using mock data
          set({ gifts, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Error al cargar regalos", 
            isLoading: false 
          });
        }
      },
      
      sendGift: (gift) => {
        const newGift: GiftType = {
          ...gift,
          id: `gift_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          isNew: true,
        };
        
        set((state) => ({
          gifts: [...state.gifts, newGift],
        }));
      },
      
      createGift: (gift) => {
        const newGift: GiftType = {
          ...gift,
          id: `gift_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          isNew: true,
        };
        
        set((state) => ({
          gifts: [...state.gifts, newGift],
        }));
      },
      
      acceptGift: (id) => {
        set((state) => ({
          gifts: state.gifts.map((gift) =>
            gift.id === id ? { ...gift, status: 'accepted', isNew: false } : gift
          ),
        }));
      },
      
      rejectGift: (id) => {
        set((state) => ({
          gifts: state.gifts.map((gift) =>
            gift.id === id ? { ...gift, status: 'rejected', isNew: false } : gift
          ),
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          gifts: state.gifts.map((gift) =>
            gift.id === id ? { ...gift, isNew: false } : gift
          ),
        }));
      },
    }),
    {
      name: 'alma-gift-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);