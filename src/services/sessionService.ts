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

  await prisma.$transaction([
    prisma.componentMetric.createMany({
      data: renderEvents.map((e) => ({
        sessionId: payload.sessionId,
        componentName: e.componentName,
        renderCount: 1, // 초기 렌더링 횟수. 추후 서버 사이드 집계 로직에 따라 변경 가능
        averageRenderTime: e.renderTime,
        maxRenderTime: e.renderTime,
      })),
    }),
    prisma.apiMetric.createMany({
      data: apiEvents
        .filter((e) => e.endpoint && e.method) // 필수 필드 확인
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
