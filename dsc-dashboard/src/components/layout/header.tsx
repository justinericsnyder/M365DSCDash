"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dsc-border bg-white/80 backdrop-blur-sm px-6">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dsc-text-secondary" />
        <input
          type="text"
          placeholder="Search nodes, configurations, resources..."
          className="h-9 w-full rounded-lg border border-dsc-border bg-dsc-bg pl-9 pr-3 text-sm placeholder:text-dsc-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-dsc-blue focus:border-dsc-blue transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-dsc-red text-[9px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-dsc-blue to-dsc-green flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  );
}
