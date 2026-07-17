"use client";

import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AvatarColor({ color, className }: { color: string; className?: string }) {
  return (
    <span className={cn(AVATAR_COLORS[color] || AVATAR_COLORS.emerald, className)} />
  );
}

export function avatarColorClass(color: string): string {
  return AVATAR_COLORS[color] || AVATAR_COLORS.emerald;
}
