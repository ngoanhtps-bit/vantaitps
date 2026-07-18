"use client";

import * as React from "react";
import { Menu, Search, Plus, Command, Settings as SettingsIcon, Zap, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsButton } from "@/components/notifications-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { QuickTripDialog } from "@/components/quick-trip-dialog";
import { useAppStore, type ViewKey } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_META, type UserRole } from "@/lib/constants";
import { avatarColorClass } from "@/components/avatar-color";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  dashboard: { title: "Tổng quan", subtitle: "Tổng quan hoạt động logistics" },
  shipments: { title: "Đơn hàng", subtitle: "Quản lý và theo dõi tất cả đơn hàng" },
  tracking: { title: "Theo dõi trực tuyến", subtitle: "Bản đồ đội xe và đơn hàng thời gian thực" },
  "danh-muc-xe": { title: "Danh mục xe", subtitle: "Xe và tài xế theo dòng xe container" },
  "nha-cung-cap": { title: "Nhà cung cấp xe", subtitle: "Đơn vị cho thuê xe, danh sách xe và tài xế" },
  customers: { title: "Khách hàng", subtitle: "Danh bạ khách hàng và lịch sử" },
  warehouses: { title: "Kho hàng", subtitle: "Trung tâm phân phối và công suất" },
  routes: { title: "Lập kế hoạch tuyến", subtitle: "Tối ưu hóa tuyến đường giao hàng" },
  invoices: { title: "Hóa đơn", subtitle: "Quản lý thanh toán và công nợ" },
  reports: { title: "Báo cáo", subtitle: "Tạo và xuất báo cáo vận hành" },
  analytics: { title: "Phân tích", subtitle: "Thông tin chi tiết và báo cáo hiệu suất" },
  users: { title: "Người dùng", subtitle: "Quản lý tài khoản và phân quyền" },
  "phan-quyen": { title: "Phân quyền", subtitle: "Cấu hình quyền xem/tạo/sửa/xóa theo vai trò" },
};

export function AppTopbar() {
  const { view, setSidebarOpen, setCommandOpen, setView } = useAppStore();
  const meta = VIEW_TITLES[view];
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [quickTripOpen, setQuickTripOpen] = React.useState(false);
  const { user: authUser, canView, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    useAppStore.getState().setView("dashboard");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Mở menu"
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
        <span className="flex-1 text-left">Tìm đơn hàng, tài xế…</span>
        <kbd className="flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Tìm kiếm"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Notifications */}
      <NotificationsButton />

      <ThemeToggle />

      {/* Quick trip — prominent action */}
      <Button
        size="sm"
        className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        onClick={() => setQuickTripOpen(true)}
      >
        <Zap className="h-4 w-4" />
        <span className="hidden sm:inline">Tạo chuyến nhanh</span>
        <span className="sm:hidden">Tạo chuyến</span>
      </Button>

      {/* New shipment (full form) */}
      <Button
        size="sm"
        variant="outline"
        className="hidden gap-1.5 lg:flex"
        onClick={() => {
          setView("shipments");
          window.dispatchEvent(new CustomEvent("open-new-shipment"));
        }}
      >
        <Plus className="h-4 w-4" />
        Tạo đơn hàng
      </Button>

      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Cài đặt"
        onClick={() => setSettingsOpen(true)}
      >
        <SettingsIcon className="h-[1.15rem] w-[1.15rem]" />
      </Button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border-2 border-emerald-500/40">
              <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(authUser?.avatarColor || "emerald"))}>
                {initials(authUser?.hoTen || "U")}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{authUser?.hoTen || "Người dùng"}</span>
              <span className="text-xs text-muted-foreground">@{authUser?.username} · {ROLE_META[authUser?.role as UserRole]?.label || authUser?.role}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="mr-2 h-4 w-4" /> Cài đặt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
              <Command className="mr-2 h-4 w-4" /> Phím tắt
            </DropdownMenuItem>
            {canView("users") && (
              <DropdownMenuItem onClick={() => setView("users")}>
                <UserCog className="mr-2 h-4 w-4" /> Quản lý người dùng
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-700" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <QuickTripDialog
        open={quickTripOpen}
        onOpenChange={setQuickTripOpen}
        onCreated={(id) => {
          setView("shipments");
          window.dispatchEvent(new CustomEvent("open-shipment-detail", { detail: id }));
        }}
      />
    </header>
  );
}
