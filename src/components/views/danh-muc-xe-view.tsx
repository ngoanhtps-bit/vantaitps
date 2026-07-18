"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Truck, Search, ChevronDown, Car, User, Phone, Building2,
  Container as ContainerIcon, Package, Plus, Minus, Activity,
} from "lucide-react";
import { LOAI_XE_OPTIONS, LOAI_XE_NHOM } from "@/lib/constants";
import { initials } from "@/lib/format";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";

type XeThongKe = {
  tongXe: number;
  tongTaiXe: number;
  tongDongXe: number;
  groups: Array<{
    loaiXe: string;
    soLuong: number;
    soTaiXe: number;
    xes: Array<{
      id: string;
      plateNumber: string;
      loaiXe: string | null;
      model: string;
      brand: string;
      type: string;
      status: string;
      capacityKg: number;
      driver: { id: string; name: string; phone: string; avatarColor: string; status: string; rating: number } | null;
      nhaCungCap: { id: string; tenDonVi: string; maNCC: string | null; sdt: string | null } | null;
    }>;
  }>;
};

export function DanhMucXeView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");

  const { data, isLoading } = useQuery<XeThongKe>({
    queryKey: ["xe-thong-ke"],
    queryFn: () => api.get("/api/xe-thong-ke"),
    refetchInterval: 5000, // Tự động cập nhật mỗi 5s khi tạo chuyến nhanh
  });

  // Lắng nghe event tạo chuyến nhanh thành công → refresh
  React.useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ["xe-thong-ke"] });
    window.addEventListener("quick-trip-created", handler);
    return () => window.removeEventListener("quick-trip-created", handler);
  }, [qc]);

  const filteredGroups = React.useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.groups;
    const q = search.toLowerCase();
    return data.groups
      .map((g) => ({
        ...g,
        xes: g.xes.filter((x) =>
          x.plateNumber.toLowerCase().includes(q) ||
          x.driver?.name.toLowerCase().includes(q) ||
          x.driver?.phone.includes(q) ||
          x.nhaCungCap?.tenDonVi.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.xes.length > 0 || g.loaiXe.toLowerCase().includes(q));
  }, [data, search]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard title="Tổng số xe" value={data.tongXe} icon={Truck} accent="emerald" />
        <KpiCard title="Tài xế đã gán" value={data.tongTaiXe} icon={User} accent="sky" footer={`${data.tongXe - data.tongTaiXe} xe chưa có TX`} />
        <KpiCard title="Dòng xe" value={data.tongDongXe} icon={ContainerIcon} accent="violet" footer={`trên ${LOAI_XE_OPTIONS.length} loại`} />
        <KpiCard title="Đang hoạt động" value={data.groups.reduce((s, g) => s + g.xes.filter((x) => x.status === "active").length, 0)} icon={Activity} accent="amber" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm biển số, tài xế, SĐT, đơn vị NCC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danh sách theo dòng xe */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Không tìm thấy xe</p>
                <p className="text-xs text-muted-foreground">Thử từ khóa khác hoặc tạo chuyến nhanh để thêm xe.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <DongXeGroup key={group.loaiXe} group={group} />
          ))
        )}
      </div>
    </div>
  );
}

function DongXeGroup({ group }: { group: XeThongKe["groups"][number] }) {
  const [open, setOpen] = React.useState(false);
  const nhom = LOAI_XE_NHOM[group.loaiXe] || "Khác";
  const activeCount = group.xes.filter((x) => x.status === "active").length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50">
            {/* Icon nhóm xe */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <ContainerIcon className="h-5 w-5" />
            </div>

            {/* Tên dòng xe + nhóm */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{group.loaiXe}</h3>
                <Badge variant="outline" className="text-[10px]">{nhom}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {group.soLuong} xe · {group.soTaiXe} tài xế · {activeCount} hoạt động
              </p>
            </div>

            {/* Số lượng lớn */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{group.soLuong}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">xe</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {/* Table-style list — giống Google Sheet */}
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Biển số</th>
                    <th className="px-4 py-2 text-left font-medium">Tài xế</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">SĐT</th>
                    <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Đơn vị NCC</th>
                    <th className="px-4 py-2 text-left font-medium hidden lg:table-cell">Hãng / Mẫu</th>
                    <th className="px-4 py-2 text-right font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {group.xes.map((xe) => (
                    <tr key={xe.id} className="border-b last:border-0 hover:bg-muted/30">
                      {/* Biển số */}
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm font-semibold">{xe.plateNumber}</span>
                      </td>
                      {/* Tài xế */}
                      <td className="px-4 py-2.5">
                        {xe.driver ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={cn("text-[10px] font-semibold text-white", avatarColorClass(xe.driver.avatarColor))}>
                                {initials(xe.driver.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{xe.driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa gán</span>
                        )}
                      </td>
                      {/* SĐT */}
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        {xe.driver ? (
                          <span className="flex items-center gap-1 font-mono text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" /> {xe.driver.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* NCC */}
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        {xe.nhaCungCap ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{xe.nhaCungCap.tenDonVi}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Hãng/Mẫu */}
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                        {xe.brand} {xe.model}
                      </td>
                      {/* Trạng thái */}
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          xe.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                          xe.status === "maintenance" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" :
                          "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            xe.status === "active" ? "bg-emerald-500" :
                            xe.status === "maintenance" ? "bg-orange-500" : "bg-slate-400"
                          )} />
                          {xe.status === "active" ? "Hoạt động" : xe.status === "maintenance" ? "Bảo trì" : "Ngừng"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
