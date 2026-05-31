import { create } from 'zustand';
import { api } from '../services/api';

export interface WishlistItem {
  wishlist_id: string;
  id: string; // food item id
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  restaurant_name: string;
}

interface WishlistState {
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (foodItemId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],
  isLoading: false,
  error: null,

  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/wishlist');
      set({ wishlist: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'Failed to fetch wishlist', isLoading: false });
    }
  },

  toggleWishlist: async (foodItemId: string) => {
    try {
      await api.post('/wishlist/toggle', { foodItemId });
      // Optimistic or just refetch? Better to refetch or update state immediately.
      // But since we just added an item, we might not have the full item details 
      // without refetching. However, if we just want the IDs for toggling UI, it's fine.
      // Easiest is to refetch.
      await get().fetchWishlist();
    } catch (error: unknown) {
      console.error('Failed to toggle wishlist', error);
      throw error;
    }
  }
}));
