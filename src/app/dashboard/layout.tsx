import { auth, signOut } from "@/lib/next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | ReactPerf",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session) redirect("/login");

  const userEmail = session.user?.email ?? "";
  const userPlan = (session.user as { plan?: string }).plan ?? "FREE";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "0 20px 20px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>⚡</span>
            <span style={{ fontWeight: "700", fontSize: "16px" }}>
              ReactPerf
            </span>
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 8px",
              background:
                userPlan === "PRO"
                  ? "rgba(99,102,241,0.2)"
                  : "rgba(107,114,128,0.2)",
              color: userPlan === "PRO" ? "var(--primary)" : "var(--muted)",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              fontFamily: "var(--font-mono)",
            }}
          >
            {userPlan}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          <NavItem href="/dashboard" label="Sessions" icon="📋" />
          <NavItem href="/dashboard/settings" label="Settings" icon="⚙️" />
        </nav>

        {/* User */}
        <div
          style={{
            padding: "16px 20px 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userEmail}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="nav-item"
              style={{
                marginTop: "12px",
                width: "100%",
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: "12px",
                fontWeight: "600",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="nav-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "6px",
        fontSize: "13px",
        color: "var(--foreground)",
        marginBottom: "2px",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
