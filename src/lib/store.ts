"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "shipments"
  | "tracking"
  | "drivers"
  | "vehicles"
  | "customers"
  | "warehouses"
  | "routes"
  | "invoices"
  | "reports"
  | "analytics";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // optional deep-link: when navigating to shipments, preselect a filter
  shipmentsFilter: string | null;
  setShipmentsFilter: (f: string | null) => void;
  selectedShipmentId: string | null;
  setSelectedShipmentId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
  shipmentsFilter: null,
  setShipmentsFilter: (shipmentsFilter) => set({ shipmentsFilter }),
  selectedShipmentId: null,
  setSelectedShipmentId: (selectedShipmentId) => set({ selectedShipmentId }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
