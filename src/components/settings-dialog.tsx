"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Settings, RefreshCw, Bell, Palette, Filter, Eye, RotateCcw,
  Check, Monitor, Sun, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useSettingsStore,
  type RefreshInterval,
  type DefaultShipmentFilter,
} from "@/lib/settings-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: "0", label: "Off" },
  { value: "15000", label: "15 seconds" },
  { value: "30000", label: "30 seconds" },
  { value: "60000", label: "1 minute" },
];

const STATUS_OPTIONS: { value: DefaultShipmentFilter; label: string }[] = [
  { value: "all", label: "All shipments" },
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In transit" },
  { value: "delayed", label: "Delayed" },
  { value: "delivered", label: "Delivered" },
];

export function SettingsDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const settings = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const handleReset = () => {
    settings.resetSettings();
    setTheme("light");
    toast.success("Settings reset to defaults");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" /> Settings
          </DialogTitle>
          <DialogDescription>
            Customize your logistics workspace. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-2">
          {/* Appearance */}
          <SettingsSection icon={Palette} title="Appearance" description="Theme and visual preferences">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">Choose light, dark, or system theme</p>
              </div>
              {mounted && (
                <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                  <ThemeButton active={theme === "light"} onClick={() => setTheme("light")} icon={Sun} label="Light" />
                  <ThemeButton active={theme === "dark"} onClick={() => setTheme("dark")} icon={Moon} label="Dark" />
                  <ThemeButton active={theme === "system"} onClick={() => setTheme("system")} icon={Monitor} label="Auto" />
                </div>
              )}
            </div>
            <ToggleRow
              label="Dashboard hero banner"
              description="Show the gradient welcome banner on the dashboard"
              checked={settings.showHeroBanner}
              onCheckedChange={(v) => settings.setSetting("showHeroBanner", v)}
            />
            <ToggleRow
              label="Compact tables"
              description="Reduce row padding for denser data display"
              checked={settings.compactTables}
              onCheckedChange={(v) => settings.setSetting("compactTables", v)}
            />
          </SettingsSection>

          <Separator />

          {/* Refresh intervals */}
          <SettingsSection icon={RefreshCw} title="Data Refresh" description="Control how often data auto-refreshes">
            <SelectRow
              label="Live tracking"
              description="Real-time shipment map updates"
              value={settings.trackingRefreshInterval}
              onValueChange={(v) => settings.setSetting("trackingRefreshInterval", v as RefreshInterval)}
            />
            <SelectRow
              label="Notifications"
              description="Alerts and notification panel"
              value={settings.notificationsRefreshInterval}
              onValueChange={(v) => settings.setSetting("notificationsRefreshInterval", v as RefreshInterval)}
            />
            <SelectRow
              label="Dashboard"
              description="KPI cards and charts"
              value={settings.dashboardRefreshInterval}
              onValueChange={(v) => settings.setSetting("dashboardRefreshInterval", v as RefreshInterval)}
            />
          </SettingsSection>

          <Separator />

          {/* Defaults */}
          <SettingsSection icon={Filter} title="Default Filters" description="Pre-selected filters when opening views">
            <SelectRow
              label="Shipment status filter"
              description="Default status filter on Shipments page"
              value={settings.defaultShipmentStatus}
              onValueChange={(v) => settings.setSetting("defaultShipmentStatus", v as DefaultShipmentFilter)}
              options={STATUS_OPTIONS}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Shipments per page</Label>
                <p className="text-xs text-muted-foreground">Number of rows shown in the table</p>
              </div>
              <Select value={String(settings.defaultShipmentPageSize)} onValueChange={(v) => settings.setSetting("defaultShipmentPageSize", Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[8, 12, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SettingsSection>

          <Separator />

          {/* Route planning */}
          <SettingsSection icon={Eye} title="Route Planning" description="Display options for route cards">
            <ToggleRow
              label="Show progress bars"
              description="Display progress bars on active route cards"
              checked={settings.showRouteProgressBars}
              onCheckedChange={(v) => settings.setSetting("showRouteProgressBars", v)}
            />
          </SettingsSection>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => { onOpenChange(false); toast.success("Settings saved"); }} className="gap-1.5">
            <Check className="h-4 w-4" /> Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsSection({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-1 pl-9">{children}</div>
    </div>
  );
}

function ToggleRow({
  label, description, checked, onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SelectRow({
  label, description, value, onValueChange, options = REFRESH_OPTIONS,
}: {
  label: string;
  description: string;
  value: string;
  onValueChange: (v: string) => void;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemeButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
