"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck, Eye, Plus, Pencil, Trash2, RotateCcw, Lock, CheckCircle2,
  AlertTriangle, Info,
} from "lucide-react";
import { USER_ROLES, ROLE_META, type UserRole } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewDef = { key: string; label: string; icon: string };
type PermMatrix = Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>>;

const ACTIONS = [
  { key: "canView", label: "Xem", icon: Eye, color: "text-sky-500" },
  { key: "canCreate", label: "Tạo", icon: Plus, color: "text-emerald-500" },
  { key: "canEdit", label: "Sửa", icon: Pencil, color: "text-amber-500" },
  { key: "canDelete", label: "Xóa", icon: Trash2, color: "text-rose-500" },
] as const;

export function PhanQuyenView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{
    matrix: PermMatrix;
    views: ViewDef[];
    roles: string[];
  }>({
    queryKey: ["permissions"],
    queryFn: () => api.get("/api/permissions"),
  });

  const updatePerm = useMutation({
    mutationFn: (body: { role: string; view: string; canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) =>
      api.put("/api/permissions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });

  const resetPerms = useMutation({
    mutationFn: () => api.post("/api/permissions"),
    onSuccess: () => {
      toast.success("Đã reset quyền về mặc định");
      qc.invalidateQueries({ queryKey: ["permissions"] });
    },
  });

  const handleToggle = (role: string, view: string, action: string, value: boolean) => {
    updatePerm.mutate({ role, view, [action]: value });
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { matrix, views } = data;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Quản lý phân quyền theo vai trò</p>
            <p className="text-xs text-muted-foreground">
              Bật/tắt từng quyền (Xem, Tạo, Sửa, Xóa) cho từng vai trò và trang. Admin luôn có toàn quyền và không thể thay đổi.
              Thay đổi có hiệu lực ngay — user cần đăng nhập lại để áp dụng.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm("Reset tất cả quyền về mặc định?")) resetPerms.mutate();
            }}
            disabled={resetPerms.isPending}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset mặc định
          </Button>
        </CardContent>
      </Card>

      {/* Permission matrix — 1 card per role */}
      <div className="grid grid-cols-1 gap-4">
        {USER_ROLES.map((role) => {
          const meta = ROLE_META[role];
          const isAdmin = role === "admin";
          const rolePerms = matrix[role] || {};

          return (
            <Card key={role} className={cn("overflow-hidden", isAdmin && "border-rose-200 dark:border-rose-900")}>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isAdmin ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground"
                    )}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{meta.label}</CardTitle>
                        {isAdmin && (
                          <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
                            <Lock className="h-2.5 w-2.5" /> Khóa
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">{meta.moTa}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">
                      {views.filter((v) => rolePerms[v.key]?.canView).length}
                      <span className="text-sm text-muted-foreground">/{views.length}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">trang được xem</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isAdmin ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-rose-600 dark:text-rose-400">
                    <Lock className="h-4 w-4" />
                    Admin có toàn quyền — không thể thay đổi
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scroll">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="min-w-[180px]">Trang</TableHead>
                          {ACTIONS.map((a) => (
                            <TableHead key={a.key} className="text-center w-[80px]">
                              <span className="flex flex-col items-center gap-0.5">
                                <a.icon className={cn("h-3.5 w-3.5", a.color)} />
                                <span className="text-[10px]">{a.label}</span>
                              </span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {views.map((view) => {
                          const perm = rolePerms[view.key] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
                          return (
                            <TableRow key={view.key} className="hover:bg-muted/30">
                              <TableCell>
                                <span className="text-sm font-medium">{view.label}</span>
                                <span className="ml-2 font-mono text-[10px] text-muted-foreground">{view.key}</span>
                              </TableCell>
                              {ACTIONS.map((a) => {
                                const value = perm[a.key as keyof typeof perm];
                                const isViewAction = a.key === "canView";
                                // canCreate/Edit/Delete chỉ bật được khi canView = true
                                const disabled = !isViewAction && !perm.canView && !value;
                                return (
                                  <TableCell key={a.key} className="text-center">
                                    <Switch
                                      checked={value}
                                      disabled={disabled}
                                      onCheckedChange={(v) => handleToggle(role, view.key, a.key, v)}
                                    />
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Tóm tắt phân quyền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USER_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const rolePerms = matrix[role] || {};
              const viewCount = views.filter((v) => rolePerms[v.key]?.canView).length;
              const createCount = views.filter((v) => rolePerms[v.key]?.canCreate).length;
              const editCount = views.filter((v) => rolePerms[v.key]?.canEdit).length;
              const deleteCount = views.filter((v) => rolePerms[v.key]?.canDelete).length;

              return (
                <div key={role} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Xem: <span className="font-semibold text-foreground">{viewCount}</span></span>
                    <span className="text-muted-foreground">Tạo: <span className="font-semibold text-foreground">{createCount}</span></span>
                    <span className="text-muted-foreground">Sửa: <span className="font-semibold text-foreground">{editCount}</span></span>
                    <span className="text-muted-foreground">Xóa: <span className="font-semibold text-foreground">{deleteCount}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
