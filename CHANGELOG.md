<div align="center">

# 📋 Changelog

**AI DSC Dashboard** — Release History

All notable changes to this project are documented here.

</div>

<br/>

---

## 🚀 v4.3.0 — Documentation & Portfolio
<sub>April 19, 2026</sub>

### 📝 Documentation
- Comprehensive README with Mermaid architecture diagrams rendered natively on GitHub
- System architecture, OAuth2 flow, data sync pipeline, database ERD, page map, and security layer diagrams
- Hardened all public documentation to remove sensitive implementation details
- Tech stack table, services overview, and quick start guide

---

## 🔒 v4.2.0 — Persistent Audit Log
<sub>April 13, 2026</sub>

### ✨ Features
- Database-backed audit log tracking all authentication and administrative events
- Admin Panel → Audit Log tab with filterable, paginated event table
- Filter by action type or search by email
- Each entry records action, outcome, timestamp, and request metadata

### 🔐 Security
- Audit logging wired into login, registration, password changes, logout, tenant connections, and sync operations
- Append-only storage — entries cannot be modified or deleted
- Extended session lifetime with sliding window refresh
- Increased account lockout threshold for better usability
- Removed unused authentication endpoints to reduce attack surface

---

## 🔐 v4.1.0 — Password Management & Auth Hardening
<sub>April 12, 2026</sub>

### ✨ Features
- Change Password form in Settings with strength validation
- Settings page gated behind authentication
- Informational page for forgotten passwords directing users to admin

### 🔒 Security
- Removed self-service password reset functionality
- Removed debug and lockout reset endpoints
- All password changes require current password verification

---

## 🎨 v4.0.0 — Custom Branding & Admin Controls
<sub>April 11, 2026</sub>

### ✨ Features
- Custom SVG logo used as favicon and across all branding surfaces (sidebar, login, register)
- Application renamed to "AI DSC Dashboard" across all pages and browser tab
- Admin feature flags — toggle Nodes, Configurations, and Import page visibility for all users
- Animated toggle switches in Admin Panel
- Clickable metric cards across all AI Governance tabs open drill-down modals with underlying data
- Modal shows summary bar, expandable item list with property grids
- Agent Registry integrated into AI Governance as a dedicated tab
- Dashboard enriched with tenant live data section (auth methods, domains, Teams, sites, OAuth grants)

### 🐛 Fixes
- Modal rendering fixed — uses portal to prevent clipping and z-index overlap
- Cleaned up failing Graph API endpoints from sync debug view
- Fixed agent identity and blueprint API paths
- Fixed Teams Apps query removing invalid `$expand` parameter
- Seed script no longer deletes registered user accounts
- Cleared stuck rate limits and lockouts that were blocking all login attempts

---

## 🎭 v3.5.0 — Entra Agent ID & Page Animations
<sub>April 10, 2026</sub>

### ✨ Features
- Microsoft Entra Agent ID integration — agent identities, instances, collections, blueprints, and card manifests
- New KPI row in AI Governance showing Agent Identities, Instances, Collections, Manifests, and Blueprints counts

### 🎨 UX
- Skeleton loading states with layout placeholders on every page
- Gravity-in animations and stagger-children applied consistently across all pages
- Dashboard, M365 DSC, Nodes, Purview, Agents, Drift, Resources, Configurations — all animated
- Removed stray rendering artifact from AI Governance page

---

## 🛡️ v3.4.0 — Azure AI Foundry & Copilot in Fabric
<sub>April 10, 2026</sub>

### ✨ Features
- Azure AI Foundry tab rebuilt with live Secure Score data, animated radial dials, security controls grid, model deployment cards with sparklines, and safety governance checklist
- Copilot in Fabric tab rebuilt with capability readiness cards, admin configuration with status badges, and capacity SKU radial visualizations
- All sections use gravity-in and stagger-children animations

---

## 🔴 v3.3.0 — Live Security Tab
<sub>April 10, 2026</sub>

### ✨ Features
- Copilot for Security tab rebuilt with live data from security endpoints
- Security KPI cards with Secure Score percentage, alerts, incidents, and controls
- Secure Score radial dial with animated fill and enabled services pills
- Security Alerts list with severity color coding
- Security Incidents list with classification labels
- Security Controls grid with per-control progress bars

