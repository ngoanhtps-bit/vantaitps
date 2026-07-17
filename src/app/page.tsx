"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { useAppStore } from "@/lib/store";
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

export default function Home() {
  const view = useAppStore((s) => s.view);

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
    </AppShell>
  );
}
