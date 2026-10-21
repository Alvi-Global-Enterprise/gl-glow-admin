import { create } from 'zustand';
import { StaffUser, StoreMembership, AdminLoginResponse, ApiResponse } from '@/types/admin';
import adminApiClient from '@/lib/adminApiClient';

interface AdminState {
  staff: StaffUser | null;
  token: string | null;
  stores: StoreMembership[];
  activeStore: StoreMembership | null;
  canAccessAllStores: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  hydrate: () => void;
  setAuth: (payload: AdminLoginResponse) => void;
  setActiveStore: (store: StoreMembership) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  staff: null,
  token: null,
  stores: [],
  activeStore: null,
  canAccessAllStores: false,
  isLoading: false,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('admin_token');
      const staffJson = localStorage.getItem('admin_user');
      const storesJson = localStorage.getItem('admin_stores');
      const activeStoreCode = localStorage.getItem('active_store_code');

      const staff: StaffUser | null = staffJson ? JSON.parse(staffJson) : null;
      const stores: StoreMembership[] = storesJson ? JSON.parse(storesJson) : [];
      let activeStore: StoreMembership | null = null;

      if (activeStoreCode && stores.length > 0) {
        activeStore = stores.find((s) => s.store_code === activeStoreCode) || null;
      }

      set({
        token,
        staff,
        stores,
        activeStore,
        isHydrated: true,
      });
    } catch (e) {
      console.error('Failed to hydrate admin state:', e);
      set({ isHydrated: true });
    }
  },

  setAuth: (payload: AdminLoginResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', payload.token);
      localStorage.setItem('admin_user', JSON.stringify(payload.staff));
      localStorage.setItem('admin_stores', JSON.stringify(payload.stores));
    }

    // Determine initial active store if user has only 1 store
    let activeStore: StoreMembership | null = null;
    if (payload.stores && payload.stores.length === 1) {
      activeStore = payload.stores[0];
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_store_code', activeStore.store_code);
      }
    }

    set({
      token: payload.token,
      staff: payload.staff,
      stores: payload.stores,
      activeStore,
      canAccessAllStores: payload.can_access_all_stores || false,
    });
  },

  setActiveStore: (store: StoreMembership) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_store_code', store.store_code);
    }
    set({ activeStore: store });
  },

  refreshMe: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (!token) return;

    // Avoid multiple concurrent refreshes
    if (get().isLoading) return;

    try {
      set({ isLoading: true });
      const response = await adminApiClient.get<ApiResponse<{ staff: StaffUser; stores: StoreMembership[]; can_access_all_stores?: boolean }>>(
        '/admin/auth/me'
      );

      if (response.data?.success && response.data?.data) {
        const { staff, stores, can_access_all_stores } = response.data.data;
        const currentActiveCode = typeof window !== 'undefined' ? localStorage.getItem('active_store_code') : null;
        let matchedActive: StoreMembership | null = null;

        if (currentActiveCode) {
          matchedActive = stores.find((s) => s.store_code === currentActiveCode) || null;
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_user', JSON.stringify(staff));
          localStorage.setItem('admin_stores', JSON.stringify(stores));
        }

        const currentActive = get().activeStore;
        // Keep existing activeStore reference if the active store code and role haven't changed
        const isSameStore =
          currentActive &&
          matchedActive &&
          currentActive.store_code === matchedActive.store_code &&
          currentActive.role === matchedActive.role;

        set({
          staff,
          stores,
          activeStore: isSameStore ? currentActive : matchedActive,
          canAccessAllStores: !!can_access_all_stores,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch /admin/auth/me:', err);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const token = get().token;
      if (token) {
        await adminApiClient.post('/admin/auth/logout').catch(() => {});
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_stores');
        localStorage.removeItem('active_store_code');
      }
      set({
        staff: null,
        token: null,
        stores: [],
        activeStore: null,
        canAccessAllStores: false,
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
}));
