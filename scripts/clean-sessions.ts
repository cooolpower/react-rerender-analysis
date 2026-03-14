import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessions = await prisma.session.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      _count: {
        select: {
          pageVisits: true,
          componentMetrics: true,
          apiMetrics: true,
        },
      },
    },
  });

  console.log(`Total sessions: ${sessions.length}`);
  console.log("---");

  // Group by origin
  const originMap = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const list = originMap.get(s.origin) || [];
    list.push(s);
    originMap.set(s.origin, list);
  }

  for (const [origin, list] of originMap) {
    console.log(`\nOrigin: ${origin} (${list.length} sessions)`);
    for (const s of list) {
      console.log(`  - ${s.id} | started: ${s.startedAt.toISOString()} | ended: ${s.endedAt?.toISOString() ?? "active"} | pages: ${s._count.pageVisits} | components: ${s._count.componentMetrics} | api: ${s._count.apiMetrics}`);
    }
  }

  // Find duplicates (same origin, same userId, 0 metrics)
  const duplicates: string[] = [];
  for (const [origin, list] of originMap) {
    if (list.length <= 1) continue;
    // Keep the most recent, delete older ones with 0 data
    const sorted = [...list].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    for (let i = 1; i < sorted.length; i++) {
      const s = sorted[i];
      if (s._count.pageVisits === 0 && s._count.componentMetrics === 0 && s._count.apiMetrics === 0) {
        duplicates.push(s.id);
      }
    }
  }

  console.log(`\n--- Duplicate (empty) sessions to delete: ${duplicates.length} ---`);
  for (const id of duplicates) {
    console.log(`  ${id}`);
  }

  if (duplicates.length > 0) {
    const result = await prisma.session.deleteMany({
      where: { id: { in: duplicates } },
    });
    console.log(`\nDeleted ${result.count} empty duplicate sessions.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
