import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/demo-data";
import { M365_TENANT, m365ExportData } from "@/lib/m365-demo-data";

export async function POST() {
  try {
    // Clean existing M365 data
    await prisma.m365Resource.deleteMany({});
    await prisma.m365Snapshot.deleteMany({});
    await prisma.m365Tenant.deleteMany({});

    // Ensure demo user exists
    await prisma.user.upsert({
      where: { email: "admin@contoso.com" },
      update: {},
      create: { id: DEMO_USER_ID, name: "Admin User", email: "admin@contoso.com" },
    });

    // Create tenant
    const tenant = await prisma.m365Tenant.create({
      data: {
        tenantId: M365_TENANT.tenantId,
        tenantName: M365_TENANT.tenantName,
        displayName: M365_TENANT.displayName,
        defaultDomain: M365_TENANT.defaultDomain,
        lastExport: new Date(),
        lastDriftCheck: new Date(),
        userId: DEMO_USER_ID,
      },
    });

    // Flatten all resources
    const allResources = m365ExportData.flatMap((group) =>
      group.resources.map((r) => ({
        workload: group.workload,
        resourceType: group.resourceType,
        ...r,
      }))
    );

    const compliantCount = allResources.filter((r) => r.status === "COMPLIANT").length;
    const driftedCount = allResources.filter((r) => r.status !== "COMPLIANT").length;
    const workloads = [...new Set(m365ExportData.map((g) => g.workload))];

    // Create snapshot
    const snapshot = await prisma.m365Snapshot.create({
      data: {
        tenantId: tenant.id,
        label: "Initial Export — Full Tenant Snapshot",
        exportMode: "Default",
        workloads,
        resourceCount: allResources.length,
        compliantCount,
        driftedCount,
        rawDocument: m365ExportData as object[],
      },
    });

    // Create individual resources
    for (const res of allResources) {
      await prisma.m365Resource.create({
        data: {
          tenantId: tenant.id,
          snapshotId: snapshot.id,
          workload: res.workload,
          resourceType: res.resourceType,
          displayName: res.displayName,
          primaryKey: res.primaryKey || null,
          properties: res.properties as object,
          desiredState: ("desiredState" in res ? res.desiredState : res.properties) as object,
          actualState: ("actualState" in res ? res.actualState : res.properties) as object,
          status: res.status,
          differingProperties: "differingProperties" in res ? (res.differingProperties as string[]) : [],
          lastChecked: new Date(Date.now() - Math.floor(Math.random() * 4) * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "M365 DSC demo data seeded",
      summary: {
        tenant: tenant.displayName,
        workloads: workloads.length,
        resources: allResources.length,
        compliant: compliantCount,
        drifted: driftedCount,
      },
    });
  } catch (error) {
    console.error("M365 seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
