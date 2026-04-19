# AI DSC Dashboard

A full-stack Microsoft 365 governance and infrastructure compliance platform that unifies Desired State Configuration (DSC) monitoring, AI/Copilot governance, Purview data protection, and security posture management into a single real-time dashboard — powered by live Microsoft Graph API integration.

**Live:** [dsc-dashboard-vert.vercel.app](https://dsc-dashboard-vert.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## Summary

AI DSC Dashboard is a production-deployed web application that provides centralized visibility and governance across an organization's Microsoft 365 tenant. It connects to a live Azure AD tenant via OAuth2 + PKCE, pulls configuration state from Microsoft Graph API endpoints, and presents compliance status, drift detection, and security metrics across every major M365 workload.

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
- **Agent Registry** — Agent types, deployment status, governance alerts, risk tracking
- **Copilot Studio** — Agent governance controls, declarative vs custom engine agents
- **Azure AI Foundry** — Secure Score radial, AI-relevant security controls, model deployment cards
- **Copilot in Fabric** — Capability readiness, admin configuration, capacity SKU visualization
- **Copilot for Security** — Security alerts, incidents, Secure Score controls with progress bars
- **Overview** — Aggregated metrics, agent donut chart, connector health grid, service principal status
- All metric cards are clickable with animated drill-down modals showing underlying data

### Microsoft Purview Integration
- Sensitivity label hierarchy synced from Graph API
- Protection scope monitoring with DLP policy action tracking
- Label drift detection with severity-based resolve workflow

### Drift Detection & Explanations
- Per-property drift breakdown with desired vs actual state comparison
- Property-specific explanations sourced from official Microsoft Learn documentation
- Each drift event shows Description, Risk, Recommendation, and direct doc link
- Unified drift view across Infrastructure DSC, M365 DSC, and Purview sources

### Security
- Industry-standard password hashing and session management
- Encrypted OAuth2 token storage at rest
- PKCE-protected OAuth2 flow — no client secrets from user tenants stored
- Redis-backed rate limiting and account lockout
- Multi-tenant data isolation — users only see their own tenant data
- Persistent database-backed audit log tracking all auth events
- CSRF protection, secure cookie configuration, and security response headers
- Input validation on all API request bodies
- Admin approval required for new user accounts

### Admin Controls
- User management with approval queue, promote/demote, session tracking
- Feature flag toggles to control page visibility for all users
- Audit Log tab with filterable, paginated security event trail

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Client Browser"]
        UI["Next.js App Router<br/><i>React 19 · TypeScript · Tailwind CSS</i>"]
        UI --> Dashboard["Dashboard"]
        UI --> M365["M365 DSC"]
        UI --> AI["AI Governance<br/><i>7 Tabs</i>"]
        UI --> Purview["Purview<br/><i>4 Tabs</i>"]
        UI --> Admin["Admin Panel"]
        UI --> Pages["Nodes · Configs · Drift<br/>Resources · Settings · Changelog"]
    end

    subgraph Server["Application Server — Vercel"]
        API["Server-Side API Layer<br/><i>30+ Route Handlers</i>"]
        Auth["Auth Layer<br/><i>Sessions · CSRF<br/>Rate Limiting · Lockout</i>"]
        Tenant["Tenant Resolver<br/><i>Multi-Tenant<br/>Data Isolation</i>"]
        Audit["Audit Logger<br/><i>Append-Only<br/>Event Trail</i>"]
        Sync["Graph Sync Engine<br/><i>OAuth2 + PKCE<br/>Token Management</i>"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL<br/><i>15 Models · Prisma ORM</i>")]
        RD[("Redis<br/><i>Cache · Rate Limits</i>")]
    end

    subgraph Microsoft["Microsoft Cloud"]
        EntraID["Microsoft Entra ID<br/><i>OAuth2 Provider</i>"]
        Graph["Microsoft Graph API<br/><i>v1.0 + Beta</i>"]
    end

    Client -->|"HTTPS"| Server
    API --> Auth
    API --> Tenant
    API --> Audit
    API --> Sync
    Auth --> PG
    Auth --> RD
    Tenant --> PG
    Audit --> PG
    Sync -->|"OAuth2 + PKCE"| EntraID
    Sync -->|"Bearer Token"| Graph
    API --> PG
    API --> RD

    style Client fill:#1a1a2e,stroke:#5A2438,color:#f0e6eb
    style Server fill:#16213e,stroke:#5A2438,color:#f0e6eb
    style Data fill:#0f3460,stroke:#5A2438,color:#f0e6eb
    style Microsoft fill:#1a1a2e,stroke:#0078d4,color:#f0e6eb
```

---

## OAuth2 Connection Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant App as AI DSC Dashboard
    participant Entra as Microsoft Entra ID
    participant Graph as Microsoft Graph API

    User->>App: Click "Connect Microsoft 365"
    App->>App: Generate PKCE verifier + challenge
    App->>App: Generate state token with timestamp
    App->>User: Redirect to Microsoft login

    User->>Entra: Authenticate + consent to permissions
    Entra->>App: Authorization code + state (callback)

    App->>App: Validate state + PKCE verifier
    App->>Entra: Exchange code for tokens (with PKCE)
    Entra->>App: Access token + refresh token

    App->>App: Encrypt refresh token (authenticated encryption)
    App->>App: Store encrypted token in database
    App->>Graph: Fetch organization info
    Graph->>App: Tenant details

    App->>User: Redirect to Settings (connected)

    Note over User,Graph: Subsequent Syncs

    User->>App: Click "Sync Now"
    App->>App: Decrypt stored refresh token
    App->>Entra: Refresh access token
    Entra->>App: New access token
    App->>Graph: Fetch M365 configuration state
    Graph->>App: Workload data (10+ workloads)
    App->>App: Detect drift from desired state
    App->>User: Updated dashboard with compliance status
```

---

## Data Sync Architecture

```mermaid
graph LR
    subgraph GraphAPI["Microsoft Graph API"]
        direction TB
        AAD["Entra ID<br/><i>Conditional Access<br/>Auth Methods<br/>Security Defaults<br/>Directory Roles<br/>Domains</i>"]
        SPO["SharePoint &<br/>OneDrive<br/><i>Tenant Settings<br/>Sites · Drive Quota</i>"]
        EXO["Exchange<br/><i>Mailbox Settings</i>"]
        Teams["Teams<br/><i>App Settings<br/>Team Config<br/>Channels</i>"]
        Intune["Intune<br/><i>Compliance Policies<br/>Device Config<br/>App Protection</i>"]
        Security["Security<br/><i>Secure Score<br/>Alerts · Incidents<br/>Control Profiles</i>"]
        Copilot["AI / Copilot<br/><i>Admin Settings<br/>Graph Connectors<br/>Service Principals<br/>Agent Registry</i>"]
        PurviewAPI["Purview<br/><i>Sensitivity Labels</i>"]
        Platform["Power Platform<br/>& Fabric<br/><i>Environments<br/>Capacities</i>"]
    end

    subgraph SyncEngine["Sync Engine"]
        Fetch["Fetch &<br/>Normalize"]
        Drift["Drift<br/>Detection"]
        Store["Persist to<br/>Database"]
    end

    subgraph DB["PostgreSQL"]
        M365Res["M365 Resources"]
        Agents["Agent Registry"]
        Labels["Purview Labels"]
        DriftEv["Drift Events"]
    end

    AAD --> Fetch
    SPO --> Fetch
    EXO --> Fetch
    Teams --> Fetch
    Intune --> Fetch
    Security --> Fetch
    Copilot --> Fetch
    PurviewAPI --> Fetch
    Platform --> Fetch

    Fetch --> Drift
    Drift --> Store
    Store --> M365Res
    Store --> Agents
    Store --> Labels
    Store --> DriftEv

    style GraphAPI fill:#0078d4,stroke:#005a9e,color:#ffffff
    style SyncEngine fill:#5A2438,stroke:#8B3A5C,color:#f0e6eb
    style DB fill:#336791,stroke:#1b3a57,color:#ffffff
```

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o{ Node : "owns"
    User ||--o{ Configuration : "owns"
    User ||--o{ DriftEvent : "owns"
    User ||--o{ M365Tenant : "connects"

    Node ||--o{ NodeConfiguration : "assigned"
    Configuration ||--o{ NodeConfiguration : "applied to"
    Configuration ||--o{ ResourceInstance : "contains"
    ResourceInstance ||--o{ DriftEvent : "triggers"
    Node ||--o{ DriftEvent : "reports"

    M365Tenant ||--o{ M365Snapshot : "captures"
    M365Tenant ||--o{ M365Resource : "contains"
    M365Tenant ||--o{ Agent365 : "registers"
    M365Tenant ||--o{ PurviewSensitivityLabel : "protects"
    M365Tenant ||--o{ PurviewProtectionScope : "enforces"
    M365Tenant ||--o{ PurviewLabelDrift : "detects"

    M365Snapshot ||--o{ M365Resource : "includes"
    PurviewSensitivityLabel ||--o{ PurviewLabelDrift : "drifts"
    PurviewSensitivityLabel ||--o{ PurviewSensitivityLabel : "sublabels"

    User {
        string id PK
        string email UK
        string name
        string role
        boolean isApproved
        datetime lastLoginAt
    }

    Session {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
    }

    M365Tenant {
        string id PK
        string tenantId UK
        string tenantName
        boolean isConnected
        datetime lastSyncAt
    }

    M365Resource {
        string id PK
        string workload
        string resourceType
        string status
        string[] differingProperties
    }

    Node {
        string id PK
        string hostname
        string platform
        string status
    }

    Configuration {
        string id PK
        string name
        string status
        int version
    }

    DriftEvent {
        string id PK
        string severity
        string[] differingProperties
        boolean resolved
    }

    Agent365 {
        string id PK
        string displayName
        string type
        boolean isBlocked
    }

    PurviewSensitivityLabel {
        string id PK
        string displayName
        int priority
        boolean isEnabled
        boolean hasProtection
    }

    PurviewLabelDrift {
        string id PK
        string driftType
        string severity
        boolean resolved
    }

    AuditLog {
        string id PK
        string action
        string email
        string ipAddress
        boolean success
        datetime createdAt
    }
```

---

## Application Page Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend Pages"]
        direction TB
        Home["/ Dashboard<br/><i>Unified KPIs · Health Ring<br/>Sparkline Trends</i>"]

        subgraph Governance["Governance & Compliance"]
            M365Page["/m365<br/><i>10 Workload Cards<br/>Compliance Tracking</i>"]
            M365Res["/m365/resources<br/><i>Resource Explorer<br/>OneDrive Radials<br/>Secure Score Dials</i>"]
            PurviewPage["/purview<br/><i>Labels · Scopes<br/>Drift · Overview</i>"]
            DriftPage["/drift<br/><i>Unified Drift View<br/>Property Explanations</i>"]
        end

        subgraph AIGov["AI Governance Hub"]
            AIPage["/ai<br/><i>7 Tabs</i>"]
            CopilotM365["Copilot for M365"]
            AgentReg["Agent Registry"]
            CopilotStudio["Copilot Studio"]
            Foundry["Azure AI Foundry"]
            Fabric["Copilot in Fabric"]
            CopilotSec["Copilot for Security"]
            AIOverview["Overview"]
        end

        subgraph Infra["Infrastructure DSC"]
            NodesPage["/nodes<br/><i>Node Management</i>"]
            ConfigPage["/configurations<br/><i>DSC Documents</i>"]
            ResPage["/resources<br/><i>Resource Instances</i>"]
        end

        subgraph Admin["Administration"]
            AdminPage["/admin<br/><i>Users · Flags · Audit Log</i>"]
            SettingsPage["/settings<br/><i>OAuth Connection<br/>Sync Controls</i>"]
        end
    end

    AIPage --> CopilotM365
    AIPage --> AgentReg
    AIPage --> CopilotStudio
    AIPage --> Foundry
    AIPage --> Fabric
    AIPage --> CopilotSec
    AIPage --> AIOverview

    style Frontend fill:#1a1a2e,stroke:#5A2438,color:#f0e6eb
    style Governance fill:#2C1420,stroke:#5A2438,color:#f0e6eb
    style AIGov fill:#2C1420,stroke:#5A2438,color:#f0e6eb
    style Infra fill:#2C1420,stroke:#5A2438,color:#f0e6eb
    style Admin fill:#2C1420,stroke:#5A2438,color:#f0e6eb
```

---

## Security Architecture

```mermaid
graph TB
    subgraph Request["Incoming Request"]
        Browser["Browser Client"]
    end

    subgraph SecurityLayers["Security Layers"]
        direction TB
        Headers["Security Headers<br/><i>Content-Type · Frame · Referrer<br/>Cache Control</i>"]
        RateLimit["Rate Limiter<br/><i>Redis-backed<br/>Per-IP Throttling</i>"]
        Lockout["Account Lockout<br/><i>Progressive Lockout<br/>on Failed Attempts</i>"]
        CSRF["CSRF Validation<br/><i>Double-Submit Cookie<br/>Constant-Time Compare</i>"]
        SessionVal["Session Validation<br/><i>Signed Token Verification<br/>Server-Side Hash Check</i>"]
        TenantIso["Tenant Isolation<br/><i>Query-Level Scoping<br/>Per-User Data Boundaries</i>"]
    end

    subgraph Encryption["Token Security"]
        TokenEnc["Refresh Token Encryption<br/><i>Authenticated Encryption at Rest</i>"]
        PassHash["Password Hashing<br/><i>Adaptive Cost Factor</i>"]
    end

    subgraph AuditTrail["Audit Trail"]
        AuditDB[("Audit Log<br/><i>Append-Only<br/>16 Event Types<br/>IP · User Agent · Timestamp</i>")]
    end

    Browser --> Headers
    Headers --> RateLimit
    RateLimit --> Lockout
    Lockout --> CSRF
    CSRF --> SessionVal
    SessionVal --> TenantIso
    TenantIso --> TokenEnc
    TokenEnc --> PassHash

    Headers -.->|"log"| AuditDB
    RateLimit -.->|"log"| AuditDB
    Lockout -.->|"log"| AuditDB
    SessionVal -.->|"log"| AuditDB

    style Request fill:#1a1a2e,stroke:#5A2438,color:#f0e6eb
    style SecurityLayers fill:#2C1420,stroke:#8B3A5C,color:#f0e6eb
    style Encryption fill:#0f3460,stroke:#5A2438,color:#f0e6eb
    style AuditTrail fill:#336791,stroke:#1b3a57,color:#ffffff
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js (App Router) | Full-stack React framework with server components |
| Language | TypeScript | Type-safe development across frontend and backend |
| Styling | Tailwind CSS | Utility-first CSS with custom dark theme |
| UI Primitives | Radix UI | Accessible dialog, dropdown, tabs, tooltip, select |
| Charts | Recharts | Radial dials, sparklines, compliance visualizations |
| Database | PostgreSQL | Primary relational data store (15 models via Prisma ORM) |
| Cache | Redis | Response caching, rate limiting, session management |
| Auth | Custom | Password hashing, JWT sessions, CSRF, rate limiting, audit log |
| Encryption | Node.js crypto | Encrypted token storage, secure hashing |
| OAuth2 | Microsoft Identity Platform | Authorization Code + PKCE, multi-tenant |
| API Integration | Microsoft Graph | M365 tenant configuration and compliance data |
| Validation | Zod | Runtime schema validation on all inputs |
| Hosting | Vercel | Production deployment with edge network |

---

## Services & Infrastructure

| Service | Role |
|---------|------|
| **Vercel** | Application hosting and edge CDN |
| **PostgreSQL** | Primary relational database |
| **Redis** | Caching and rate limiting |
| **Microsoft Entra ID** | OAuth2 identity provider (multi-tenant) |
| **Microsoft Graph API** | M365 tenant configuration data source |
| **GitHub** | Source control and CI/CD |

---

## Quick Start

```bash
git clone https://github.com/justinericsnyder/M365DSCDash.git
cd M365DSCDash/dsc-dashboard
npm install
cp .env.example .env   # Configure required environment variables
npx prisma generate && npx prisma db push
npm run dev
```

See `.env.example` for required configuration variables.

---

## License

Private repository. All rights reserved.
