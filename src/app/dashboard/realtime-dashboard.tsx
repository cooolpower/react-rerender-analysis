"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export function RealtimeDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div style={{ position: "relative" }}>
      {isPending && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "32px",
            fontSize: "11px",
            color: "var(--primary)",
            opacity: 0.7,
          }}
        >
          Updating...
        </div>
      )}
      {children}
    </div>
  );
}
