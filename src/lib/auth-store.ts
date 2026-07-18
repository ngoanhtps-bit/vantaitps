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

export type ViewPermission = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type Permissions = Record<string, ViewPermission>;

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  permissions: Permissions;
  setPermissions: (perms: Permissions) => void;
  login: (user: CurrentUser, permissions?: Permissions) => void;
  logout: () => void;
  canView: (view: string) => boolean;
  canCreate: (view: string) => boolean;
  canEdit: (view: string) => boolean;
  canDelete: (view: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      permissions: {},
      setPermissions: (permissions) => set({ permissions }),
      login: (user, permissions) => set({ user, isAuthenticated: true, permissions: permissions || {} }),
      logout: () => set({ user: null, isAuthenticated: false, permissions: {} }),
      canView: (view: string) => {
        const user = get().user;
        if (!user) return false;
        // Admin luôn có toàn quyền
        if (user.role === "admin") return true;
        const perm = get().permissions[view];
        return perm?.canView ?? false;
      },
      canCreate: (view: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "admin") return true;
        const perm = get().permissions[view];
        return perm?.canCreate ?? false;
      },
      canEdit: (view: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "admin") return true;
        const perm = get().permissions[view];
        return perm?.canEdit ?? false;
      },
      canDelete: (view: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "admin") return true;
        const perm = get().permissions[view];
        return perm?.canDelete ?? false;
      },
    }),
    {
      name: "logistics-auth",
    }
  )
);
