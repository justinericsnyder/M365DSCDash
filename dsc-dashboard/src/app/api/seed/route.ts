import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DEMO_USER_ID,
  demoNodes,
  demoConfigurations,
  nodeConfigAssignments,
  demoDriftEvents,
} from "@/lib/demo-data";

export async function POST() {
  try {
    // Clean existing demo data
    await prisma.driftEvent.deleteMany({});
    await prisma.nodeConfiguration.deleteMany({});
    await prisma.resourceInstance.deleteMany({});
    await prisma.configuration.deleteMany({});
    await prisma.node.deleteMany({});
    await prisma.user.deleteMany({});

    // Create demo user
    const user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        name: "Admin User",
        email: "admin@contoso.com",
      },
    });

    // Create all nodes
    const nodes = [];
    for (const n of demoNodes) {
      const hoursOffset = Math.floor(Math.random() * 4);
      const node = await prisma.node.create({
        data: {
          name: n.name,
          hostname: n.hostname,
          platform: n.platform,
          status: n.status,
          tags: n.tags,
          userId: user.id,
          lastSeen:
            n.status === "OFFLINE"
              ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
              : n.status === "UNKNOWN"
                ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                : new Date(Date.now() - hoursOffset * 60 * 60 * 1000),
          lastDrift:
            n.status === "DRIFTED"
              ? new Date(Date.now() - Math.floor(Math.random() * 12) * 60 * 60 * 1000)
              : n.status === "ERROR"
                ? new Date(Date.now() - 60 * 60 * 1000)
                : null,
        },
      });
      nodes.push(node);
    }

    // Create all configurations with resource instances
    const configs = [];
    for (const c of demoConfigurations) {
      const config = await prisma.configuration.create({
        data: {
          name: c.name,
          description: c.description,
          document: c.document as object,
          status: c.status,
          userId: user.id,
        },
      });
      configs.push(config);

      // Create resource instances from the document
      for (const res of c.document.resources) {
        // Randomly mark some resources as drifted for realism
        const inDesiredState = Math.random() > 0.2; // 80% compliant
        const lastChecked = new Date(
          Date.now() - Math.floor(Math.random() * 6) * 60 * 60 * 1000
        );

        await prisma.resourceInstance.create({
          data: {
            name: res.name,
            resourceType: res.type,
            properties: res.properties as object,
            desiredState: res.properties as object,
            actualState: inDesiredState
              ? (res.properties as object)
              : { ...(res.properties as object), _drifted: true },
            inDesiredState,
            lastChecked,
            configurationId: config.id,
          },
        });
      }
    }

    // Create node-configuration assignments
    for (const assignment of nodeConfigAssignments) {
      const node = nodes[assignment.nodeIndex];
      const config = configs[assignment.configIndex];
      if (!node || !config) continue;

      const hoursAgo = Math.floor(Math.random() * 48);
      await prisma.nodeConfiguration.create({
        data: {
          nodeId: node.id,
          configurationId: config.id,
          status: assignment.status as "PENDING" | "APPLYING" | "APPLIED" | "FAILED" | "DRIFTED",
          lastApplied:
            assignment.status !== "PENDING"
              ? new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
              : null,
          lastTested: new Date(Date.now() - Math.floor(Math.random() * 4) * 60 * 60 * 1000),
        },
      });
    }

    // Create drift events
    for (const de of demoDriftEvents) {
      const node = nodes[de.nodeIndex];
      if (!node) continue;

      // Try to find a matching resource instance for this node's configs
      const nodeConfigs = nodeConfigAssignments.filter(
        (a) => a.nodeIndex === de.nodeIndex
      );
      let resourceInstanceId: string | undefined;
      if (nodeConfigs.length > 0) {
        const config = configs[nodeConfigs[0].configIndex];
        if (config) {
          const ri = await prisma.resourceInstance.findFirst({
            where: { configurationId: config.id },
          });
          if (ri) resourceInstanceId = ri.id;
        }
      }

      await prisma.driftEvent.create({
        data: {
          nodeId: node.id,
          resourceInstanceId: resourceInstanceId || null,
          userId: user.id,
          severity: de.severity,
          differingProperties: de.differingProperties,
          desiredState: de.desiredState as object,
          actualState: de.actualState as object,
          resolved: de.resolved,
          resolvedAt: de.resolved
            ? new Date(Date.now() - (de.hoursAgo - 1) * 60 * 60 * 1000)
            : null,
          createdAt: new Date(Date.now() - de.hoursAgo * 60 * 60 * 1000),
        },
      });
    }

    const summary = {
      users: 1,
      nodes: nodes.length,
      configurations: configs.length,
      assignments: nodeConfigAssignments.length,
      driftEvents: demoDriftEvents.length,
    };

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      summary,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
