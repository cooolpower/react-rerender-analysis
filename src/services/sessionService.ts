import { prisma } from "@/lib/prisma";
import type { MetricsBatchPayload, MetricEvent } from "@/types/metrics";

export async function createSession(
  userId: string,
  url: string,
  userAgent: string
): Promise<string> {
  // 사용자의 플랜 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  // FREE 플랜인 경우 데이터 보존 정책 적용 (최근 5개 세션만 유지)
  if (user?.plan === "FREE") {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });

    if (sessions.length >= 5) {
      const sessionsToDelete = sessions.slice(4); // 5번째 이후 세션들
      const idsToDelete = sessionsToDelete.map((s: { id: string }) => s.id);
      
      await prisma.session.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }
  }

  const session = await prisma.session.create({
    data: { userId, url, userAgent },
  });
  return session.id;
}

export async function endSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
}

export async function saveMetricsBatch(
  payload: MetricsBatchPayload
): Promise<void> {
  const renderEvents = payload.events.filter(
    (e): e is Extract<MetricEvent, { type: "component_render" }> =>
      e.type === "component_render"
  );

  const apiEvents = payload.events.filter(
    (e): e is Extract<MetricEvent, { type: "api_request" }> =>
      e.type === "api_request"
  );

  // Process Render Events: Aggregate by componentName within the session
  const renderAggregates = new Map<string, { count: number; totalTime: number; maxTime: number }>();
  
  for (const e of renderEvents) {
    const existing = renderAggregates.get(e.componentName) || { count: 0, totalTime: 0, maxTime: 0 };
    renderAggregates.set(e.componentName, {
      count: existing.count + 1,
      totalTime: existing.totalTime + e.renderTime,
      maxTime: Math.max(existing.maxTime, e.renderTime),
    });
  }

  // Update or Create Component Metrics
  const metricPromises = Array.from(renderAggregates.entries()).map(async ([name, stats]) => {
    const existing = await prisma.componentMetric.findFirst({
      where: { sessionId: payload.sessionId, componentName: name },
    });

    if (existing) {
      const newCount = existing.renderCount + stats.count;
      const newTotalTime = (existing.averageRenderTime * existing.renderCount) + stats.totalTime;
      return prisma.componentMetric.update({
        where: { id: existing.id },
        data: {
          renderCount: newCount,
          averageRenderTime: newTotalTime / newCount,
          maxRenderTime: Math.max(existing.maxRenderTime, stats.maxTime),
        },
      });
    } else {
      return prisma.componentMetric.create({
        data: {
          sessionId: payload.sessionId,
          componentName: name,
          renderCount: stats.count,
          averageRenderTime: stats.totalTime / stats.count,
          maxRenderTime: stats.maxTime,
        },
      });
    }
  });

  await Promise.all([
    ...metricPromises,
    prisma.apiMetric.createMany({
      data: apiEvents
        .filter((e) => e.endpoint && e.method)
        .map((e) => ({
          sessionId: payload.sessionId,
          endpoint: String(e.endpoint),
          method: String(e.method),
          statusCode: e.statusCode || 0,
          latencyMs: e.latency || 0,
          responseSize: e.responseSize || 0,
        })),
    }),
  ]);
}

export async function getSessionsForUser(userId: string, limit = 50) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: {
          componentMetrics: true,
          apiMetrics: true,
        },
      },
    },
  });
}

export async function getSessionDetail(sessionId: string, userId: string) {
  return prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      componentMetrics: {
        orderBy: { renderCount: "desc" },
      },
      apiMetrics: {
        orderBy: { latencyMs: "desc" },
      },
    },
  });
}
