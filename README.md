# AI DSC Dashboard

A full-stack Microsoft 365 governance and infrastructure compliance platform that unifies Desired State Configuration (DSC) monitoring, AI/Copilot governance, Purview data protection, and security posture management into a single real-time dashboard — powered by live Microsoft Graph API integration.

**Live:** [dsc-dashboard-vert.vercel.app](https://dsc-dashboard-vert.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Railway-336791?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Railway-DC382D?logo=redis)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## Summary

AI DSC Dashboard is a production-deployed web application that provides centralized visibility and governance across an organization's Microsoft 365 tenant. It connects to a live Azure AD tenant via OAuth2 + PKCE, pulls configuration state from 27+ Microsoft Graph API endpoints, and presents compliance status, drift detection, and security metrics across every major M365 workload.

The platform covers infrastructure DSC nodes, M365 tenant configurations (Entra ID, Exchange, SharePoint, Teams, Intune, Defender), Microsoft Purview sensitivity labels, AI/Copilot governance (Copilot for M365, Copilot Studio, Azure AI Foundry, Copilot in Fabric, Copilot for Security), and the Agent 365 Registry — all with real-time drift detection, per-property explanations sourced from Microsoft Learn documentation, and a persistent security audit trail.

Built as a solo full-stack project demonstrating end-to-end ownership: authentication system design, OAuth2 integration, encrypted token management, multi-tenant data isolation, API design, database modeling, and production deployment.

---

## Key Features

### Unified Compliance Dashboard
- Cross-source KPIs aggregating infrastructure nodes, M365 resources, Copilot agents, and Purview labels
- Health ring chart with per-source sparkline trend charts
- Tenant live data section showing auth methods, domains, Teams, sites, and OAuth grants

### Microsoft 365 DSC Monitoring
- Live sync across 10 workloads: Entra ID, Exchange, SharePoint, Teams, Intune, Defender, OneDrive, Power Platform, Fabric, Security & Compliance
- Workload compliance cards with drill-down resource explorer
- Import flow for `Microsoft365DSC` JSON report output
- OneDrive storage metrics with radial dial charts and capacity forecasting
- Secure Score visualization with letter grades and enabled services

### AI Governance Hub (7 Tabs)
- **Copilot for M365** — Admin settings, Graph connectors with schema counts, Teams AI apps, OAuth consent grants
- **Agent Registry** — Agent types (Microsoft/External/Custom/Shared), deployment status, governance alerts, risk tracking
- **Copilot Studio** — Agent governance controls, declarative vs custom engine agents
- **Azure AI Foundry** — Secure Score radial, AI-relevant security controls, model deployment cards
- **Copilot in Fabric** — Capability readiness, admin configuration, capacity SKU visualization
- **Copilot for Security** — Security alerts, incidents, Secure Score controls with progress bars
- **Overview** — Aggregated metrics, agent donut chart, connector health grid, service principal status
- All metric cards are clickable with animated drill-down modals showing underlying data

### Microsoft Purview Integration
- Sensitivity label hierarchy (5-tier taxonomy) synced from Graph API
- Protection scope monitoring with DLP policy action tracking
- Label drift detection with 11 drift types and severity-based resolve workflow

### Drift Detection & Explanations
- Per-property drift breakdown with desired vs actual state comparison
- 30+ property-specific explanations sourced from official Microsoft Learn documentation
- Each drift event shows Description, Risk, Recommendation, and direct doc link
- Unified drift view across Infrastructure DSC, M365 DSC, and Purview sources

### Security & Authentication
- bcrypt password hashing (12 rounds) with JWT sessions via `jose` (HS256)
- HTTP-only secure cookies with `__Host-` prefix in production
- SHA-256 session token hashing with sliding window refresh (7-day lifetime)
- Redis-backed rate limiting (10 attempts / 15 min) and account lockout
- PKCE-protected OAuth2 flow — no client secrets from user tenants stored
- AES-256-GCM encrypted refresh tokens at rest
- Persistent database-backed audit log tracking all auth events with IP + user agent
- Multi-tenant data isolation via `resolveTenantContext()` — users only see their own tenant data
- First registered user auto-promoted to ADMIN; subsequent users require admin approval

### Admin Controls
- User management with approval queue, promote/demote, session tracking
- Feature flag toggles to show/hide pages (Nodes, Configurations, Import) for all users
- Audit Log tab with filterable, paginated security event trail

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│   Next.js 16 App Router (React 19 + TypeScript + Tailwind CSS v4)          │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│   │Dashboard │ │ M365 DSC │ │AI Govern.│ │ Purview  │ │  Admin   │        │
│   │  Page    │ │  Page    │ │  7 Tabs  │ │  4 Tabs  │ │  Panel   │        │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
│        │             │            │             │            │               │
│   Zustand State · Radix UI Primitives · Lucide Icons · Recharts            │
│   react-hot-toast · class-variance-authority · date-fns                     │
└────────┼─────────────┼────────────┼─────────────┼────────────┼──────────────┘
         │             │            │             │            │
         ▼             ▼            ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                                 │
│                                                                             │
│   Next.js API Routes (30+ endpoints)                                        │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │  /api/auth/*          Authentication (login, register, logout)  │       │
│   │  /api/admin/*         User management, feature flags, audit log │       │
│   │  /api/dashboard       Unified KPIs across all sources           │       │
│   │  /api/m365/*          M365 DSC workload data                    │       │
│   │  /api/ai/dashboard    AI Governance aggregated metrics          │       │
│   │  /api/purview/*       Sensitivity labels, scopes, drift         │       │
│   │  /api/agents/*        Agent 365 Registry                        │       │
│   │  /api/microsoft/*     OAuth2 flow + Graph API sync engine       │       │
│   │  /api/nodes/*         Infrastructure node CRUD                  │       │
│   │  /api/configurations/*  DSC configuration management            │       │
│   │  /api/drift           Drift events across all sources           │       │
│   │  /api/resources       Unified resource instances                │       │
│   │  /api/search          Global search across all data             │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│   │   Auth Layer     │  │  Tenant Resolver  │  │   Audit Logger       │     │
│   │  bcrypt + JWT    │  │  Data isolation   │  │  Append-only DB log  │     │
│   │  CSRF + Rate     │  │  per user/tenant  │  │  IP + UA tracking    │     │
│   │  Limit + Lockout │  │  Demo fallback    │  │  16 event types      │     │
│   └────────┬─────────┘  └────────┬──────────┘  └──────────┬───────────┘     │
│            │                     │                         │                 │
└────────────┼─────────────────────┼─────────────────────────┼────────────────┘
             │                     │                         │
             ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
│                                                                             │
│   ┌─────────────────────────┐      ┌──────────────────────────────┐        │
│   │   PostgreSQL (Railway)  │      │      Redis (Railway)         │        │
│   │                         │      │                              │        │
│   │   Prisma ORM v6         │      │   API response cache         │        │
│   │   15 models:            │      │   (15-30s TTL)               │        │
│   │   · User + Session      │      │   Rate limiting counters     │        │
│   │   · Node + Configuration│      │   Account lockout tracking   │        │
│   │   · M365Tenant          │      │                              │        │
│   │   · M365Resource        │      └──────────────────────────────┘        │
│   │   · Agent365            │                                              │
│   │   · PurviewLabel/Scope  │                                              │
│   │   · DriftEvent          │                                              │
│   │   · AuditLog            │                                              │
│   │   · AppSettings         │                                              │
│   └─────────────┬───────────┘                                              │
│                 │                                                           │
└─────────────────┼───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MICROSOFT GRAPH API INTEGRATION                           │
│                                                                             │
│   OAuth2 Authorization Code + PKCE (multi-tenant Azure AD app)              │
│   AES-256-GCM encrypted refresh tokens · Automatic token rotation           │
│                                                                             │
│   27+ Graph API Endpoints across v1.0 and beta:                             │
│                                                                             │
│   Entra ID / AAD                    Security                                │
│   ├─ Conditional Access Policies    ├─ Secure Score + Control Profiles      │
│   ├─ Auth Methods Policy            ├─ Security Alerts (v2)                 │
│   ├─ Group Settings                 ├─ Security Incidents                   │
│   ├─ Authorization Policy           └─ Named Locations                      │
│   ├─ Security Defaults                                                      │
│   ├─ Directory Roles                SharePoint & OneDrive                   │
│   ├─ Domains                        ├─ Tenant Settings (beta)               │
│   └─ Cross-Tenant Access Policy     ├─ Sites                               │
│                                     └─ Drive Quota                          │
│   Intune                                                                    │
│   ├─ Device Compliance Policies     Teams                                   │
│   ├─ Device Configuration           ├─ App Settings (beta)                  │
│   └─ App Protection Policies        ├─ Joined Teams + Settings              │
│                                     └─ Channels                             │
│   AI / Copilot                                                              │
│   ├─ Copilot Admin Settings         Power Platform & Fabric                 │
│   ├─ Graph Connectors + Schemas     ├─ Environments (beta)                  │
│   ├─ Service Principals (6 filters) └─ Capacities (beta)                    │
│   ├─ Teams AI App Catalog                                                   │
│   ├─ OAuth2 AI Consent Grants       Purview                                │
│   ├─ Agent Collections/Instances    └─ Sensitivity Labels                   │
│   ├─ Agent Identities/Blueprints                                            │
│   └─ Agent Card Manifests           Exchange                                │
│                                     └─ Mailbox Settings                     │
│   Organization                                                              │
│   ├─ Org Info                                                               │
│   └─ User Profile                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Full-stack React framework with server components |
| Language | TypeScript 5 | Type-safe development across frontend and backend |
| Runtime | React 19 | UI rendering with concurrent features |
| Styling | Tailwind CSS v4 | Utility-first CSS with custom crimson-mauve dark theme |
| UI Primitives | Radix UI | Accessible dialog, dropdown, tabs, tooltip, select, popover |
| Icons | Lucide React | Consistent icon system across all pages |
| Charts | Recharts | Radial dials, sparklines, compliance visualizations |
| Animations | CSS custom | Gravity-in, stagger-children, fade-scale-in, spring bounce physics |
| Database | PostgreSQL (Railway) | Primary data store — 15 Prisma models, 6 enums |
| ORM | Prisma 6 | Type-safe database access with migrations |
| Cache | Redis (Railway) | API response caching (15-30s TTL), rate limiting, account lockout |
| Auth | bcryptjs + jose | Password hashing (12 rounds), JWT sessions (HS256) |
| Encryption | Node.js crypto | AES-256-GCM for refresh tokens, SHA-256 for session hashes |
| OAuth2 | Microsoft Identity Platform | Authorization Code + PKCE, multi-tenant Azure AD |
| API | Microsoft Graph (v1.0 + beta) | 27+ endpoints across all M365 workloads |
| State | Zustand | Client-side state management |
| Validation | Zod 4 | Runtime schema validation on all API inputs |
| Notifications | react-hot-toast | Toast notifications for user feedback |
| Hosting | Vercel | Production deployment with edge network |
| Version Control | GitHub | Source control with Vercel Git integration |

---

## Services & Infrastructure

| Service | Role | Details |
|---------|------|---------|
| **Vercel** | Application hosting | Next.js production deployment, edge CDN, serverless functions |
| **Railway** | Database hosting | PostgreSQL (primary store) + Redis (cache/rate limiting) |
| **Microsoft Azure AD** | Identity provider | Multi-tenant app registration, OAuth2 + PKCE authorization |
| **Microsoft Graph API** | Data source | 27+ REST endpoints for M365 tenant configuration state |
| **GitHub** | Source control | CI/CD pipeline via Vercel Git integration |

---

## Security Architecture

| Concern | Implementation |
|---------|---------------|
| Password storage | bcrypt with 12 salt rounds |
| Session tokens | JWT (HS256) via `jose`, SHA-256 hashed before DB storage |
| Session cookies | HTTP-only, Secure, SameSite=Strict, `__Host-` prefix in production |
| CSRF protection | Double-submit cookie with constant-time comparison (`timingSafeEqual`) |
| Rate limiting | Redis-backed, 10 requests per 15-minute window |
| Account lockout | 10 failed attempts triggers 15-minute lockout |
| Token encryption | AES-256-GCM for OAuth2 refresh tokens at rest |
| OAuth2 flow | Authorization Code + PKCE (S256), no user tenant secrets stored |
| Data isolation | `resolveTenantContext()` scopes all queries to authenticated user's tenant |
| Audit trail | Append-only `AuditLog` table — 16 event types with IP, user agent, timestamps |
| Input validation | Zod schemas on all API request bodies |
| Security headers | X-Content-Type-Options, X-Frame-Options, Cache-Control: no-store |

---

## Database Schema (15 Models)

```
User ──────────── Session (JWT hash, IP, UA, expiry)
  │
  ├── Node ────── NodeConfiguration ──── Configuration ──── ResourceInstance
  │                                                              │
  ├── DriftEvent ◄───────────────────────────────────────────────┘
  │
  ├── M365Tenant ─┬── M365Snapshot ──── M365Resource
  │               ├── Agent365
  │               ├── PurviewSensitivityLabel ──── PurviewLabelDrift
  │               └── PurviewProtectionScope
  │
  └── AuditLog (append-only security trail)

AppSettings (global feature flags)
```

---

## Project Structure

```
dsc-dashboard/
├── prisma/
│   ├── schema.prisma          # 15 models, 6 enums
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── page.tsx           # Unified dashboard
│   │   ├── ai/page.tsx        # AI Governance (7 tabs, ~2000 lines)
│   │   ├── m365/              # M365 DSC, resources, import
│   │   ├── purview/           # Sensitivity labels (4 tabs)
│   │   ├── admin/             # User management + audit log
│   │   ├── drift/             # Drift events with explanations
│   │   ├── nodes/             # Infrastructure nodes
│   │   ├── configurations/    # DSC configurations
│   │   ├── settings/          # OAuth connection + sync
│   │   ├── changelog/         # Version history timeline
│   │   ├── login/             # Authentication
│   │   ├── register/          # Registration with approval
│   │   └── api/               # 30+ API route handlers
│   │       ├── auth/          # Login, register, logout, change-password
│   │       ├── admin/         # Users, flags, audit
│   │       ├── microsoft/     # OAuth2 connect/callback/sync/disconnect
│   │       ├── m365/          # M365 DSC data endpoints
│   │       ├── ai/            # AI governance metrics
│   │       ├── purview/       # Purview labels and drift
│   │       └── agents/        # Agent 365 registry
│   ├── components/
│   │   ├── ui/                # Card, Badge, Button, Modal, EmptyState
│   │   └── layout/            # Sidebar with feature flag filtering
│   └── lib/
│       ├── auth.ts            # Full auth system (sessions, CSRF, rate limiting)
│       ├── audit.ts           # Append-only audit log writer
│       ├── microsoft-graph.ts # OAuth2 + PKCE + Graph API client
│       ├── crypto.ts          # AES-256-GCM encryption
│       ├── tenant-resolver.ts # Multi-tenant data isolation
│       ├── drift-explanations.ts # 30+ Microsoft Learn-sourced explanations
│       ├── db.ts              # Prisma client singleton
│       ├── redis.ts           # ioredis client singleton
│       └── utils.ts           # Shared utilities
└── public/
    └── logo.svg               # Custom branding
```

---

## Quick Start

```bash
git clone https://github.com/justinericsnyder/M365DSCDash.git
cd M365DSCDash/dsc-dashboard
npm install

# Configure environment
cp .env.example .env
# Set: DATABASE_URL, REDIS_URL, AUTH_SECRET (32+ chars),
#       AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, NEXTAUTH_URL

# Initialize database
npx prisma generate
npx prisma db push

# Seed demo data
npm run dev
# Then POST to: /api/seed, /api/m365/seed, /api/agents/seed, /api/purview/seed

# Or connect your live M365 tenant via Settings → Connect Microsoft 365
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_SECRET` | Yes | 32+ character secret for JWT signing and AES-256 encryption |
| `AZURE_CLIENT_ID` | Yes | Azure AD app registration client ID |
| `AZURE_CLIENT_SECRET` | Yes | Azure AD app registration client secret |
| `AZURE_TENANT_ID` | No | Azure AD tenant ID (defaults to `organizations` for multi-tenant) |
| `NEXTAUTH_URL` | Yes | Production URL (e.g., `https://dsc-dashboard-vert.vercel.app`) |

---

## Azure AD App Registration

The application requires a multi-tenant Azure AD app registration with the following Microsoft Graph API permissions (Application + Delegated):

<details>
<summary>Required API Permissions (27 scopes)</summary>

- `User.Read` — Basic profile
- `Organization.Read.All` — Tenant info
- `Directory.Read.All` — Groups, domains, roles
- `Policy.Read.All` — Conditional Access, auth methods, security defaults
- `SensitivityLabel.Read` — Purview labels
- `SecurityEvents.Read.All` — Security events
- `SecurityAlert.Read.All` — Security alerts v2
- `SecurityIncident.Read.All` — Security incidents
- `DeviceManagementConfiguration.Read.All` — Intune compliance & config
- `DeviceManagementApps.Read.All` — Intune app protection
- `MailboxSettings.Read` — Exchange mailbox settings
- `SharePointTenantSettings.Read.All` — SharePoint admin
- `RoleManagement.Read.Directory` — Role definitions & assignments
- `Sites.Read.All` — SharePoint sites, OneDrive
- `Team.ReadBasic.All` — Teams list
- `TeamSettings.Read.All` — Teams settings
- `Channel.ReadBasic.All` — Teams channels
- `ExternalConnection.Read.All` — Graph connectors
- `AppCatalog.Read.All` — Teams app catalog
- `TeamworkAppSettings.Read.All` — Teams app settings
- `AgentCollection.Read.All` — Agent collections
- `AgentIdentity.Read.All` — Agent identities
- `AgentIdentityBlueprint.Read.All` — Agent blueprints
- `AgentInstance.Read.All` — Agent instances
- `AgentCardManifest.Read.All` — Agent card manifests
- `offline_access` — Refresh token

</details>

---

## License

Private repository. All rights reserved.
