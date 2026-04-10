# DSC Dashboard

A web-based dashboard for visualizing and managing [PowerShell Desired State Configuration (DSC) v3](https://github.com/PowerShell/DSC) data, [Microsoft365DSC](https://microsoft365dsc.com/) tenant configurations, and [Agent 365 Registry](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-registry) data.

Built with Next.js, PostgreSQL (Prisma), and Redis. Deployed on **Vercel** (app) + **Railway** (Redis + Postgres).

**Live:** [dsc-dashboard-vert.vercel.app](https://dsc-dashboard-vert.vercel.app)

## Features

### Infrastructure DSC (PowerShell DSC v3)
- **Dashboard** — KPI cards, compliance rates, node status breakdown, resource compliance ring chart
- **Nodes** — 20 managed machines across prod/staging/dev with status tracking, platform badges, tag filtering
- **Configurations** — 10 DSC configuration documents (IIS Baseline, CIS Security, SQL Server, AD DC, etc.)
- **Resources** — 48 resource instances with type grouping and compliance filtering
- **Drift Events** — Severity-based drift tracking with expandable desired vs actual state diffs
- **Import** — Paste or upload DSC YAML/JSON documents with validation

### Microsoft 365 DSC
- **M365 Dashboard** — Workload compliance cards for Entra ID, Exchange, SharePoint, Teams, Intune, Security & Compliance, Defender, OneDrive
- **31 tenant resources** with 7 realistic drift scenarios (Conditional Access in report-only, SharePoint sharing too open, Teams anonymous join enabled, etc.)
- **Resource Explorer** — Grouped by resource type, expandable desired vs actual state, filterable by workload/status
- **Import** — Accepts `New-M365DSCReportFromConfiguration -Type JSON` output

### Agent 365 Registry
- **Agent Dashboard** — Overview of all Copilot agents: Microsoft, External, Custom, and Shared
- **16 demo agents** including Copilot Chat, Researcher, ServiceNow, Salesforce, Jira, custom HR/Legal/Sales agents
- **Governance tracking** — Blocked agents, ownerless agents, risk counts, sensitivity labels, pinned agents
- **Deployment status** — Available/deployed/pinned scope per agent, supported hosts (Copilot, Teams, Outlook, Word, Excel)
- **Data model** matches Graph API `GET /beta/copilot/admin/catalog/packages` response schema

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Railway (Prisma ORM) |
| Cache | Redis via Railway (ioredis) |
| State | Zustand |
| UI | Custom component library (Card, Badge, Button, StatusDot, EmptyState) |
| Hosting | Vercel |

## Architecture

```
Vercel (Next.js App)
├── /                    Dashboard (infra overview)
├── /m365                M365 DSC workload compliance
├── /m365/resources      M365 resource explorer
├── /m365/import         Import M365DSC JSON reports
├── /agents              Agent 365 Registry
├── /nodes               Infrastructure nodes
├── /configurations      DSC configuration documents
├── /resources           DSC resource instances
├── /drift               Drift event management
├── /import              DSC document import
└── /settings            Data management & seeding

Railway
├── PostgreSQL           Primary database (Prisma)
└── Redis                API response caching
```

## Quick Start

```bash
cd dsc-dashboard
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and REDIS_URL

# Push schema & generate client
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

Visit `http://localhost:3000` and click **Load Demo Data**, or go to Settings to seed all data at once.

## Deployment

### Railway (Redis + Postgres)
1. `railway init --name dsc-dashboard-infra`
2. `railway add --database redis`
3. `railway add --database postgres`
4. Copy `REDIS_PUBLIC_URL` and `DATABASE_PUBLIC_URL` from `railway variables`

### Vercel (App)
1. Push to GitHub
2. Import in Vercel, add env vars: `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`
3. Deploy — Prisma generates on build via `vercel.json`

### Seed production data
```bash
curl -X POST https://your-app.vercel.app/api/seed
curl -X POST https://your-app.vercel.app/api/m365/seed
curl -X POST https://your-app.vercel.app/api/agents/seed
```

## Data Model

### Infrastructure DSC
- **Node** — Managed machine (hostname, platform, status, tags)
- **Configuration** — DSC document with resource instances
- **ResourceInstance** — Individual DSC resource (type, properties, desired/actual state)
- **DriftEvent** — Detected configuration drift with severity

### Microsoft 365 DSC
- **M365Tenant** — Tenant identity and export metadata
- **M365Snapshot** — Point-in-time export with workload breakdown
- **M365Resource** — Individual M365DSC resource (workload, type, compliance status, differing properties)

### Agent 365 Registry
- **Agent365** — Copilot agent package (type, hosts, deployment status, risks, sensitivity, ownership)

## Color System

| Color | Usage |
|-------|-------|
| 🔵 Blue `#3182CE` | Primary actions, nodes, navigation |
| 🟢 Green `#38A169` | Compliant status, success states |
| 🟡 Yellow `#D69E2E` | Configurations, warnings, drift |
| 🔴 Red `#E53E3E` | Errors, critical severity, resources |
| 🟣 Purple | Agents, custom components |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Infrastructure KPIs |
| `/api/nodes` | GET/POST | List/create nodes |
| `/api/nodes/[id]` | GET/PATCH/DELETE | Node CRUD |
| `/api/configurations` | GET/POST | List/create configs |
| `/api/configurations/[id]` | GET/PATCH/DELETE | Config CRUD |
| `/api/resources` | GET | List resource instances |
| `/api/drift` | GET/PATCH | List/resolve drift events |
| `/api/m365/dashboard` | GET | M365 workload compliance |
| `/api/m365/resources` | GET | M365 resource instances |
| `/api/m365/import` | POST | Import M365DSC JSON report |
| `/api/agents/dashboard` | GET | Agent registry overview |
| `/api/agents` | GET | List agents with filters |
| `/api/seed` | POST | Seed infrastructure demo data |
| `/api/m365/seed` | POST | Seed M365 demo data |
| `/api/agents/seed` | POST | Seed Agent 365 demo data |
