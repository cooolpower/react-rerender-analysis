import { auth } from "@/lib/next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings | ReactPerf" };

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const apiKey = (session.user as { apiKey?: string }).apiKey ?? "";
  const plan = (session.user as { plan?: string }).plan ?? "FREE";

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>
        Settings
      </h1>

      {/* API Key */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}
        >
          Extension API Key
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "12px",
            marginBottom: "16px",
          }}
        >
          Use this key in the Chrome extension to link your account.
        </p>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "12px 16px",
            color: "var(--foreground)",
            letterSpacing: "0.02em",
            wordBreak: "break-all",
          }}
        >
          {apiKey}
        </div>
      </div>

      {/* Plan */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <h2
          style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}
        >
          Plan
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "12px",
            marginBottom: "16px",
          }}
        >
          Current plan:{" "}
          <strong style={{ color: "var(--foreground)" }}>{plan}</strong>
        </p>
        {plan === "FREE" && (
          <div
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "6px",
              padding: "16px",
            }}
          >
            <p style={{ fontWeight: "600", marginBottom: "4px" }}>
              Upgrade to Pro — $9/month
            </p>
            <ul
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                paddingLeft: "16px",
                marginBottom: "12px",
              }}
            >
              <li>Unlimited sessions</li>
              <li>Full performance history</li>
              <li>Advanced metrics</li>
            </ul>
            <button
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
