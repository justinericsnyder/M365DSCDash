"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  FileCode2,
  AlertTriangle,
  Upload,
  Settings,
  Blocks,
  Cloud,
  Bot,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-dsc-blue" },
  { href: "/m365", label: "M365 DSC", icon: Cloud, color: "text-dsc-blue" },
  { href: "/purview", label: "Purview Labels", icon: ShieldCheck, color: "text-purple-600" },
  { href: "/agents", label: "Agent Registry", icon: Bot, color: "text-dsc-green" },
  { href: "/nodes", label: "Nodes", icon: Server, color: "text-dsc-green" },
  { href: "/configurations", label: "Configurations", icon: FileCode2, color: "text-dsc-yellow" },
  { href: "/resources", label: "Resources", icon: Blocks, color: "text-dsc-red" },
  { href: "/drift", label: "Drift Events", icon: AlertTriangle, color: "text-dsc-yellow" },
  { href: "/import", label: "Import", icon: Upload, color: "text-dsc-blue" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-dsc-text-secondary" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-dsc-border bg-dsc-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-dsc-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-dsc-blue to-dsc-green">
          <Blocks className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-dsc-text tracking-tight">DSC Dashboard</h1>
          <p className="text-[10px] text-dsc-text-secondary">v3.0 Configuration Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-dsc-text shadow-sm border border-dsc-border/50"
                  : "text-dsc-text-secondary hover:bg-white/60 hover:text-dsc-text"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? item.color : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-dsc-border p-4">
        <div className="flex items-center gap-2 text-xs text-dsc-text-secondary">
          <div className="h-2 w-2 rounded-full bg-dsc-green pulse-dot" />
          <span>System Healthy</span>
        </div>
      </div>
    </aside>
  );
}
