import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UI Creator — Visual Builder + AI Agents",
  description: "Production-ready visual UI builder with LangChain, LangGraph, and DeepAgents integration. Drag-and-drop components, generate code, connect AI agents.",
  keywords: ["ui builder", "drag and drop", "langchain", "langgraph", "deepagents", "react", "nextjs"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
