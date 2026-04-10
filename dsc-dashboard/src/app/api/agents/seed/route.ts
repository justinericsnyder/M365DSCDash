import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoAgents } from "@/lib/agents-demo-data";

export async function POST() {
  try {
    await prisma.agent365.deleteMany({});

    const tenant = await prisma.m365Tenant.findFirst();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "No M365 tenant found. Seed M365 data first." },
        { status: 400 }
      );
    }

    let created = 0;
    for (const agent of demoAgents) {
      await prisma.agent365.create({
        data: {
          tenantId: tenant.id,
          packageId: agent.packageId,
          displayName: agent.displayName,
          type: agent.type,
          shortDescription: agent.shortDescription,
          publisher: agent.publisher,
          supportedHosts: agent.supportedHosts,
          elementTypes: agent.elementTypes,
          platform: agent.platform || null,
          version: agent.version,
          availableTo: agent.availableTo,
          deployedTo: agent.deployedTo,
          isPinned: agent.isPinned,
          pinnedScope: agent.pinnedScope || null,
          riskCount: agent.riskCount,
          isBlocked: agent.isBlocked,
          hasEmbeddedFiles: agent.hasEmbeddedFiles || false,
          sensitivityLabel: agent.sensitivityLabel || null,
          ownerDisplayName: agent.ownerDisplayName || null,
          isOwnerless: agent.isOwnerless || false,
          lastModifiedDateTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      });
      created++;
    }

    const byType = demoAgents.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} agents`,
      summary: { total: created, byType },
    });
  } catch (error) {
    console.error("Agent seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
