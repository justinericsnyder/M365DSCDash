# DSC Dashboard

A unified web dashboard for visualizing and managing [PowerShell DSC v3](https://github.com/PowerShell/DSC), [Microsoft365DSC](https://microsoft365dsc.com/) tenant configurations, [Agent 365 Registry](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-registry), and [Microsoft Purview](https://learn.microsoft.com/en-us/graph/api/tenantdatasecurityandgovernance-list-sensitivitylabels) sensitivity labels and protection scopes.

Built with Next.js, PostgreSQL (Prisma), and Redis. Deployed on **Vercel** + **Railway**.

**Live:** [dsc-dashboard-vert.vercel.app](https://dsc-dashboard-vert.vercel.app)

## Features

### Unified Dashboard
- Cross-platform KPIs: infrastructure nodes, M365 resources, Copilot agents, Purview labels
- Workload compliance bars, agent type breakdown, label hierarchy preview
- Drift alerts aggregated across all sources

### Infrastructure DSC (PowerShell DSC v3)
- 20 managed nodes across prod/staging/dev with compliance tracking
- 10 DSC configurations (IIS, CIS Security, SQL Server, AD DC, Monitoring, etc.)
- 48 resource instances with drift detection and desired vs actual state diffs

### Microsoft 365 DSC
- 31 tenant resources across 8 workloads (Entra ID, Exchange, SharePoint, Teams, Intune, Security & Compliance, Defender, OneDrive)
- Workload compliance cards with drill-down resource explorer
- Import flow for `New-M365DSCReportFromConfiguration -Type JSON` output

### Agent 365 Registry
- 16 Copilot agents (Microsoft, External, Custom, Shared)
- Governance: blocked agents, risk counts, ownerless agents, sensitivity labels, pinned status
- Data model matches Graph API `GET /beta/copilot/admin/catalog/packages`

### Microsoft Purview (Sensitivity Labels & Protection Scopes)
- **Sensitivity Labels** — Full 5-tier taxonomy (Public → Highly Confidential) with sublabels, sourced from `GET /security/dataSecurityAndGovernance/sensitivityLabels`
  - 13 labels across 5 parent categories with sublabel hierarchy
  - Protection status: encryption, endpoint DLP, application mode (manual/recommended/automatic)
  - Applicable scopes: email, file, site, teamwork, unifiedGroup, schematizedData
  - Color-coded label visualization matching Purview admin center
- **Protection Scopes** — Computed DLP policy actions per user/location, sourced from `POST /users/{id}/dataSecurityAndGovernance/protectionScopes/compute`
  - 10 scopes: tenant-wide domain blocks, per-user app policies, URL-specific rules
  - Execution modes: evaluateInline (real-time) vs evaluateOffline (async)
  - Policy actions: block, audit, evaluateClassification
  - Location types: policyLocationApplication, policyLocationDomain, policyLocationUrl
- **Label Drift Monitoring** — 7 drift events tracking changes to label configuration over time
  - Drift types: ENCRYPTION_CHANGED, PRIORITY_CHANGED, SCOPE_CHANGED, LABEL_DISABLED, ENDPOINT_PROTECTION_CHANGED, COLOR_CHANGED, PROTECTION_CHANGED
  - Severity levels with resolve workflow
  - Previous vs current value comparison

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Railway (Prisma ORM) |
| Cache | Redis via Railway (ioredis) |
| State | Zustand |
| Hosting | Vercel |

## Architecture

```
Vercel (Next.js — 31 routes)
├── /                       Unified dashboard (all sources)
├── /m365                   M365 DSC workload compliance
├── /m365/resources         M365 resource explorer
├── /m365/import            Import M365DSC JSON reports
├── /purview                Purview labels, scopes, drift (4 tabs)
├── /agents                 Agent 365 Registry (overview + list)
├── /nodes                  Infrastructure nodes
├── /configurations         DSC configuration documents
├── /configurations/[id]    Config detail with resources + nodes
├── /resources              DSC resource instances
├── /drift                  Infrastructure drift events
├── /import                 DSC document import (YAML/JSON)
├── /settings               Data management & seeding
└── /api/*                  18 API endpoints

Railway
├── PostgreSQL              Primary database (10 models)
└── Redis                   API response caching (15-30s TTL)
```

## Quick Start

```bash
cd dsc-dashboard && npm install
cp .env.example .env  # Add DATABASE_URL, REDIS_URL
npx prisma generate && npx prisma db push
npm run dev
```

## Deployment

```bash
# Railway: Redis + Postgres
railway init --name dsc-dashboard-infra
railway add --database redis
railway add --database postgres

# Vercel: push to GitHub, import, add env vars, deploy

# Seed all data
curl -X POST https://your-app.vercel.app/api/seed
curl -X POST https://your-app.vercel.app/api/m365/seed
curl -X POST https://your-app.vercel.app/api/agents/seed
curl -X POST https://your-app.vercel.app/api/purview/seed
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Infrastructure KPIs |
| `/api/nodes` | GET/POST | List/create nodes |
| `/api/nodes/[id]` | GET/PATCH/DELETE | Node CRUD |
| `/api/configurations` | GET/POST | List/create configs |
| `/api/configurations/[id]` | GET/PATCH/DELETE | Config CRUD |
| `/api/resources` | GET | DSC resource instances |
| `/api/drift` | GET/PATCH | Infrastructure drift events |
| `/api/m365/dashboard` | GET | M365 workload compliance |
| `/api/m365/resources` | GET | M365 resource instances |
| `/api/m365/import` | POST | Import M365DSC JSON report |
| `/api/m365/seed` | POST | Seed M365 demo data |
| `/api/agents/dashboard` | GET | Agent registry overview |
| `/api/agents` | GET | List agents with filters |
| `/api/agents/seed` | POST | Seed agent demo data |
| `/api/purview/dashboard` | GET | Labels, scopes, drift stats |
| `/api/purview/drift` | PATCH | Resolve label drift events |
| `/api/purview/seed` | POST | Seed Purview demo data |
| `/api/seed` | POST | Seed infrastructure demo data |
