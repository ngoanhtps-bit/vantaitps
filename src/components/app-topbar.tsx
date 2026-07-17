"use client";

import * as React from "react";
import { Menu, Search, Plus, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsButton } from "@/components/notifications-button";
import { useAppStore, type ViewKey } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your logistics operations" },
  shipments: { title: "Shipments", subtitle: "Manage and track all shipments" },
  tracking: { title: "Live Tracking", subtitle: "Real-time fleet & shipment map" },
  drivers: { title: "Drivers", subtitle: "Driver roster and performance" },
  vehicles: { title: "Fleet", subtitle: "Vehicles and maintenance status" },
  customers: { title: "Customers", subtitle: "Customer directory and history" },
  warehouses: { title: "Warehouses", subtitle: "Distribution centers and capacity" },
  routes: { title: "Route Planning", subtitle: "Optimize delivery routes and stops" },
  analytics: { title: "Analytics", subtitle: "Insights and performance reports" },
};

export function AppTopbar() {
  const { view, setSidebarOpen, setCommandOpen, setView } = useAppStore();
  const meta = VIEW_TITLES[view];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {meta.title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {meta.subtitle}
        </p>
      </div>

      {/* Search / command */}
      <button
        onClick={() => setCommandOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex md:w-64 lg:w-80"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search shipments, drivers…</span>
        <kbd className="flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Notifications */}
      <NotificationsButton />

      <ThemeToggle />

      {/* New shipment */}
      <Button
        size="sm"
        className="hidden gap-1.5 lg:flex"
        onClick={() => {
          setView("shipments");
          // Trigger new-shipment dialog via custom event
          window.dispatchEvent(new CustomEvent("open-new-shipment"));
        }}
      >
        <Plus className="h-4 w-4" />
        New Shipment
      </Button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border-2 border-emerald-500/40">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                OP
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Ops Manager</span>
              <span className="text-xs text-muted-foreground">ops@logistics.vn</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-700">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
