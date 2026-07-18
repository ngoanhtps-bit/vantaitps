"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { DashboardView } from "@/components/views/dashboard-view";
import { ShipmentsView } from "@/components/views/shipments-view";
import { TrackingView } from "@/components/views/tracking-view";
import { DanhMucXeView } from "@/components/views/danh-muc-xe-view";
import { CustomersView } from "@/components/views/customers-view";
import { WarehousesView } from "@/components/views/warehouses-view";
import { NhaCungCapView } from "@/components/views/nha-cung-cap-view";
import { RoutesView } from "@/components/views/routes-view";
import { InvoicesView } from "@/components/views/invoices-view";
import { ReportsView } from "@/components/views/reports-view";
import { AnalyticsView } from "@/components/views/analytics-view";
import { UsersView } from "@/components/views/users-view";
import { PhanQuyenView } from "@/components/views/phan-quyen-view";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const { isAuthenticated, user, canView } = useAuthStore();

  // Chưa đăng nhập → hiển thị form login
  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  // Kiểm tra quyền xem view
  if (!canView(view)) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold">Không có quyền truy cập</p>
                <p className="text-xs text-muted-foreground">
                  Vai trò của bạn ({user.role}) không được phép xem trang này.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "shipments" && <ShipmentsView />}
      {view === "tracking" && <TrackingView />}
      {view === "danh-muc-xe" && <DanhMucXeView />}
      {view === "customers" && <CustomersView />}
      {view === "warehouses" && <WarehousesView />}
      {view === "nha-cung-cap" && <NhaCungCapView />}
      {view === "routes" && <RoutesView />}
      {view === "invoices" && <InvoicesView />}
      {view === "reports" && <ReportsView />}
      {view === "analytics" && <AnalyticsView />}
      {view === "users" && <UsersView />}
      {view === "phan-quyen" && <PhanQuyenView />}
    </AppShell>
  );
}
