"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: "#a1a1aa", maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
            The editor encountered an unexpected error. You can try reloading the page to recover.
          </p>
          <button
            onClick={() => window.location.reload()}
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
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
