"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Divider,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Board20Regular,
  Server20Regular,
  Document20Regular,
  Warning20Regular,
  ArrowUpload20Regular,
  Settings20Regular,
  Cloud20Regular,
  ShieldCheckmark20Regular,
  History20Regular,
  Navigation20Regular,
  Dismiss20Regular,
  Sparkle20Regular,
  Apps20Regular,
  CircleFilled,
} from "@fluentui/react-icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  flag?: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Board20Regular },
  { href: "/ai", label: "AI Governance", icon: Sparkle20Regular },
  { href: "/m365", label: "M365 DSC", icon: Cloud20Regular },
  { href: "/purview", label: "Purview Labels", icon: ShieldCheckmark20Regular },
  { href: "/nodes", label: "Nodes", icon: Server20Regular, flag: "showNodes" },
  { href: "/configurations", label: "Configurations", icon: Document20Regular, flag: "showConfigurations" },
  { href: "/resources", label: "Resources", icon: Apps20Regular },
  { href: "/drift", label: "Drift Events", icon: Warning20Regular },
  { href: "/import", label: "Import", icon: ArrowUpload20Regular, flag: "showImport" },
  { href: "/settings", label: "Settings", icon: Settings20Regular },
  { href: "/changelog", label: "Changelog", icon: History20Regular },
];

const useStyles = makeStyles({
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 30,
    height: "100vh",
    width: "240px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  sidebarMobile: {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 50,
    height: "100vh",
    width: "240px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    transform: "translateX(-100%)",
    transitionProperty: "transform",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease",
  },
  sidebarMobileOpen: {
    transform: "translateX(0)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
  },
  hamburger: {
    position: "fixed",
    top: "16px",
    left: "16px",
    zIndex: 50,
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: "pointer",
    display: "none",
    "@media (max-width: 1023px)": {
      display: "block",
    },
  },
  desktopOnly: {
    "@media (max-width: 1023px)": {
      display: "none",
    },
  },
  mobileOnly: {
    "@media (min-width: 1024px)": {
      display: "none",
    },
  },
  header: {
    display: "flex",
    height: "64px",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "20px",
    paddingRight: "20px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoImg: {
    height: "32px",
    width: "32px",
    borderRadius: tokens.borderRadiusMedium,
  },
  nav: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderRadius: tokens.borderRadiusMedium,
    padding: "8px 12px",
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textDecoration: "none",
    transitionProperty: "background-color, color",
    transitionDuration: "150ms",
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
  },
  footer: {
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  closeBtn: {
    padding: "4px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
    color: tokens.colorNeutralForeground2,
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
});

export function Sidebar() {
  const pathname = usePathname();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({ showNodes: true, showConfigurations: true, showImport: true });

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

  const visibleItems = navItems.filter((item) => {
    if (!item.flag) return true;
    return flags[item.flag] !== false;
  });

  const sidebarContent = (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/logo.svg" alt="AI DSC Dashboard" className={styles.logoImg} />
          <div>
            <Text size={300} weight="bold" block>AI DSC Dashboard</Text>
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>v4.2 Configuration Manager</Text>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className={mergeClasses(styles.closeBtn, styles.mobileOnly)}>
          <Dismiss20Regular />
        </button>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={mergeClasses(styles.navItem, isActive && styles.navItemActive)}
            >
              <item.icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <CircleFilled style={{ color: "#7ECC9A", fontSize: 8 }} />
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>System Healthy</Text>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setOpen(true)} className={mergeClasses(styles.hamburger, styles.mobileOnly)} aria-label="Open navigation">
        <Navigation20Regular />
      </button>

      {/* Mobile overlay */}
      {open && <div className={mergeClasses(styles.overlay, styles.mobileOnly)} onClick={() => setOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={mergeClasses(styles.sidebarMobile, open && styles.sidebarMobileOpen, styles.mobileOnly)}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={mergeClasses(styles.sidebar, styles.desktopOnly)}>
        {sidebarContent}
      </aside>
    </>
  );
}
