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
  { keys: ["G", "D"], description: "Go to Dashboard", icon: Command },
  { keys: ["G", "S"], description: "Go to Shipments" },
  { keys: ["G", "T"], description: "Go to Live Tracking" },
  { keys: ["G", "R"], description: "Go to Reports" },
  { keys: ["G", "A"], description: "Go to Analytics" },
];

const ACTION_SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open command palette / search", icon: Search },
  { keys: ["?"], description: "Show this help dialog", icon: Keyboard },
  { keys: ["N"], description: "New shipment", icon: Plus },
  { keys: ["Esc"], description: "Close dialog / drawer" },
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
            <Keyboard className="h-5 w-5 text-emerald-500" /> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Use these shortcuts to navigate and perform actions faster.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigation</h3>
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
            <p className="font-medium text-foreground">Tip:</p>
            <p className="mt-0.5">Press <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-medium">⌘ K</kbd> anytime to open the command palette — search shipments, drivers, vehicles, and customers, or jump to any view.</p>
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
