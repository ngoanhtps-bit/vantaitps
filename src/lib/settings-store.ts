"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RefreshInterval = "0" | "15000" | "30000" | "60000";
export type DefaultShipmentFilter = "all" | "pending" | "in_transit" | "delayed" | "delivered";
export type DashboardLayout = "default" | "compact";

interface SettingsState {
  // Refresh intervals (ms, "0" = off)
  trackingRefreshInterval: RefreshInterval;
  notificationsRefreshInterval: RefreshInterval;
  dashboardRefreshInterval: RefreshInterval;
  // Defaults
  defaultShipmentStatus: DefaultShipmentFilter;
  defaultShipmentPageSize: number;
  // Display
  showHeroBanner: boolean;
  showRouteProgressBars: boolean;
  compactTables: boolean;
  // Theme is handled by next-themes, but we store a preference
  themePreference: "light" | "dark" | "system";
  setSetting: <K extends keyof Omit<SettingsState, "setSetting" | "resetSettings">>(
    key: K,
    value: SettingsState[K]
  ) => void;
  resetSettings: () => void;
}

const DEFAULTS = {
  trackingRefreshInterval: "15000" as RefreshInterval,
  notificationsRefreshInterval: "60000" as RefreshInterval,
  dashboardRefreshInterval: "30000" as RefreshInterval,
  defaultShipmentStatus: "all" as DefaultShipmentFilter,
  defaultShipmentPageSize: 12,
  showHeroBanner: true,
  showRouteProgressBars: true,
  compactTables: false,
  themePreference: "light" as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      resetSettings: () => set({ ...DEFAULTS }),
    }),
    {
      name: "logistics-app-settings",
      version: 1,
    }
  )
);
