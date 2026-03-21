"use client";

import { useEditorStore, generateCode } from "@/store/editor-store";
import { useEffect, useRef, useState } from "react";

export default function CodePanel() {
  const blocks = useEditorStore((s) => s.blocks);
  const rootIds = useEditorStore((s) => s.rootIds);
  const agentConfig = useEditorStore((s) => s.agentConfig);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const code = generateCode({ blocks, rootIds, agentConfig });

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Generated Code
        </h3>
        <button
          onClick={copyCode}
          className="text-xs px-3 py-1 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        ref={codeRef}
        className="flex-1 overflow-auto p-4 text-xs leading-relaxed font-mono text-[var(--text-primary)] bg-[var(--bg-primary)]"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
