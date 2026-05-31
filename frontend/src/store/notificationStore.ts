import { create } from 'zustand';
import { api } from '../services/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications?limit=50');
      const data = response.data.data;
      // Extract unreadCount from message or calculate manually
      // the message comes as "X unread notification(s)"
      const unreadMatch = response.data.message.match(/(\d+) unread/);
      const unreadCount = unreadMatch ? parseInt(unreadMatch[1], 10) : data.filter((n: Notification) => !n.is_read).length;

      set({ 
        notifications: data, 
        unreadCount, 
        total: response.data.meta.total,
        isLoading: false 
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'Failed to fetch notifications', isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const { notifications, unreadCount } = get();
      
      const newNotifications = notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      
      set({ 
        notifications: newNotifications,
        unreadCount: Math.max(0, unreadCount - 1)
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      const { notifications } = get();
      
      const newNotifications = notifications.map(n => ({ ...n, is_read: true }));
      
      set({ 
        notifications: newNotifications,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }
}));
