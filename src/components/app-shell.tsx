"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { CommandPalette } from "@/components/command-palette";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Github, Heart, Zap } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

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
          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>

          {/* Sticky footer */}
          <footer className="mt-auto border-t bg-background/80 backdrop-blur-sm">
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
                <span>v2.0.0</span>
                <span className="flex items-center gap-1">
                  Built with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> for modern logistics
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
}
