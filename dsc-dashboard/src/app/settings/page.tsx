"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Database,
  RefreshCw,
  Trash2,
  ExternalLink,
  Server,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      // Seed infrastructure data
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      // Also seed M365 data
      const m365Res = await fetch("/api/m365/seed", { method: "POST" });
      const m365Data = await m365Res.json();
      // Also seed Agent 365 data
      const agentRes = await fetch("/api/agents/seed", { method: "POST" });
      const agentData = await agentRes.json();
      if (data.success && m365Data.success && agentData.success) {
        toast.success(`Seeded: ${data.summary.nodes} nodes, ${m365Data.summary.resources} M365 resources, ${agentData.summary.total} agents`);
      } else {
        toast.error(data.error || m365Data.error || agentData.error || "Seed failed");
      }
    } catch {
      toast.error("Failed to seed data. Check database connection.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Settings</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Application configuration and data management
        </p>
      </div>

      {/* Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-dsc-blue" />
            Infrastructure
          </CardTitle>
          <CardDescription>Hosting and service configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-black p-1.5">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 76 65" fill="currentColor">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-dsc-text">Vercel</p>
                  <p className="text-xs text-dsc-text-secondary">Next.js Application Hosting</p>
                </div>
              </div>
              <Badge variant="compliant">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-purple-600 p-1.5">
                  <Server className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dsc-text">Railway</p>
                  <p className="text-xs text-dsc-text-secondary">Redis Cache Service</p>
                </div>
              </div>
              <Badge variant="compliant">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-dsc-green p-1.5">
                  <Database className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dsc-text">PostgreSQL</p>
                  <p className="text-xs text-dsc-text-secondary">Primary Database</p>
                </div>
              </div>
              <Badge variant="compliant">Connected</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-dsc-green" />
            Data Management
          </CardTitle>
          <CardDescription>Seed demo data or reset the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-dsc-blue-50 border border-dsc-blue/20">
              <div>
                <p className="text-sm font-medium text-dsc-text">Load Demo Data</p>
                <p className="text-xs text-dsc-text-secondary mt-0.5">
                  Populate the dashboard with 20 realistic nodes, 10 configurations, and drift events
                </p>
              </div>
              <Button onClick={handleSeed} disabled={seeding}>
                <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />
                {seeding ? "Seeding..." : "Seed Data"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-dsc-red-50 border border-dsc-red/20">
              <div>
                <p className="text-sm font-medium text-dsc-text">Reset Database</p>
                <p className="text-xs text-dsc-text-secondary mt-0.5">
                  Clear all data and start fresh. This action cannot be undone.
                </p>
              </div>
              <Button variant="danger" onClick={handleSeed}>
                <Trash2 className="h-4 w-4" /> Reset & Reseed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About DSC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-dsc-text-secondary" />
            About DSC v3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-dsc-text-secondary mb-4">
            Microsoft Desired State Configuration (DSC) v3 is a declarative configuration platform
            that runs on Linux, macOS, and Windows. It defines a standard way of exposing settings
            for applications and services using configuration documents in YAML or JSON.
          </p>
          <div className="flex gap-3">
            <a
              href="https://learn.microsoft.com/en-us/powershell/dsc/overview?view=dsc-3.0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> Documentation
              </Button>
            </a>
            <a
              href="https://github.com/PowerShell/DSC"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> GitHub Repository
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
