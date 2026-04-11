"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Server, FileCode2, AlertTriangle, Upload,
  Settings, Blocks, Cloud, ShieldCheck, History, Menu, X,
  Sparkles,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  flag?: string; // feature flag key — if set, item is hidden when flag is false
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-dsc-blue" },
  { href: "/ai", label: "AI Governance", icon: Sparkles, color: "text-purple-600" },
  { href: "/m365", label: "M365 DSC", icon: Cloud, color: "text-dsc-blue" },
  { href: "/purview", label: "Purview Labels", icon: ShieldCheck, color: "text-purple-600" },
  { href: "/nodes", label: "Nodes", icon: Server, color: "text-dsc-green", flag: "showNodes" },
  { href: "/configurations", label: "Configurations", icon: FileCode2, color: "text-dsc-yellow", flag: "showConfigurations" },
  { href: "/resources", label: "Resources", icon: Blocks, color: "text-dsc-red" },
  { href: "/drift", label: "Drift Events", icon: AlertTriangle, color: "text-dsc-yellow" },
  { href: "/import", label: "Import", icon: Upload, color: "text-dsc-blue", flag: "showImport" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-dsc-text-secondary" },
  { href: "/changelog", label: "Changelog", icon: History, color: "text-dsc-text-secondary" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({ showNodes: true, showConfigurations: true, showImport: true });

  // Fetch feature flags
  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/flags");
      const data = await res.json();
      if (data.flags) setFlags(data.flags);
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Filter nav items based on flags
  const visibleItems = navItems.filter((item) => {
    if (!item.flag) return true;
    return flags[item.flag] !== false;
  });

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-dsc-border px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B3A5C] to-[#B89ADA]">
            <Blocks className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-dsc-text tracking-tight">DSC Dashboard</h1>
            <p className="text-[10px] text-dsc-text-secondary">v3.5 Configuration Manager</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-dsc-border/30">
          <X className="h-5 w-5 text-dsc-text-secondary" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-dsc-surface text-dsc-text shadow-sm border border-dsc-border/50" : "text-dsc-text-secondary hover:bg-dsc-surface/60 hover:text-dsc-text"
              )}>
              <item.icon className={cn("h-4 w-4", isActive ? item.color : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-dsc-border p-4">
        <div className="flex items-center gap-2 text-xs text-dsc-text-secondary">
          <div className="h-2 w-2 rounded-full bg-dsc-green pulse-dot" />
          <span>System Healthy</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-dsc-surface border border-dsc-border shadow-sm" aria-label="Open navigation">
        <Menu className="h-5 w-5 text-dsc-text" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-dsc-border bg-dsc-sidebar transition-transform duration-200 lg:hidden", open ? "translate-x-0" : "-translate-x-full")}>{sidebarContent}</aside>
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-screen w-60 flex-col border-r border-dsc-border bg-dsc-sidebar">{sidebarContent}</aside>
    </>
  );
}
