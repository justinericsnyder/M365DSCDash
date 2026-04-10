// Realistic enterprise demo data for DSC Dashboard
// Simulates a mid-size org managing ~20 nodes across prod/staging/dev

export const DEMO_USER_ID = "demo-user-001";

export const demoNodes = [
  // Production - Web Tier
  { name: "Web Server 01", hostname: "web-prod-01.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["production", "web", "iis", "us-east"] },
  { name: "Web Server 02", hostname: "web-prod-02.contoso.com", platform: "WINDOWS" as const, status: "DRIFTED" as const, tags: ["production", "web", "iis", "us-east"] },
  { name: "Web Server 03", hostname: "web-prod-03.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["production", "web", "iis", "us-west"] },
  { name: "Nginx Proxy 01", hostname: "proxy-prod-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "proxy", "nginx", "us-east"] },

  // Production - App Tier
  { name: "App Server 01", hostname: "app-prod-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "app", "dotnet", "us-east"] },
  { name: "App Server 02", hostname: "app-prod-02.contoso.com", platform: "LINUX" as const, status: "ERROR" as const, tags: ["production", "app", "dotnet", "us-east"] },
  { name: "App Server 03", hostname: "app-prod-03.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "app", "dotnet", "us-west"] },

  // Production - Data Tier
  { name: "SQL Server Primary", hostname: "sql-prod-01.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["production", "database", "sql-server", "us-east"] },
  { name: "SQL Server Replica", hostname: "sql-prod-02.contoso.com", platform: "WINDOWS" as const, status: "DRIFTED" as const, tags: ["production", "database", "sql-server", "us-west"] },
  { name: "Redis Cache 01", hostname: "redis-prod-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "cache", "redis", "us-east"] },
  { name: "PostgreSQL 01", hostname: "pg-prod-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "database", "postgresql", "us-east"] },

  // Production - Infrastructure
  { name: "Domain Controller 01", hostname: "dc-prod-01.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["production", "infrastructure", "active-directory"] },
  { name: "Domain Controller 02", hostname: "dc-prod-02.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["production", "infrastructure", "active-directory"] },
  { name: "Monitoring Server", hostname: "mon-prod-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["production", "infrastructure", "grafana", "prometheus"] },
  { name: "CI/CD Runner 01", hostname: "ci-runner-01.contoso.com", platform: "LINUX" as const, status: "COMPLIANT" as const, tags: ["infrastructure", "ci-cd", "github-actions"] },

  // Staging
  { name: "Staging Web", hostname: "web-stg-01.contoso.com", platform: "WINDOWS" as const, status: "DRIFTED" as const, tags: ["staging", "web", "iis"] },
  { name: "Staging App", hostname: "app-stg-01.contoso.com", platform: "LINUX" as const, status: "UNKNOWN" as const, tags: ["staging", "app", "dotnet"] },
  { name: "Staging DB", hostname: "sql-stg-01.contoso.com", platform: "WINDOWS" as const, status: "COMPLIANT" as const, tags: ["staging", "database", "sql-server"] },

  // Development
  { name: "Dev Workstation - Alice", hostname: "dev-ws-alice.contoso.com", platform: "MACOS" as const, status: "COMPLIANT" as const, tags: ["development", "workstation"] },
  { name: "Dev Workstation - Bob", hostname: "dev-ws-bob.contoso.com", platform: "WINDOWS" as const, status: "OFFLINE" as const, tags: ["development", "workstation"] },
];

export const demoConfigurations = [
  {
    name: "IIS Web Server Baseline",
    description: "Standard IIS web server configuration with TLS hardening, logging, and application pool settings for production web tier.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      metadata: { "Microsoft.DSC": { version: "3.0.0" } },
      parameters: {
        siteName: { type: "string" as const, defaultValue: "Default Web Site", description: "IIS site name" },
        appPoolName: { type: "string" as const, defaultValue: "DefaultAppPool", description: "Application pool name" },
      },
      resources: [
        { name: "IIS Windows Feature", type: "PSDscResources/WindowsFeature", properties: { Name: "Web-Server", Ensure: "Present" } },
        { name: "ASP.NET 4.8", type: "PSDscResources/WindowsFeature", properties: { Name: "Web-Asp-Net45", Ensure: "Present" } },
        { name: "TLS 1.2 Server Enabled", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server", valueName: "Enabled", valueData: { DWord: 1 } } },
        { name: "TLS 1.0 Server Disabled", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server", valueName: "Enabled", valueData: { DWord: 0 } } },
        { name: "SSL 3.0 Disabled", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 3.0\\Server", valueName: "Enabled", valueData: { DWord: 0 } } },
        { name: "IIS Log Format W3C", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\InetStp\\Logging", valueName: "LogFormat", valueData: { String: "W3C" } } },
        { name: "Custom Error Pages", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\InetStp", valueName: "CustomErrorsEnabled", valueData: { DWord: 1 } } },
        { name: "Request Filtering", type: "PSDscResources/WindowsFeature", properties: { Name: "Web-Filtering", Ensure: "Present" } },
      ],
    },
  },
  {
    name: "Windows Security Baseline",
    description: "CIS-aligned Windows Server security hardening: firewall, audit policies, password policies, and service lockdown.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      metadata: { "Microsoft.DSC": { version: "3.0.0" }, compliance: { framework: "CIS", version: "2.0" } },
      resources: [
        { name: "Windows Firewall - Domain Profile", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\DomainProfile", valueName: "EnableFirewall", valueData: { DWord: 1 } } },
        { name: "Windows Firewall - Public Profile", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\PublicProfile", valueName: "EnableFirewall", valueData: { DWord: 1 } } },
        { name: "Audit Logon Events", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Policies\\Microsoft\\Windows\\Audit", valueName: "AuditLogonEvents", valueData: { DWord: 3 } } },
        { name: "Audit Account Management", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Policies\\Microsoft\\Windows\\Audit", valueName: "AuditAccountManage", valueData: { DWord: 3 } } },
        { name: "Password Min Length", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Policies\\Microsoft\\Windows\\System", valueName: "MinimumPasswordLength", valueData: { DWord: 14 } } },
        { name: "Password Complexity", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Policies\\Microsoft\\Windows\\System", valueName: "PasswordComplexity", valueData: { DWord: 1 } } },
        { name: "Disable Guest Account", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SAM\\SAM\\Domains\\Account\\Users\\000001F5", valueName: "AccountDisabled", valueData: { DWord: 1 } } },
        { name: "Remote Desktop NLA", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp", valueName: "UserAuthentication", valueData: { DWord: 1 } } },
        { name: "SMBv1 Disabled", type: "PSDscResources/WindowsFeature", properties: { Name: "FS-SMB1", Ensure: "Absent" } },
        { name: "Windows Defender Enabled", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Policies\\Microsoft\\Windows Defender", valueName: "DisableAntiSpyware", valueData: { DWord: 0 } } },
      ],
    },
  },
  {
    name: "Linux App Server (dotnet)",
    description: "Configuration for .NET application servers running on Ubuntu: runtime, systemd services, log rotation, and resource limits.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "dotnet Runtime", type: "Microsoft/Process", properties: { name: "dotnet", _exist: true } },
        { name: "App Service Running", type: "Microsoft/Process", properties: { name: "contoso-api", _exist: true } },
        { name: "Nginx Reverse Proxy", type: "Microsoft/Process", properties: { name: "nginx", _exist: true } },
        { name: "Log Rotation Config", type: "Microsoft.DSC.Transitional/RunCommandOnSet", properties: { executable: "/usr/sbin/logrotate", arguments: ["/etc/logrotate.d/contoso-api"] } },
        { name: "Open File Limit", type: "Microsoft.DSC.Transitional/RunCommandOnSet", properties: { executable: "ulimit", arguments: ["-n", "65535"] } },
      ],
    },
  },
  {
    name: "SQL Server Configuration",
    description: "SQL Server instance configuration: memory limits, TempDB files, backup compression, and security settings.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "SQL Server Max Memory", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\MSSQLServer\\MSSQLServer", valueName: "MaxServerMemory", valueData: { DWord: 28672 } } },
        { name: "SQL Server Min Memory", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\MSSQLServer\\MSSQLServer", valueName: "MinServerMemory", valueData: { DWord: 8192 } } },
        { name: "Backup Compression Default", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\MSSQLServer\\MSSQLServer", valueName: "DefaultBackupCompression", valueData: { DWord: 1 } } },
        { name: "SQL Agent Running", type: "Microsoft/Process", properties: { name: "SQLAGENT", _exist: true } },
        { name: "Remote Admin Connections", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\MSSQLServer\\MSSQLServer", valueName: "RemoteDacEnabled", valueData: { DWord: 1 } } },
        { name: "SQL Audit Enabled", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\Software\\Microsoft\\MSSQLServer\\Audit", valueName: "AuditLevel", valueData: { DWord: 3 } } },
      ],
    },
  },
  {
    name: "Active Directory Domain Controller",
    description: "Domain controller configuration: AD DS features, DNS, SYSVOL replication, and security hardening.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "AD DS Feature", type: "PSDscResources/WindowsFeature", properties: { Name: "AD-Domain-Services", Ensure: "Present" } },
        { name: "DNS Server Feature", type: "PSDscResources/WindowsFeature", properties: { Name: "DNS", Ensure: "Present" } },
        { name: "RSAT AD Tools", type: "PSDscResources/WindowsFeature", properties: { Name: "RSAT-AD-Tools", Ensure: "Present" } },
        { name: "NTDS Service Running", type: "Microsoft/Process", properties: { name: "ntds", _exist: true } },
        { name: "LDAP Signing Required", type: "Microsoft.Windows/Registry", properties: { keyPath: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\NTDS\\Parameters", valueName: "LDAPServerIntegrity", valueData: { DWord: 2 } } },
      ],
    },
  },
  {
    name: "Monitoring Stack (Prometheus + Grafana)",
    description: "Monitoring infrastructure: Prometheus, Grafana, node_exporter, and alertmanager services.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "Prometheus Running", type: "Microsoft/Process", properties: { name: "prometheus", _exist: true } },
        { name: "Grafana Running", type: "Microsoft/Process", properties: { name: "grafana-server", _exist: true } },
        { name: "Node Exporter Running", type: "Microsoft/Process", properties: { name: "node_exporter", _exist: true } },
        { name: "Alertmanager Running", type: "Microsoft/Process", properties: { name: "alertmanager", _exist: true } },
      ],
    },
  },
  {
    name: "Developer Workstation (macOS)",
    description: "Standard developer workstation setup: Homebrew packages, shell config, Git settings, and IDE tooling.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "Git Installed", type: "Microsoft/Process", properties: { name: "git", _exist: true } },
        { name: "Node.js Installed", type: "Microsoft/Process", properties: { name: "node", _exist: true } },
        { name: "Docker Running", type: "Microsoft/Process", properties: { name: "docker", _exist: true } },
      ],
    },
  },
  {
    name: "PostgreSQL Server Tuning",
    description: "PostgreSQL performance tuning: shared_buffers, work_mem, WAL settings, and connection limits.",
    status: "DRAFT" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "PostgreSQL Service", type: "Microsoft/Process", properties: { name: "postgres", _exist: true } },
        { name: "PgBouncer Running", type: "Microsoft/Process", properties: { name: "pgbouncer", _exist: true } },
      ],
    },
  },
  {
    name: "CI/CD Runner Configuration",
    description: "GitHub Actions self-hosted runner: Docker, build tools, caching, and cleanup policies.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "Docker Daemon", type: "Microsoft/Process", properties: { name: "dockerd", _exist: true } },
        { name: "GitHub Runner Agent", type: "Microsoft/Process", properties: { name: "Runner.Listener", _exist: true } },
        { name: "Build Cache Cleanup", type: "Microsoft.DSC.Transitional/RunCommandOnSet", properties: { executable: "/usr/local/bin/cleanup-cache.sh", arguments: ["--max-age", "7d"] } },
      ],
    },
  },
  {
    name: "Redis Cache Configuration",
    description: "Redis server configuration: memory policy, persistence, and security settings.",
    status: "ACTIVE" as const,
    document: {
      $schema: "https://aka.ms/dsc/schemas/v3/bundled/config/document.json",
      resources: [
        { name: "Redis Server Running", type: "Microsoft/Process", properties: { name: "redis-server", _exist: true } },
        { name: "Redis Sentinel Running", type: "Microsoft/Process", properties: { name: "redis-sentinel", _exist: true } },
      ],
    },
  },
];

// Which configs get assigned to which nodes (by index)
export const nodeConfigAssignments: { nodeIndex: number; configIndex: number; status: string }[] = [
  // IIS Baseline -> Web servers
  { nodeIndex: 0, configIndex: 0, status: "APPLIED" },
  { nodeIndex: 1, configIndex: 0, status: "DRIFTED" },
  { nodeIndex: 2, configIndex: 0, status: "APPLIED" },
  { nodeIndex: 15, configIndex: 0, status: "DRIFTED" }, // staging web

  // Security Baseline -> All Windows prod
  { nodeIndex: 0, configIndex: 1, status: "APPLIED" },
  { nodeIndex: 1, configIndex: 1, status: "APPLIED" },
  { nodeIndex: 2, configIndex: 1, status: "APPLIED" },
  { nodeIndex: 7, configIndex: 1, status: "APPLIED" },
  { nodeIndex: 8, configIndex: 1, status: "DRIFTED" },
  { nodeIndex: 11, configIndex: 1, status: "APPLIED" },
  { nodeIndex: 12, configIndex: 1, status: "APPLIED" },

  // Linux App Server -> App servers
  { nodeIndex: 4, configIndex: 2, status: "APPLIED" },
  { nodeIndex: 5, configIndex: 2, status: "FAILED" },
  { nodeIndex: 6, configIndex: 2, status: "APPLIED" },

  // SQL Server -> SQL nodes
  { nodeIndex: 7, configIndex: 3, status: "APPLIED" },
  { nodeIndex: 8, configIndex: 3, status: "DRIFTED" },
  { nodeIndex: 17, configIndex: 3, status: "APPLIED" }, // staging db

  // AD DC -> Domain controllers
  { nodeIndex: 11, configIndex: 4, status: "APPLIED" },
  { nodeIndex: 12, configIndex: 4, status: "APPLIED" },

  // Monitoring -> Monitoring server
  { nodeIndex: 13, configIndex: 5, status: "APPLIED" },

  // Dev Workstation -> Dev machines
  { nodeIndex: 18, configIndex: 6, status: "APPLIED" },
  { nodeIndex: 19, configIndex: 6, status: "PENDING" },

  // CI/CD -> Runner
  { nodeIndex: 14, configIndex: 8, status: "APPLIED" },

  // Redis -> Redis node
  { nodeIndex: 9, configIndex: 9, status: "APPLIED" },

  // PostgreSQL -> PG node
  { nodeIndex: 10, configIndex: 7, status: "PENDING" },
];

// Realistic drift events
export const demoDriftEvents = [
  {
    nodeIndex: 1, // Web Server 02
    severity: "HIGH" as const,
    differingProperties: ["valueName", "valueData"],
    desiredState: { keyPath: "HKLM\\SYSTEM\\...\\TLS 1.0\\Server", valueName: "Enabled", valueData: { DWord: 0 } },
    actualState: { keyPath: "HKLM\\SYSTEM\\...\\TLS 1.0\\Server", valueName: "Enabled", valueData: { DWord: 1 } },
    resolved: false,
    hoursAgo: 2,
  },
  {
    nodeIndex: 1, // Web Server 02
    severity: "MEDIUM" as const,
    differingProperties: ["LogFormat"],
    desiredState: { valueName: "LogFormat", valueData: { String: "W3C" } },
    actualState: { valueName: "LogFormat", valueData: { String: "IIS" } },
    resolved: false,
    hoursAgo: 2,
  },
  {
    nodeIndex: 5, // App Server 02 (ERROR)
    severity: "CRITICAL" as const,
    differingProperties: ["_exist"],
    desiredState: { name: "contoso-api", _exist: true },
    actualState: { name: "contoso-api", _exist: false },
    resolved: false,
    hoursAgo: 1,
  },
  {
    nodeIndex: 5,
    severity: "HIGH" as const,
    differingProperties: ["_exist"],
    desiredState: { name: "nginx", _exist: true },
    actualState: { name: "nginx", _exist: false },
    resolved: false,
    hoursAgo: 1,
  },
  {
    nodeIndex: 8, // SQL Replica
    severity: "MEDIUM" as const,
    differingProperties: ["MaxServerMemory"],
    desiredState: { valueName: "MaxServerMemory", valueData: { DWord: 28672 } },
    actualState: { valueName: "MaxServerMemory", valueData: { DWord: 32768 } },
    resolved: false,
    hoursAgo: 6,
  },
  {
    nodeIndex: 8,
    severity: "LOW" as const,
    differingProperties: ["RemoteDacEnabled"],
    desiredState: { valueName: "RemoteDacEnabled", valueData: { DWord: 1 } },
    actualState: { valueName: "RemoteDacEnabled", valueData: { DWord: 0 } },
    resolved: false,
    hoursAgo: 6,
  },
  {
    nodeIndex: 15, // Staging Web
    severity: "MEDIUM" as const,
    differingProperties: ["Enabled"],
    desiredState: { valueName: "Enabled", valueData: { DWord: 1 } },
    actualState: { valueName: "Enabled", valueData: { DWord: 0 } },
    resolved: false,
    hoursAgo: 12,
  },
  // Some resolved historical events
  {
    nodeIndex: 0, // Web Server 01 - resolved
    severity: "HIGH" as const,
    differingProperties: ["EnableFirewall"],
    desiredState: { valueName: "EnableFirewall", valueData: { DWord: 1 } },
    actualState: { valueName: "EnableFirewall", valueData: { DWord: 0 } },
    resolved: true,
    hoursAgo: 48,
  },
  {
    nodeIndex: 4, // App Server 01 - resolved
    severity: "MEDIUM" as const,
    differingProperties: ["_exist"],
    desiredState: { name: "contoso-api", _exist: true },
    actualState: { name: "contoso-api", _exist: false },
    resolved: true,
    hoursAgo: 72,
  },
  {
    nodeIndex: 7, // SQL Primary - resolved
    severity: "LOW" as const,
    differingProperties: ["AuditLevel"],
    desiredState: { valueName: "AuditLevel", valueData: { DWord: 3 } },
    actualState: { valueName: "AuditLevel", valueData: { DWord: 1 } },
    resolved: true,
    hoursAgo: 120,
  },
  {
    nodeIndex: 13, // Monitoring - resolved
    severity: "MEDIUM" as const,
    differingProperties: ["_exist"],
    desiredState: { name: "alertmanager", _exist: true },
    actualState: { name: "alertmanager", _exist: false },
    resolved: true,
    hoursAgo: 168,
  },
];
