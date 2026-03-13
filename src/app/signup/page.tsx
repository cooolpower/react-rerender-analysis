"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as { success: boolean; error?: string };

      if (!json.success) {
        setError(json.error ?? "Sign up failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "24px" }}>⚡</span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--foreground)",
              }}
            >
              ReactPerf
            </span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Create your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: "16px",
                color: "var(--danger)",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--foreground)",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--foreground)",
                marginBottom: "6px",
              }}
            >
              Password
              <span
                style={{
                  color: "var(--muted)",
                  fontWeight: "400",
                  marginLeft: "4px",
                }}
              >
                (min. 8 characters)
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "var(--border)" : "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: "16px",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--primary)" }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
