import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheInvalidate } from "@/lib/redis";
import { DEMO_USER_ID } from "@/lib/demo-data";

// Accepts a Microsoft365DSC JSON report and imports it
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantName, displayName, defaultDomain, resources: rawResources, label } = body;

    if (!tenantName || !rawResources || !Array.isArray(rawResources)) {
      return NextResponse.json(
        { error: "tenantName and resources array are required" },
        { status: 400 }
      );
    }

    // Upsert tenant
    const tenantId = tenantName.replace(/\.onmicrosoft\.com$/, "").toLowerCase();
    const tenant = await prisma.m365Tenant.upsert({
      where: { tenantId },
      update: { lastExport: new Date(), displayName: displayName || tenantName },
      create: {
        tenantId,
        tenantName,
        displayName: displayName || tenantName,
        defaultDomain: defaultDomain || tenantName,
        lastExport: new Date(),
        userId: DEMO_USER_ID,
      },
    });

    // Parse the M365DSC JSON report format
    // Expected: array of { ResourceName, workload, properties... } or grouped format
    const parsedResources: Array<{
      workload: string;
      resourceType: string;
      displayName: string;
      primaryKey: string | null;
      properties: Record<string, unknown>;
    }> = [];

    for (const item of rawResources) {
      // Support both flat and grouped formats
      if (item.resources && Array.isArray(item.resources)) {
        // Grouped format: { workload, resourceType, resources: [...] }
        for (const res of item.resources) {
          parsedResources.push({
            workload: (item.workload || "AAD").toUpperCase(),
            resourceType: item.resourceType || item.ResourceName || "Unknown",
            displayName: res.displayName || res.DisplayName || res.Name || res.Identity || "Unnamed",
            primaryKey: res.primaryKey || res.DisplayName || res.Name || res.Identity || null,
            properties: res.properties || res,
          });
        }
      } else {
        // Flat format: { ResourceName, workload, DisplayName, ... }
        const workload = (item.workload || inferWorkload(item.ResourceName || "")).toUpperCase();
        parsedResources.push({
          workload: workload || "AAD",
          resourceType: item.ResourceName || item.resourceType || "Unknown",
          displayName: item.DisplayName || item.Name || item.Identity || item.displayName || "Unnamed",
          primaryKey: item.DisplayName || item.Name || item.Identity || null,
          properties: item,
        });
      }
    }

    // Create snapshot
    const workloads = [...new Set(parsedResources.map((r) => r.workload))];
    const snapshot = await prisma.m365Snapshot.create({
      data: {
        tenantId: tenant.id,
        label: label || `Import — ${new Date().toISOString().split("T")[0]}`,
        exportMode: "Default",
        workloads: workloads as Array<"AAD" | "EXO" | "SPO" | "TEAMS" | "SC" | "INTUNE" | "DEFENDER" | "OD" | "O365" | "PP" | "PLANNER" | "FABRIC" | "SENTINEL" | "AZURE" | "ADO" | "COMMERCE">,
        resourceCount: parsedResources.length,
        compliantCount: parsedResources.length, // Assume compliant on import
        driftedCount: 0,
        rawDocument: rawResources as object[],
      },
    });

    // Create resources
    for (const res of parsedResources) {
      await prisma.m365Resource.create({
        data: {
          tenantId: tenant.id,
          snapshotId: snapshot.id,
          workload: res.workload as "AAD" | "EXO" | "SPO" | "TEAMS" | "SC" | "INTUNE" | "DEFENDER" | "OD" | "O365" | "PP" | "PLANNER" | "FABRIC" | "SENTINEL" | "AZURE" | "ADO" | "COMMERCE",
          resourceType: res.resourceType,
          displayName: res.displayName,
          primaryKey: res.primaryKey,
          properties: res.properties as object,
          desiredState: res.properties as object,
          actualState: res.properties as object,
          status: "COMPLIANT",
          differingProperties: [],
          lastChecked: new Date(),
        },
      });
    }

    await cacheInvalidate("m365:*");

    return NextResponse.json({
      success: true,
      message: `Imported ${parsedResources.length} resources across ${workloads.length} workloads`,
      summary: {
        tenant: tenant.displayName,
        snapshotId: snapshot.id,
        resources: parsedResources.length,
        workloads,
      },
    });
  } catch (error) {
    console.error("M365 import error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function inferWorkload(resourceType: string): string {
  if (resourceType.startsWith("AAD")) return "AAD";
  if (resourceType.startsWith("EXO")) return "EXO";
  if (resourceType.startsWith("SPO")) return "SPO";
  if (resourceType.startsWith("Teams")) return "TEAMS";
  if (resourceType.startsWith("SC")) return "SC";
  if (resourceType.startsWith("Intune")) return "INTUNE";
  if (resourceType.startsWith("OD")) return "OD";
  if (resourceType.startsWith("O365")) return "O365";
  if (resourceType.startsWith("PP")) return "PP";
  return "AAD";
}
