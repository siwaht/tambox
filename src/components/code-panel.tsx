"use client";

import { useEditorStore, generateCode, generateStandaloneProject } from "@/store/editor-store";
import { useState, useMemo } from "react";
import { useToast } from "@/components/toast";

// Simple JSX/TSX syntax highlighter — no external deps needed
function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const tokens = tokenizeLine(line);
    return (
      <div key={i} className="flex">
        <span className="inline-block w-8 text-right mr-4 text-[var(--text-muted)] select-none opacity-50 text-[11px]">
          {i + 1}
        </span>
        <span>{tokens}</span>
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
    // Leading whitespace
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
      // Take one char
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

  const code = useMemo(
    () => generateCode({ blocks, rootIds, agentConfig }),
    [blocks, rootIds, agentConfig]
  );

  const highlighted = useMemo(() => highlightCode(code), [code]);

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
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab("component")}
          className={`tab-btn ${activeTab === "component" ? "active" : ""}`}
        >
          Component
        </button>
        <button
          onClick={() => setActiveTab("project")}
          className={`tab-btn ${activeTab === "project" ? "active" : ""}`}
        >
          Full Project
        </button>
      </div>

      {activeTab === "component" ? (
        <>
          <div className="flex items-center gap-2 p-2 border-b border-[var(--border-subtle)]">
            <button onClick={copyCode} className="btn btn-ghost text-[11px] flex-1">
              Copy Code
            </button>
            <button onClick={downloadComponent} className="btn btn-primary text-[11px] flex-1">
              Download .tsx
            </button>
          </div>
          <pre className="flex-1 overflow-auto p-4 code-block text-[var(--text-primary)] bg-[var(--bg-primary)]">
            <code>{highlighted}</code>
          </pre>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              Download a complete Next.js project with your layout, Tailwind CSS, TypeScript, and agent integration. Ready to run with{" "}
              <code className="text-[var(--accent-hover)] bg-[var(--accent-subtle)] px-1 py-0.5 rounded text-[11px]">npm install && npm run dev</code>.
            </p>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-medium">Includes</p>
              {[
                { label: "Next.js 15 + React 19", desc: "App router, TypeScript" },
                { label: "Tailwind CSS 4", desc: "Utility-first styling" },
                { label: "Your Layout", desc: `${Object.keys(blocks).length} blocks exported` },
                { label: `${agentConfig.type} Integration`, desc: agentConfig.model || "No model set" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                  <span className="text-[12px] text-[var(--text-primary)]">{item.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.desc}</span>
                </div>
              ))}
            </div>

            {(agentConfig.externalEndpoint || agentConfig.webhookUrl) && (
              <div className="p-3 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent-hover)] font-medium mb-1">External Connection</p>
                <p className="text-[11px] text-[var(--text-secondary)] font-mono break-all">
                  {agentConfig.externalEndpoint || agentConfig.webhookUrl}
                </p>
              </div>
            )}

            <button onClick={downloadProject} className="btn btn-primary w-full py-2.5 text-[12px]">
              Download Project (.zip)
            </button>
            <p className="text-[10px] text-[var(--text-muted)] text-center">
              Unzip → npm install → npm run dev
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
