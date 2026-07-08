import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '@/types';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  orgSlug: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: Admin, orgSlug?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      orgSlug: null,
      isAuthenticated: false,

      setAuth: (token, admin, orgSlug) =>
        set({ token, admin, orgSlug: orgSlug ?? null, isAuthenticated: true }),

      logout: () =>
        set({ token: null, admin: null, orgSlug: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        orgSlug: state.orgSlug,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