### 🐛 Fixes
- Dark mode bulk fixes across badges, status dots, buttons, and backgrounds

---

## 🎨 v3.2.0 — Crimson-Mauve Theme & Accessibility
<sub>April 10, 2026</sub>

### 🎨 Theme
- Deep crimson-mauve dark theme with warm burgundy surfaces and rose borders
- Soft mauve-red accent colors throughout
- WCAG AA contrast compliance — primary text 12.4:1, secondary 6.2:1, all accents 4.5:1+
- Themed scrollbars, code editor, and form inputs

### ✨ Animations
- Gravity-in entrance animations with spring bounce physics on card hover
- Fade-scale-in, slide-down, and stagger-children animation system
- Custom CSS animation library used across all pages

---

## 🔌 v3.1.0 — Connector Detail Modal
<sub>April 10, 2026</sub>

### ✨ Features
- Click any Graph connector in AI Governance to open a detailed modal
- Modal shows status banner, schema property count, indexed items, connection details, and activity settings
- Reusable Modal component with backdrop blur, escape key, click-outside dismiss, and body scroll lock
- Collapsible raw properties view

---

## 🤖 v3.0.0 — AI Governance Hub
<sub>April 10, 2026</sub>

### ✨ Features
- New AI Governance page with 7 tabs covering the Microsoft AI ecosystem
- **Overview** — metric cards with sparklines, agent donut chart, connector health grid, governance alerts
- **Copilot for M365** — admin settings, Graph connectors with schema counts, Teams AI apps, OAuth consent grants
- **Copilot Studio** — agent types, governance controls, portal links
- **Azure AI Foundry** — Secure Score radial, model deployment types, safety controls
- **Copilot in Fabric** — capabilities, admin settings, Purview label integration
- **Copilot for Security** — security controls with progress bars, capabilities, admin configs
- Live data sync for Copilot settings, Graph connectors, service principals, Teams AI apps, and OAuth consents
- Aggregated AI metrics API endpoint

---

## 📊 v2.7.0 — Expandable Resource Details
<sub>April 10, 2026</sub>

### ✨ Features
- Every resource on M365 Resources and unified Resources pages is clickable to reveal a rich detail view
- Structured property grid with boolean indicators, string values, and nested object breakdowns
- Array properties shown as colored pills
- Drifted properties highlighted with drift indicator banner
- OneDrive and Secure Score retain specialized radial dial views

---

## 🛡️ v2.6.0 — Secure Score Visualization
<sub>April 10, 2026</sub>

### ✨ Features
- Microsoft Secure Score resources show a radial dial chart with letter grade (A/B/C/D)
- Three metric cards: Current Score, Max Score, Achievement %
- Enabled Services shown as color-coded pills per service
- Comparative scores and guidance callout with link to security portal

---

## 💾 v2.5.0 — OneDrive Storage Metrics
<sub>April 10, 2026</sub>

### ✨ Features
- OneDrive resources show radial dial chart for storage usage with color coding
- Three metric cards: Total GB, Used GB, Remaining GB
- Linear usage bar with labels
- Capacity forecast estimating days/years until storage is full
- Color-coded quota state badge (normal/nearing/critical/exceeded)

---

## ⚙️ v2.4.0 — Sync Status & Endpoint Health
<sub>April 10, 2026</sub>

### ✨ Features
- Settings page shows per-source sync results with item counts and skip reasons
- API Endpoint Status grid with live health indicators
- Refresh button to re-check endpoint health on demand
- Auto-loads when tenant is connected

---

## 🔍 v2.3.0 — Drift Explanations
<sub>April 10, 2026</sub>

### ✨ Features
- Per-property drift breakdown with desired vs actual state comparison
- Property-specific explanations sourced from official Microsoft Learn documentation
- Each drift event shows Description, Risk, Recommendation, and direct doc link
- 30+ settings covered across Conditional Access, SharePoint, Teams, Purview, Intune, and Defender

### 🐛 Fixes
- Drift events now track the actual differing property per resource type instead of generic labels

---

## 🔗 v2.1.0 — Unified Resources & Drift
<sub>April 10, 2026</sub>

