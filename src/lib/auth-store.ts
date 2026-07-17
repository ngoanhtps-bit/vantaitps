"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROLE_PERMISSIONS, type UserRole } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  username: string;
  hoTen: string;
  email: string | null;
  sdt: string | null;
  role: UserRole;
  avatarColor: string;
};

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
  canView: (view: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      canView: (view: string) => {
        const user = get().user;
        if (!user) return false;
        const allowed = ROLE_PERMISSIONS[user.role] || [];
        return allowed.includes(view);
      },
    }),
    {
      name: "logistics-auth",
    }
  )
);
