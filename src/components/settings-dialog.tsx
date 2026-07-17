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
  { value: "0", label: "Tắt" },
  { value: "15000", label: "15 giây" },
  { value: "30000", label: "30 giây" },
  { value: "60000", label: "1 phút" },
];

const STATUS_OPTIONS: { value: DefaultShipmentFilter; label: string }[] = [
  { value: "all", label: "Tất cả đơn hàng" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "in_transit", label: "Đang vận chuyển" },
  { value: "delayed", label: "Trễ hạn" },
  { value: "delivered", label: "Đã giao" },
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
    toast.success("Đã đặt lại cài đặt theo mặc định");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" /> Cài đặt
          </DialogTitle>
          <DialogDescription>
            Tùy chỉnh không gian làm việc logistics của bạn. Các thay đổi được lưu tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-2">
          {/* Appearance */}
          <SettingsSection icon={Palette} title="Giao diện" description="Chủ đề và tùy chọn hiển thị">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Chủ đề</Label>
                <p className="text-xs text-muted-foreground">Chọn chủ đề sáng, tối hoặc hệ thống</p>
              </div>
              {mounted && (
                <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                  <ThemeButton active={theme === "light"} onClick={() => setTheme("light")} icon={Sun} label="Sáng" />
                  <ThemeButton active={theme === "dark"} onClick={() => setTheme("dark")} icon={Moon} label="Tối" />
                  <ThemeButton active={theme === "system"} onClick={() => setTheme("system")} icon={Monitor} label="Tự động" />
                </div>
              )}
            </div>
            <ToggleRow
              label="Banner trang tổng quan"
              description="Hiển thị banner chào mừng gradient trên trang tổng quan"
              checked={settings.showHeroBanner}
              onCheckedChange={(v) => settings.setSetting("showHeroBanner", v)}
            />
            <ToggleRow
              label="Bảng thu gọn"
              description="Giảm khoảng cách hàng để hiển thị dữ liệu dày đặc hơn"
              checked={settings.compactTables}
              onCheckedChange={(v) => settings.setSetting("compactTables", v)}
            />
          </SettingsSection>

          <Separator />

          {/* Refresh intervals */}
          <SettingsSection icon={RefreshCw} title="Làm mới dữ liệu" description="Kiểm soát tần suất tự động làm mới dữ liệu">
            <SelectRow
              label="Theo dõi trực tuyến"
              description="Cập nhật bản đồ đơn hàng theo thời gian thực"
              value={settings.trackingRefreshInterval}
              onValueChange={(v) => settings.setSetting("trackingRefreshInterval", v as RefreshInterval)}
            />
            <SelectRow
              label="Thông báo"
              description="Cảnh báo và bảng thông báo"
              value={settings.notificationsRefreshInterval}
              onValueChange={(v) => settings.setSetting("notificationsRefreshInterval", v as RefreshInterval)}
            />
            <SelectRow
              label="Tổng quan"
              description="Thẻ KPI và biểu đồ"
              value={settings.dashboardRefreshInterval}
              onValueChange={(v) => settings.setSetting("dashboardRefreshInterval", v as RefreshInterval)}
            />
          </SettingsSection>

          <Separator />

          {/* Defaults */}
          <SettingsSection icon={Filter} title="Bộ lọc mặc định" description="Bộ lọc được chọn sẵn khi mở các trang">
            <SelectRow
              label="Lọc trạng thái đơn hàng"
              description="Bộ lọc trạng thái mặc định trên trang Đơn hàng"
              value={settings.defaultShipmentStatus}
              onValueChange={(v) => settings.setSetting("defaultShipmentStatus", v as DefaultShipmentFilter)}
              options={STATUS_OPTIONS}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Số đơn hàng mỗi trang</Label>
                <p className="text-xs text-muted-foreground">Số hàng hiển thị trong bảng</p>
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
          <SettingsSection icon={Eye} title="Lập kế hoạch tuyến" description="Tùy chọn hiển thị cho thẻ tuyến">
            <ToggleRow
              label="Hiển thị thanh tiến độ"
              description="Hiển thị thanh tiến độ trên thẻ tuyến đang hoạt động"
              checked={settings.showRouteProgressBars}
              onCheckedChange={(v) => settings.setSetting("showRouteProgressBars", v)}
            />
          </SettingsSection>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
          <Button onClick={() => { onOpenChange(false); toast.success("Đã lưu cài đặt"); }} className="gap-1.5">
            <Check className="h-4 w-4" /> Xong
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
