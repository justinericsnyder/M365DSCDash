"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
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

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (data.authenticated) setUser(data.user);
    }).catch(() => {});
  }, []);

  // Search debounce
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

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setShowMenu(false);
    router.push("/login");
  };

  const typeIcons: Record<string, string> = {
    node: "🖥️", config: "📄", resource: "🧩", m365: "☁️", agent: "🤖", label: "🏷️",
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dsc-border bg-dsc-surface/90 backdrop-blur-sm px-4 lg:px-6">
      {/* Search — hidden on small screens, compact on medium */}
      <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md ml-10 lg:ml-0" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dsc-text-secondary" />
        <input
          type="text"
          placeholder="Search nodes, configs, resources, agents, labels..."
          className="h-9 w-full rounded-lg border border-dsc-border bg-dsc-bg pl-9 pr-3 text-sm placeholder:text-dsc-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-dsc-blue focus:border-dsc-blue transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-dsc-surface rounded-lg border border-dsc-border shadow-lg max-h-80 overflow-y-auto z-50">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.href}
                onClick={() => { setShowResults(false); setQuery(""); }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-dsc-bg transition-colors border-b border-dsc-border/50 last:border-0"
              >
                <span className="text-base">{typeIcons[r.type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dsc-text truncate">{r.title}</p>
                  <p className="text-xs text-dsc-text-secondary truncate">{r.subtitle}</p>
                </div>
                {r.status && <StatusDot status={r.status} />}
                {r.color && <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: r.color }} />}
              </Link>
            ))}
          </div>
        )}
        {showResults && query.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-dsc-surface rounded-lg border border-dsc-border shadow-lg p-4 text-center text-sm text-dsc-text-secondary z-50">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-dsc-bg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-dsc-blue to-dsc-green flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-dsc-text leading-tight">{user.name || user.email}</p>
                <p className="text-[10px] text-dsc-text-secondary leading-tight flex items-center gap-1">
                  {user.role === "ADMIN" && <Shield className="h-2.5 w-2.5" />}
                  {user.role}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-dsc-text-secondary" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-dsc-surface rounded-lg border border-dsc-border shadow-lg z-50 py-1">
                <div className="px-4 py-2 border-b border-dsc-border">
                  <p className="text-sm font-medium text-dsc-text">{user.name}</p>
                  <p className="text-xs text-dsc-text-secondary">{user.email}</p>
                </div>
                <Link href="/settings" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-dsc-text hover:bg-dsc-bg transition-colors">
                  <User className="h-4 w-4" />Settings
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-dsc-text hover:bg-dsc-bg transition-colors">
                    <Shield className="h-4 w-4" />Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-dsc-red hover:bg-dsc-red-50 transition-colors w-full text-left">
                  <LogOut className="h-4 w-4" />Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Create Account</Button></Link>
          </div>
        )}
      </div>
    </header>
  );
}

