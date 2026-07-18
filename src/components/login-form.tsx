"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore, type CurrentUser } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, User, Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_USERS = [
  { username: "admin", password: "123456", hoTen: "Quản trị viên", role: "admin" },
  { username: "dieuxe", password: "123456", hoTen: "Điều xe", role: "dieuxe" },
  { username: "dieuphoi", password: "123456", hoTen: "Điều phối", role: "dieuphoi" },
  { username: "ketoan", password: "123456", hoTen: "Kế toán", role: "ketoan" },
  { username: "thuky", password: "123456", hoTen: "Thư ký", role: "thuky" },
];

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const loginMutation = useMutation({
    mutationFn: () => api.post<CurrentUser>("/api/auth/login", { username, password }),
    onSuccess: (user) => {
      login(user);
      toast.success(`Xin chào, ${user.hoTen}!`);
    },
    onError: (e: Error) => toast.error("Đăng nhập thất bại", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setTimeout(() => loginMutation.mutate(), 100);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Logistics App V2</h1>
            <p className="text-sm text-muted-foreground">Quản lý đội xe & đơn hàng thông minh</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Tên đăng nhập
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="h-11"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Mật khẩu
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="h-11 w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang đăng nhập...</>
                ) : (
                  <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            {/* Quick login buttons */}
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Đăng nhập nhanh (demo)
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {SAMPLE_USERS.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u.username, u.password)}
                    className="rounded-lg border bg-background px-1 py-2 text-[10px] font-medium transition-colors hover:bg-muted"
                    title={`${u.hoTen} (${u.role})`}
                  >
                    {u.role === "admin" ? "Admin" :
                     u.role === "dieuxe" ? "Điều xe" :
                     u.role === "dieuphoi" ? "Đ. phối" :
                     u.role === "ketoan" ? "Kế toán" : "Thư ký"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Mật khẩu mặc định: <span className="font-mono font-semibold">123456</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          © 2026 Logistics App V2 · Mọi quyền được bảo lưu
        </p>
      </div>
    </div>
  );
}
