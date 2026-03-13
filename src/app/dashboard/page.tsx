import { auth } from "@/lib/next-auth";
import { redirect } from "next/navigation";
import { getSessionsForUser } from "@/services/sessionService";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sessions | ReactPerf" };

import { RealtimeDashboard } from "./realtime-dashboard";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const sessions = await getSessionsForUser(userId);

  return (
    <RealtimeDashboard>
      <div style={{ padding: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              Performance Sessions
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              Captured monitoring sessions from the Chrome extension
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sessions.map((s: any) => (
              <Link
                key={s.id}
                href={`/dashboard/sessions/${s.id}`}
                style={{
                  display: "block",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "var(--foreground)",
                        marginBottom: "4px",
                      }}
                    >
                      {s.url}
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: "12px" }}>
                      {new Date(s.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Pill
                      label={`${s._count.componentMetrics} components`}
                      color="var(--primary)"
                    />
                    <Pill
                      label={`${s._count.apiMetrics} requests`}
                      color="var(--success)"
                    />
                    <StatusBadge ended={s.endedAt !== null} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RealtimeDashboard>
  );
}

function Pill({
  label,
  color,
}: {
  label: string;
  color: string;
}): React.JSX.Element {
  return (
    <span
      style={{
        padding: "2px 8px",
        background: `${color}18`,
        color,
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "600",
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ ended }: { ended: boolean }): React.JSX.Element {
  return (
    <span
      style={{
        padding: "2px 8px",
        background: ended ? "rgba(107,114,128,0.1)" : "rgba(34,197,94,0.1)",
        color: ended ? "var(--muted)" : "var(--success)",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "600",
      }}
    >
      {ended ? "ended" : "active"}
    </span>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔍</div>
      <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
        No sessions yet
      </h2>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "13px",
          maxWidth: "300px",
          margin: "0 auto",
        }}
      >
        Install the Chrome extension and open a React app to start capturing
        performance data.
      </p>
    </div>
  );
}
