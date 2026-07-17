"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Command, Search, Plus, ArrowLeft, ArrowRight } from "lucide-react";

type Shortcut = {
  keys: string[];
  description: string;
  icon?: React.ElementType;
};

const NAV_SHORTCUTS: Shortcut[] = [
  { keys: ["G", "D"], description: "Đi đến Tổng quan", icon: Command },
  { keys: ["G", "S"], description: "Đi đến Đơn hàng" },
  { keys: ["G", "T"], description: "Đi đến Theo dõi" },
  { keys: ["G", "R"], description: "Đi đến Báo cáo" },
  { keys: ["G", "A"], description: "Đi đến Phân tích" },
];

const ACTION_SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Mở bảng lệnh / tìm kiếm", icon: Search },
  { keys: ["?"], description: "Hiển thị trợ giúp này", icon: Keyboard },
  { keys: ["N"], description: "Tạo đơn hàng mới", icon: Plus },
  { keys: ["Esc"], description: "Đóng hộp thoại / ngăn kéo" },
];

export function KeyboardShortcutsDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-500" /> Phím tắt
          </DialogTitle>
          <DialogDescription>Sử dụng các phím tắt này để điều hướng và thực hiện thao tác nhanh hơn.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thao tác</h3>
            <div className="space-y-1.5">
              {ACTION_SHORTCUTS.map((s) => (
                <div key={s.description} className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-sm">
                    {s.icon && <s.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {s.description}
                  </span>
                  <KeyCombo keys={s.keys} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điều hướng</h3>
            <div className="space-y-1.5">
              {NAV_SHORTCUTS.map((s) => (
                <div key={s.description} className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-sm">
                    {s.icon && <s.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {s.description}
                  </span>
                  <KeyCombo keys={s.keys} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Mẹo:</p>
            <p className="mt-0.5">Nhấn <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-medium">⌘ K</kbd> bất cứ lúc nào để mở bảng lệnh — tìm đơn hàng, tài xế, phương tiện và khách hàng, hoặc chuyển đến bất kỳ trang nào.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
          <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
