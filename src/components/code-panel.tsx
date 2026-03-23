"use client";

import { useEditorStore, generateCode, generateStandaloneProject } from "@/store/editor-store";
import { useState, useMemo } from "react";
import { useToast } from "@/components/toast";

function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const tokens = tokenizeLine(line);
    return (
      <div key={i} className="flex hover:bg-[var(--bg-hover)] -mx-4 px-4 rounded-sm">
        <span className="inline-block w-7 text-right mr-4 text-[var(--text-muted)] select-none opacity-40 text-[11px] shrink-0">
          {i + 1}
        </span>
        <span className="flex-1">{tokens}</span>
      </div>
    );
  });
}

function tokenizeLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const patterns: [RegExp, string][] = [
    [/^(\/\/.*)/, "token-comment"],
    [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, "token-string"],
    [/^(\b(?:import|export|from|const|let|var|function|return|if|else|switch|case|break|default|new|typeof|async|await)\b)/, "token-keyword"],
    [/^(\b(?:true|false|null|undefined)\b)/, "token-keyword"],
    [/^(<\/?[a-zA-Z][a-zA-Z0-9.]*)/, "token-tag"],
    [/^(\b[a-zA-Z_]\w*(?=\s*\())/, "token-func"],
    [/^(\b\d+\.?\d*\b)/, "token-number"],
    [/^([a-zA-Z_][\w-]*(?==))/, "token-attr"],
    [/^([{}()[\]<>\/;:,=.?!&|+\-*])/, "token-punct"],
  ];

  while (remaining.length > 0) {
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      nodes.push(<span key={key++}>{wsMatch[1]}</span>);
      remaining = remaining.slice(wsMatch[1].length);
      continue;
    }
    let matched = false;
    for (const [pattern, className] of patterns) {
      const m = remaining.match(pattern);
      if (m) {
        nodes.push(<span key={key++} className={className}>{m[1]}</span>);
        remaining = remaining.slice(m[1].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      nodes.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
  }
  return nodes;
}

export default function CodePanel() {
  const blocks = useEditorStore((s) => s.blocks);
  const rootIds = useEditorStore((s) => s.rootIds);
  const agentConfig = useEditorStore((s) => s.agentConfig);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"component" | "project">("component");
  const [downloading, setDownloading] = useState(false);

  const code = useMemo(
    () => generateCode({ blocks, rootIds, agentConfig }),
    [blocks, rootIds, agentConfig]
  );

  const highlighted = useMemo(() => highlightCode(code), [code]);
  const lineCount = code.split("\n").length;

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast("Code copied to clipboard", "success");
  };

  const downloadComponent = () => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.tsx";
    a.click();
    URL.revokeObjectURL(url);
    toast("Component downloaded", "success");
  };

  const downloadProject = async () => {
    setDownloading(true);
    try {
      const files = generateStandaloneProject({ blocks, rootIds, agentConfig });
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const [path, content] of Object.entries(files)) {
        zip.file(path, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ui-creator-export.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast("Project downloaded as .zip", "success");
    } catch {
      toast("Failed to generate project", "error");
    } finally {
      setDownloading(false);
    }
  };

  const blockCount = Object.keys(blocks).length;
  const hasExternalConnection = !!(agentConfig.externalEndpoint || agentConfig.webhookUrl);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <button onClick={() => setActiveTab("component")} className={`tab-btn ${activeTab === "component" ? "active" : ""}`}>
          Component
        </button>
        <button onClick={() => setActiveTab("project")} className={`tab-btn ${activeTab === "project" ? "active" : ""}`}>
          Full Project
        </button>
      </div>

      {activeTab === "component" ? (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <span className="text-[10px] font-mono mr-auto" style={{ color: "var(--text-muted)" }}>
              page.tsx · {lineCount} lines
            </span>
            <button onClick={copyCode} className="btn btn-ghost text-[11px]" style={{ padding: "4px 10px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
            <button onClick={downloadComponent} className="btn btn-primary text-[11px]" style={{ padding: "4px 10px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download .tsx
            </button>
          </div>

          {/* Code */}
          <pre className="flex-1 overflow-auto p-4 code-block text-[var(--text-primary)] bg-[var(--bg-primary)]">
            <code>{highlighted}</code>
          </pre>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Description */}
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Download complete project
              </p>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                A ready-to-run Next.js app with your layout, agent config, and all dependencies included.
              </p>
            </div>

            {/* What's included */}
            <div>
              <p className="sidebar-section-title mb-2">What's included</p>
              <div className="space-y-1.5">
                {[
                  { icon: "⚡", label: "Next.js 15 + React 19", desc: "App router, TypeScript" },
                  { icon: "🎨", label: "Tailwind CSS 4", desc: "Utility-first styling" },
                  { icon: "📦", label: `Your layout`, desc: `${blockCount} block${blockCount !== 1 ? "s" : ""}` },
                  { icon: "🤖", label: `${agentConfig.type.charAt(0).toUpperCase() + agentConfig.type.slice(1)} agent`, desc: agentConfig.model || "Configured" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">{item.icon}</span>
                      <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{item.label}</span>
                    </div>
                    <span className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* External connection info */}
            {hasExternalConnection && (
              <div className="p-3 rounded-lg" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span className="text-[10.5px] font-semibold" style={{ color: "var(--accent)" }}>External agent included</span>
                </div>
                <p className="text-[10.5px] font-mono break-all" style={{ color: "var(--text-secondary)" }}>
                  {agentConfig.externalEndpoint || agentConfig.webhookUrl}
                </p>
              </div>
            )}

            {/* Deploy instructions */}
            <div>
              <p className="sidebar-section-title mb-2">After downloading</p>
              <div className="space-y-1.5">
                {[
                  { step: "1", cmd: "unzip ui-creator-export.zip", desc: "Extract the project" },
                  { step: "2", cmd: "npm install", desc: "Install dependencies" },
                  { step: "3", cmd: "npm run dev", desc: "Start development server" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <code className="text-[11px] font-mono block" style={{ color: "var(--accent-hover)" }}>{item.cmd}</code>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={downloadProject}
              disabled={downloading}
              className="btn btn-primary w-full text-[12.5px] font-semibold"
              style={{ padding: "10px", borderRadius: "var(--radius-md)" }}>
              {downloading ? (
                <span className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Generating project...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Project (.zip)
                </span>
              )}
            </button>

            <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              Works with Vercel, Netlify, Railway, or any Node.js host
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
