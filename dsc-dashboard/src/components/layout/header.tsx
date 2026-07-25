"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  makeStyles,
  tokens,
  Input,
  Button,
  Avatar,
  Text,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  MenuItem,
  MenuList,
  Divider,
} from "@fluentui/react-components";
import {
  Search20Regular,
  SignOut20Regular,
  Person20Regular,
  ShieldCheckmark20Regular,
  ChevronDown20Regular,
} from "@fluentui/react-icons";
import Link from "next/link";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  status?: string | null;
  color?: string | null;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
}

const useStyles = makeStyles({
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    height: "64px",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    paddingLeft: "24px",
    paddingRight: "24px",
    backdropFilter: "blur(8px)",
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
  },
  searchResults: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow16,
    maxHeight: "320px",
    overflowY: "auto",
    zIndex: 50,
  },
  searchItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    textDecoration: "none",
    color: tokens.colorNeutralForeground1,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
    ":last-child": {
      borderBottom: "none",
    },
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
    color: tokens.colorNeutralForeground1,
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
  userInfo: {
    textAlign: "left",
    "@media (max-width: 639px)": {
      display: "none",
    },
  },
  noResults: {
    padding: "16px",
    textAlign: "center",
  },
});

export function Header() {
  const router = useRouter();
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (data.authenticated) setUser(data.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  };

  const typeIcons: Record<string, string> = {
    node: "🖥️", config: "📄", resource: "🧩", m365: "☁️", agent: "🤖", label: "🏷️",
  };

  return (
    <header className={styles.header}>
      <div className={styles.searchWrapper} ref={searchRef}>
        <Input
          contentBefore={<Search20Regular />}
          placeholder="Search nodes, configs, resources, agents, labels..."
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          appearance="filled-darker"
          style={{ width: "100%" }}
        />
        {showResults && results.length > 0 && (
          <div className={styles.searchResults}>
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.href}
                onClick={() => { setShowResults(false); setQuery(""); }}
                className={styles.searchItem}
              >
                <span style={{ fontSize: 16 }}>{typeIcons[r.type] || "📋"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size={300} weight="medium" block truncate>{r.title}</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block truncate>{r.subtitle}</Text>
                </div>
                {r.color && <div style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: r.color }} />}
              </Link>
            ))}
          </div>
        )}
        {showResults && query.length >= 2 && results.length === 0 && (
          <div className={styles.searchResults}>
            <div className={styles.noResults}>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>No results for &ldquo;{query}&rdquo;</Text>
            </div>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        {user ? (
          <Popover open={menuOpen} onOpenChange={(_, data) => setMenuOpen(data.open)}>
            <PopoverTrigger disableButtonEnhancement>
              <button className={styles.userButton}>
                <Avatar
                  name={user.name || user.email}
                  size={32}
                  color="brand"
                />
                <div className={styles.userInfo}>
                  <Text size={300} weight="medium" block>{user.name || user.email}</Text>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{user.role}</Text>
                </div>
                <ChevronDown20Regular />
              </button>
            </PopoverTrigger>
            <PopoverSurface style={{ padding: 0 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }}>
                <Text size={300} weight="medium" block>{user.name}</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{user.email}</Text>
              </div>
              <MenuList>
                <MenuItem icon={<Person20Regular />} onClick={() => { setMenuOpen(false); router.push("/settings"); }}>
                  Settings
                </MenuItem>
                {user.role === "ADMIN" && (
                  <MenuItem icon={<ShieldCheckmark20Regular />} onClick={() => { setMenuOpen(false); router.push("/admin"); }}>
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem icon={<SignOut20Regular />} onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </PopoverSurface>
          </Popover>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login"><Button appearance="subtle">Sign In</Button></Link>
            <Link href="/register"><Button appearance="primary">Create Account</Button></Link>
          </div>
        )}
      </div>
    </header>
  );
}