### ✨ Features
- Resources page shows unified view across Infrastructure DSC, M365 DSC, and Purview with source filter pills
- Drift page merges infrastructure drift events, M365 drifted resources, and Purview label drift into one timeline
- Source filter pills with counts — click to filter by source
- Drift resolve works across all sources
- All data APIs scoped to authenticated user

---

## ☁️ v2.0.0 — Expanded M365 Workloads
<sub>April 10, 2026</sub>

### ✨ Features
- 5 new workloads added to M365 DSC sync: OneDrive drive quota, SharePoint sites, Teams settings and channels, Power Platform environments, and Fabric capacities
- Per-team member, guest, messaging, and fun settings
- Channel listing for top teams

---

## 🔒 v1.9.0 — Tenant Isolation & Mobile Responsive
<sub>April 10, 2026</sub>

### ✨ Features
- All data APIs scoped to authenticated user's tenant — users only see their own data
- Unauthenticated visitors see demo data only
- Mobile-responsive sidebar with slide-out drawer and hamburger button
- Responsive grids and scaled search bar
- Changelog page with timeline UI and commit links

---

## ☁️ v1.8.0 — M365 DSC Live Sync
<sub>April 10, 2026</sub>

### ✨ Features
- First live M365 DSC data sync pulling real configuration state from Microsoft Graph API
- Entra ID: Conditional Access policies, auth methods, group settings, authorization policy, security defaults, named locations, directory roles, domains, cross-tenant access
- SharePoint: tenant sharing settings, site creation, domain restrictions
- Teams: app settings, resource-specific consent
- Intune: device compliance, configuration policies, app protection policies
- Defender: Secure Score with 30+ control profiles
- Exchange: mailbox settings

### 🐛 Fixes
- Graceful sync with fallback endpoints for different license tiers
- Per-source toast notifications showing success, skipped, or error status

---

## 🔑 v1.5.0 — Microsoft Graph OAuth2 Connection
<sub>April 10, 2026</sub>

### ✨ Features
- Connect your Microsoft 365 tenant via OAuth2 with PKCE — no tenant credentials stored
- Refresh tokens encrypted at rest before database storage
- Access tokens are short-lived and never persisted
- Automatic token rotation when Microsoft issues new refresh tokens
- Settings page with 3-step onboarding guide, connect/reconnect/disconnect, and granted permissions display
- First live data sync — Purview labels, Agent Registry, and organization info

---

## 🔐 v1.3.0 — Authentication System
<sub>April 10, 2026</sub>

### ✨ Features
- Full authentication system with secure password hashing and session management
- Rate limiting and account lockout for abuse prevention
- CSRF protection with secure cookie configuration
- First registered user auto-promoted to admin; subsequent users require approval
- Global search API across all data sources with debounced dropdown results
- Admin panel with pending approval queue, user table, and promote/revoke actions
- Auth-aware header with account dropdown menu
- Login and register pages with pending approval state handling

---

## 📊 v1.1.0 — Health Scores & Sparklines
<sub>April 10, 2026</sub>

### ✨ Features
- Overall Health ring chart aggregating all 4 data sources
- Per-source aggregate percentages: Infrastructure (node compliance), M365 (workload compliance), Agents (deployed/total), Purview (enabled-no-drift/total)
- Custom SVG sparkline component showing 14-day trend for each aggregate

---

## 🎉 v1.0.0 — Initial Release
<sub>April 10, 2026</sub>

### ✨ Features
- Infrastructure DSC: managed nodes across prod/staging/dev with compliance tracking
- DSC configurations (IIS, CIS Security, SQL Server, AD DC, Monitoring, etc.) with resource instances and drift detection
- Microsoft 365 DSC: tenant resources across 8 workloads (Entra ID, Exchange, SharePoint, Teams, Intune, Security & Compliance, Defender, OneDrive)
- Agent 365 Registry: Copilot agents (Microsoft, External, Custom, Shared) with governance tracking
- Microsoft Purview: sensitivity labels with 5-tier taxonomy, protection scopes, and label drift events
- Unified dashboard with KPIs across all sources
- Custom component library: Card, Badge, Button, StatusDot, Sparkline, EmptyState
- Deployed on Vercel with PostgreSQL and Redis

---

<div align="center">
<sub>Built by <a href="https://github.com/justinericsnyder">Justin Snyder</a></sub>
</div>
