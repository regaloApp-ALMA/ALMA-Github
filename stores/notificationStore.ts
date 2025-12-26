import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './userStore';

export type NotificationType = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'gift' | 'family' | 'system';
  isRead: boolean;
  relatedId?: string | null;
  createdAt: string;
};

interface NotificationState {
  notifications: NotificationType[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (notification: {
    userId: string;
    title: string;
    message: string;
    type: 'gift' | 'family' | 'system';
    relatedId?: string;
  }) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: NotificationType[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        relatedId: n.related_id,
        createdAt: n.created_at,
      }));

      const unreadCount = formatted.filter(n => !n.isRead).length;

      set({
        notifications: formatted,
        unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  createNotification: async ({ userId, title, message, type, relatedId }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId || null,
        });

      if (error) throw error;

      // Recargar notificaciones si es para el usuario actual
      const currentUserId = useUserStore.getState().user?.id;
      if (currentUserId === userId) {
        get().fetchNotifications();
      }
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
}));
