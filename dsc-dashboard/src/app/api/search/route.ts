import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const [nodes, configs, resources, m365Resources, agents, labels] = await Promise.all([
      prisma.node.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { hostname: { contains: q, mode: "insensitive" } }] },
        select: { id: true, name: true, hostname: true, status: true },
        take: 5,
      }),
      prisma.configuration.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
        select: { id: true, name: true, status: true },
        take: 5,
      }),
      prisma.resourceInstance.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { resourceType: { contains: q, mode: "insensitive" } }] },
        select: { id: true, name: true, resourceType: true, inDesiredState: true },
        take: 5,
      }),
      prisma.m365Resource.findMany({
        where: { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { resourceType: { contains: q, mode: "insensitive" } }] },
        select: { id: true, displayName: true, resourceType: true, workload: true, status: true },
        take: 5,
      }),
      prisma.agent365.findMany({
        where: { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { publisher: { contains: q, mode: "insensitive" } }] },
        select: { id: true, displayName: true, type: true, publisher: true },
        take: 5,
      }),
      prisma.purviewSensitivityLabel.findMany({
        where: { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] },
        select: { id: true, displayName: true, color: true, priority: true },
        take: 5,
      }),
    ]);

    const results = [
      ...nodes.map((n) => ({ type: "node" as const, id: n.id, title: n.name, subtitle: n.hostname, href: `/nodes/${n.id}`, status: n.status })),
      ...configs.map((c) => ({ type: "config" as const, id: c.id, title: c.name, subtitle: "Configuration", href: `/configurations/${c.id}`, status: c.status })),
      ...resources.map((r) => ({ type: "resource" as const, id: r.id, title: r.name, subtitle: r.resourceType, href: "/resources", status: r.inDesiredState ? "COMPLIANT" : "DRIFTED" })),
      ...m365Resources.map((r) => ({ type: "m365" as const, id: r.id, title: r.displayName, subtitle: `${r.workload} · ${r.resourceType}`, href: "/m365/resources", status: r.status })),
      ...agents.map((a) => ({ type: "agent" as const, id: a.id, title: a.displayName, subtitle: a.publisher || a.type, href: "/agents", status: null })),
      ...labels.map((l) => ({ type: "label" as const, id: l.id, title: l.displayName, subtitle: `Priority ${l.priority}`, href: "/purview", status: null, color: l.color })),
    ];

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
