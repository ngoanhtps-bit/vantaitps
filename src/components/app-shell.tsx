"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type ViewKey } from "@/lib/store";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard, Package, MapPin, Truck, BarChart3,
  Heart, Zap, Route as RouteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "shipments", label: "Shipments", icon: Package },
  { key: "tracking", label: "Tracking", icon: MapPin },
  { key: "routes", label: "Routes", icon: RouteIcon },
  { key: "analytics", label: "Stats", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, view, setView, setCommandOpen } = useAppStore();
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // ? to open shortcuts help (not when typing)
      if (e.key === "?" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // N for new shipment (not when typing)
      if (e.key === "n" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setView("shipments");
        window.dispatchEvent(new CustomEvent("open-new-shipment"));
        return;
      }

      // G + letter for navigation (not when typing)
      if (e.key === "g" && !isTyping && !e.metaKey && !e.ctrlKey) {
        const onKeyup = (e2: KeyboardEvent) => {
          const map: Record<string, ViewKey> = {
            d: "dashboard", s: "shipments", t: "tracking",
            r: "reports", a: "analytics",
          };
          const v = map[e2.key.toLowerCase()];
          if (v) {
            e2.preventDefault();
            setView(v);
          }
          window.removeEventListener("keyup", onKeyup);
        };
        window.addEventListener("keyup", onKeyup, { once: true });
        setTimeout(() => window.removeEventListener("keyup", onKeyup), 1000);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setView]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Desktop layout */}
      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <div className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-0 h-screen">
            <AppSidebar />
          </div>
        </div>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Sticky footer */}
          <footer className="mt-auto hidden border-t bg-background/80 backdrop-blur-sm md:block">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground md:flex-row md:px-6">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground">Logistics App V2</span>
                <span className="text-muted-foreground/60">·</span>
                <span>Smart Fleet & Shipment Operations</span>
              </div>
              <div className="flex items-center gap-4">
                <span>v2.1.0</span>
                <span className="flex items-center gap-1">
                  Built with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> for modern logistics
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 backdrop-blur-md md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => useAppStore.getState().setView(item.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {item.label}
              {active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-emerald-500"
                />
              )}
            </button>
          );
        })}
      </nav>

      <CommandPalette />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
