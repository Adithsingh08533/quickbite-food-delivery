import { create } from 'zustand';
import { api } from '../services/api';

export interface CartItem {
  id: string;
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isVeg: boolean;
  restaurantId: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  restaurantId: string | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (foodItemId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  restaurantId: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cart');
      set({ 
        items: data.data.items, 
        subtotal: data.data.subtotal,
        restaurantId: data.data.restaurantId 
      });
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (foodItemId, quantity = 1) => {
    set({ isLoading: true });
    try {
      await api.post('/cart', { foodItemId, quantity });
      await get().fetchCart();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      // Re-throw so the calling component (RestaurantDetail) can display the error to the user
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    if (quantity < 1) {
      return get().removeItem(cartItemId);
    }
    
    // Optimistic UI update
    const prevItems = [...get().items];
    const prevSubtotal = get().subtotal;
    
    set((state) => {
      const newItems = state.items.map(item => 
        item.id === cartItemId ? { ...item, quantity } : item
      );
      const newSubtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return { items: newItems, subtotal: newSubtotal };
    });

    try {
      await api.patch(`/cart/${cartItemId}`, { quantity });
    } catch (err) {
      // Revert on failure
      set({ items: prevItems, subtotal: prevSubtotal });
      throw err;
    }
  },

  removeItem: async (cartItemId) => {
    // Optimistic UI update
    const prevItems = [...get().items];
    const prevSubtotal = get().subtotal;
    
    set((state) => {
      const newItems = state.items.filter(item => item.id !== cartItemId);
      const newSubtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const newRestaurantId = newItems.length === 0 ? null : state.restaurantId;
      return { items: newItems, subtotal: newSubtotal, restaurantId: newRestaurantId };
    });

    try {
      await api.delete(`/cart/${cartItemId}`);
    } catch (err) {
      set({ items: prevItems, subtotal: prevSubtotal });
      throw err;
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await api.delete('/cart');
      set({ items: [], subtotal: 0, restaurantId: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
