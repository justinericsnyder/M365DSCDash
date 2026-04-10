import { create } from "zustand";

interface DashboardStats {
  nodes: { total: number; compliant: number; drifted: number; error: number };
  configurations: { total: number; active: number };
  resources: { total: number; compliant: number; complianceRate: number };
  compliance: { rate: number };
  drift: { unresolved: number; recent: DriftEvent[] };
}

interface Node {
  id: string;
  name: string;
  hostname: string;
  platform: string;
  status: string;
  lastSeen: string | null;
  lastDrift: string | null;
  tags: string[];
  configurations?: { configuration: { name: string; status: string } }[];
  _count?: { driftEvents: number };
}

interface Configuration {
  id: string;
  name: string;
  description: string | null;
  document: Record<string, unknown>;
  version: number;
  status: string;
  resources?: { id: string; name: string; resourceType: string; inDesiredState: boolean }[];
  nodes?: { node: { name: string; status: string } }[];
  _count?: { resources: number; nodes: number };
}

interface ResourceInstance {
  id: string;
  name: string;
  resourceType: string;
  properties: Record<string, unknown>;
  desiredState: Record<string, unknown> | null;
  actualState: Record<string, unknown> | null;
  inDesiredState: boolean;
  lastChecked: string | null;
  configuration: { id: string; name: string; status: string };
  _count?: { driftEvents: number };
}

interface DriftEvent {
  id: string;
  nodeId: string;
  severity: string;
  differingProperties: string[];
  desiredState: Record<string, unknown> | null;
  actualState: Record<string, unknown> | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  node?: { id: string; name: string; hostname: string; platform: string };
  resourceInstance?: { id: string; name: string; resourceType: string } | null;
}

interface AppStore {
  // Dashboard
  stats: DashboardStats | null;
  statsLoading: boolean;
  fetchStats: () => Promise<void>;

  // Nodes
  nodes: Node[];
  nodesLoading: boolean;
  fetchNodes: (filters?: Record<string, string>) => Promise<void>;
  createNode: (data: Partial<Node>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  // Configurations
  configurations: Configuration[];
  configsLoading: boolean;
  fetchConfigurations: (filters?: Record<string, string>) => Promise<void>;
  createConfiguration: (data: { name: string; description?: string; document: string | object }) => Promise<void>;

  // Resources
  resources: ResourceInstance[];
  resourcesLoading: boolean;
  fetchResources: (filters?: Record<string, string>) => Promise<void>;

  // Drift
  driftEvents: DriftEvent[];
  driftLoading: boolean;
  fetchDriftEvents: (filters?: Record<string, string>) => Promise<void>;
  resolveDrift: (id: string) => Promise<void>;

  // Seed
  seedData: () => Promise<void>;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function buildQuery(base: string, filters?: Record<string, string>): string {
  if (!filters) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const useStore = create<AppStore>((set) => ({
  stats: null,
  statsLoading: false,
  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await apiFetch<DashboardStats>("/api/dashboard");
      set({ stats, statsLoading: false });
    } catch { set({ statsLoading: false }); }
  },

  nodes: [],
  nodesLoading: false,
  fetchNodes: async (filters) => {
    set({ nodesLoading: true });
    try {
      const nodes = await apiFetch<Node[]>(buildQuery("/api/nodes", filters));
      set({ nodes, nodesLoading: false });
    } catch { set({ nodesLoading: false }); }
  },
  createNode: async (data) => {
    await apiFetch("/api/nodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  },
  deleteNode: async (id) => {
    await apiFetch(`/api/nodes/${id}`, { method: "DELETE" });
  },

  configurations: [],
  configsLoading: false,
  fetchConfigurations: async (filters) => {
    set({ configsLoading: true });
    try {
      const configurations = await apiFetch<Configuration[]>(buildQuery("/api/configurations", filters));
      set({ configurations, configsLoading: false });
    } catch { set({ configsLoading: false }); }
  },
  createConfiguration: async (data) => {
    await apiFetch("/api/configurations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  },

  resources: [],
  resourcesLoading: false,
  fetchResources: async (filters) => {
    set({ resourcesLoading: true });
    try {
      const resources = await apiFetch<ResourceInstance[]>(buildQuery("/api/resources", filters));
      set({ resources, resourcesLoading: false });
    } catch { set({ resourcesLoading: false }); }
  },

  driftEvents: [],
  driftLoading: false,
  fetchDriftEvents: async (filters) => {
    set({ driftLoading: true });
    try {
      const driftEvents = await apiFetch<DriftEvent[]>(buildQuery("/api/drift", filters));
      set({ driftEvents, driftLoading: false });
    } catch { set({ driftLoading: false }); }
  },
  resolveDrift: async (id) => {
    await apiFetch("/api/drift", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, resolved: true }) });
  },

  seedData: async () => {
    await apiFetch("/api/seed", { method: "POST" });
  },
}));
