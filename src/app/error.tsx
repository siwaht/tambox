"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#0e0e12",
        color: "#e4e4e7",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: 24,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        !
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "#a1a1aa",
          maxWidth: 360,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        The editor encountered an unexpected error. You can try again or reload
        the page to recover.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid #3f3f46",
            background: "transparent",
            color: "#a1a1aa",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
