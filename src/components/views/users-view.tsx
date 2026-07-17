"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  UserCog, Search, Plus, User, Phone, Mail, Shield, CheckCircle2,
  XCircle, Pencil, Trash2, Lock, Activity,
} from "lucide-react";
import { USER_ROLES, ROLE_META, AVATAR_COLORS, type UserRole } from "@/lib/constants";
import { avatarColorClass } from "@/components/avatar-color";
import { formatRelativeTime, initials } from "@/lib/format";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UserItem = {
  id: string; username: string; hoTen: string; email: string | null; sdt: string | null;
  role: string; active: boolean; avatarColor: string; lastLogin: string | null; createdAt: string;
};

export function UsersView() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<UserItem | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["users", { debouncedSearch, role }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (role !== "all") params.set("role", role);
      return api.get<{ items: UserItem[] }>(`/api/users?${params}`);
    },
  });

  const users = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title="Tổng người dùng" value={users.length} icon={UserCog} accent="emerald" />
        {USER_ROLES.map((r) => (
          <KpiCard
            key={r}
            title={ROLE_META[r].label}
            value={users.filter((u) => u.role === r).length}
            icon={Shield}
            accent={r === "admin" ? "rose" : r === "dieuxe" ? "emerald" : r === "dieuphoi" ? "sky" : r === "ketoan" ? "violet" : "amber"}
          />
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, username, email, SĐT…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Vai trò" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Thêm người dùng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserCog className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Không tìm thấy người dùng</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[180px]">Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className="hidden sm:table-cell">SĐT</TableHead>
                    <TableHead className="hidden lg:table-cell">Đăng nhập cuối</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(u.avatarColor))}>
                              {initials(u.hoTen)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.hoTen}</p>
                            <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                          {currentUser?.id === u.id && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600">Bạn</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role as UserRole} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-mono">{u.sdt || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {u.lastLogin ? formatRelativeTime(u.lastLogin) : "Chưa đăng nhập"}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          u.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", u.active ? "bg-emerald-500" : "bg-rose-500")} />
                          {u.active ? "Hoạt động" : "Khóa"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditUser(u)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {currentUser?.id !== u.id && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600" onClick={() => {
                              if (confirm(`Xóa người dùng "${u.hoTen}"?`)) {
                                api.delete(`/api/users/${u.id}`).then(() => {
                                  toast.success("Đã xóa người dùng");
                                  qc.invalidateQueries({ queryKey: ["users"] });
                                });
                              }
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => {
        qc.invalidateQueries({ queryKey: ["users"] });
        setCreateOpen(false);
      }} />

      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(o) => { if (!o) setEditUser(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["users"] });
            setEditUser(null);
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role] || ROLE_META.thuky;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function CreateUserDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    hoTen: "", username: "", password: "", email: "", sdt: "",
    role: "thuky" as string, avatarColor: "emerald",
  });

  React.useEffect(() => {
    if (open) setForm({ hoTen: "", username: "", password: "", email: "", sdt: "", role: "thuky", avatarColor: "emerald" });
  }, [open]);

  const create = useMutation({
    mutationFn: () => api.post("/api/users", form),
    onSuccess: () => {
      toast.success("Đã tạo người dùng");
      onCreated();
    },
    onError: (e: Error) => toast.error("Tạo thất bại", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Thêm người dùng</DialogTitle>
          <DialogDescription>Tạo tài khoản mới với phân quyền theo vai trò.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Họ và tên *</Label>
            <Input value={form.hoTen} onChange={(e) => set("hoTen", e.target.value)} placeholder="Nguyễn Văn A" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Tên đăng nhập *</Label>
            <Input value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase())} placeholder="nguyenvana" className="font-mono lowercase" />
          </div>
          <div className="space-y-1.5">
            <Label>Mật khẩu *</Label>
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label>SĐT</Label>
            <Input value={form.sdt} onChange={(e) => set("sdt", e.target.value)} placeholder="0987..." className="font-mono" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label} — {ROLE_META[r].moTa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Màu avatar</Label>
            <Select value={form.avatarColor} onValueChange={(v) => set("avatarColor", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(AVATAR_COLORS).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={create.isPending || !form.hoTen || !form.username || !form.password} onClick={() => create.mutate()} className="gap-1.5">
            {create.isPending ? "Đang tạo..." : (<><CheckCircle2 className="h-4 w-4" /> Tạo người dùng</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user, open, onOpenChange, onSaved,
}: {
  user: UserItem;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    hoTen: user.hoTen, email: user.email || "", sdt: user.sdt || "",
    role: user.role, active: user.active, avatarColor: user.avatarColor, password: "",
  });

  React.useEffect(() => {
    if (open) setForm({ hoTen: user.hoTen, email: user.email || "", sdt: user.sdt || "", role: user.role, active: user.active, avatarColor: user.avatarColor, password: "" });
  }, [open, user]);

  const save = useMutation({
    mutationFn: () => api.patch(`/api/users/${user.id}`, {
      hoTen: form.hoTen,
      email: form.email || null,
      sdt: form.sdt || null,
      role: form.role,
      active: form.active,
      avatarColor: form.avatarColor,
      password: form.password || undefined,
    }),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      onSaved();
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-emerald-500" /> Sửa người dùng</DialogTitle>
          <DialogDescription>@{user.username}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Họ và tên</Label>
            <Input value={form.hoTen} onChange={(e) => set("hoTen", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>SĐT</Label>
            <Input value={form.sdt} onChange={(e) => set("sdt", e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Màu avatar</Label>
            <Select value={form.avatarColor} onValueChange={(v) => set("avatarColor", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(AVATAR_COLORS).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Mật khẩu mới (để trống nếu không đổi)</Label>
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••" />
          </div>
          <div className="flex items-center justify-between sm:col-span-2 rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Trạng thái hoạt động</Label>
              <p className="text-xs text-muted-foreground">Khóa tài khoản để ngăn đăng nhập</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()} className="gap-1.5">
            {save.isPending ? "Đang lưu..." : (<><CheckCircle2 className="h-4 w-4" /> Lưu thay đổi</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
