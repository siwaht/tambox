"use client";

import { useState, useMemo, useEffect } from "react";
import { useEditorStore, Block, BlockProps } from "@/store/editor-store";
import { useToast } from "@/components/toast";

type Mode = "detailed" | "concise";

interface GeneratePromptModalProps {
  open: boolean;
  onClose: () => void;
}

function describeBlock(block: Block, blocks: Record<string, Block>, depth: number, detailed: boolean): string {
  const indent = "  ".repeat(depth);
  const props = block.props;
  let line = `${indent}- ${block.type}`;

  if (detailed) {
    const attrs: string[] = [];
    if (props.text) attrs.push(`text="${props.text}"`);
    if (props.variant) attrs.push(`variant="${props.variant}"`);
    if (props.placeholder) attrs.push(`placeholder="${props.placeholder}"`);
    if (props.level) attrs.push(`level=${props.level}`);
    if (props.cols) attrs.push(`cols=${props.cols}`);
    if (props.gap) attrs.push(`gap=${props.gap}`);
    if (props.align) attrs.push(`align="${props.align}"`);
    if (props.size) attrs.push(`size="${props.size}"`);
    if (props.icon) attrs.push(`icon="${props.icon}"`);
    if (props.src) attrs.push(`src="${props.src}"`);
    if (props.href) attrs.push(`href="${props.href}"`);
    if (props.chartType) attrs.push(`chartType="${props.chartType}"`);
    if (props.role) attrs.push(`role="${props.role}"`);
    if (props.language) attrs.push(`language="${props.language}"`);
    if (props.streaming) attrs.push(`streaming`);
    if (attrs.length > 0) line += ` (${attrs.join(", ")})`;
  }

  const childLines = block.children
    .map((cid) => blocks[cid] ? describeBlock(blocks[cid], blocks, depth + 1, detailed) : "")
    .filter(Boolean);

  if (childLines.length > 0) {
    return line + "\n" + childLines.join("\n");
  }
  return line;
}

function generatePromptText(
  blocks: Record<string, Block>,
  rootIds: string[],
  mode: Mode,
  includeTheme: boolean,
  includeStyling: boolean,
): string {
  const blockCount = Object.keys(blocks).length;

  if (blockCount === 0) {
    return "No blocks have been added to the workspace yet. Add some blocks in the editor first.";
  }

  let prompt = "";

  prompt += "Build a React + Tailwind CSS frontend component with the following layout:\n\n";

  if (mode === "detailed") {
    prompt += "## Layout Structure\n\n";
  }

  const tree = rootIds
    .map((id) => blocks[id] ? describeBlock(blocks[id], blocks, 0, mode === "detailed") : "")
    .filter(Boolean)
    .join("\n");

  prompt += tree + "\n";

  if (includeTheme) {
    prompt += "\n## Theme\n\n";
    prompt += "Use a dark theme with these colors:\n";
    prompt += "- Background: #080810 (primary), #0c0c16 (secondary), #111120 (tertiary)\n";
    prompt += "- Text: #f0f0f8 (primary), #8080a8 (secondary), #44446a (muted)\n";
    prompt += "- Accent: #7c6af7 (purple), with hover #9d8fff\n";
    prompt += "- Success: #22d3a0, Warning: #fbbf24, Danger: #f87171\n";
    prompt += "- Borders: #1e1e32\n";
    prompt += "- Font: Inter for UI, JetBrains Mono for code\n";
  }

  if (includeStyling) {
    prompt += "\n## Styling Guidelines\n\n";
    prompt += "- Use rounded corners (8-14px radius)\n";
    prompt += "- Subtle borders with 1px solid border color\n";
    prompt += "- Smooth transitions (150-200ms)\n";
    prompt += "- Use gap-based spacing (Tailwind gap utilities)\n";
    prompt += "- Buttons should have hover states with slight glow effects\n";
    prompt += "- Cards should have subtle background elevation\n";
    prompt += "- Use CSS variables for theming where possible\n";
  }

  if (mode === "detailed") {
    prompt += "\n## Requirements\n\n";
    prompt += "- Use TypeScript with React functional components\n";
    prompt += "- Use Tailwind CSS for all styling\n";
    prompt += "- Make the layout responsive\n";
    prompt += "- Export as a single page component\n";
  }

  return prompt;
}

function countAllBlocks(blocks: Record<string, Block>): number {
  return Object.keys(blocks).length;
}

export default function GeneratePromptModal({ open, onClose }: GeneratePromptModalProps) {
  const blocks = useEditorStore((s) => s.blocks);
  const rootIds = useEditorStore((s) => s.rootIds);
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("detailed");
  const [includeTheme, setIncludeTheme] = useState(true);
  const [includeStyling, setIncludeStyling] = useState(true);

  const promptText = useMemo(
    () => generatePromptText(blocks, rootIds, mode, includeTheme, includeStyling),
    [blocks, rootIds, mode, includeTheme, includeStyling],
  );

  const blockCount = countAllBlocks(blocks);
  const charCount = promptText.length;
  const tokenEstimate = Math.round(charCount / 4);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(promptText);
    toast("Prompt copied to clipboard", "success");
  };

  const downloadMd = () => {
    const blob = new Blob([promptText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-prompt.md";
    a.click();
    URL.revokeObjectURL(url);
    toast("Prompt downloaded as .md", "success");
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="overlay-panel w-[520px] max-h-[85vh] flex flex-col animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-[14px]" style={{ color: "var(--accent)" }}>✦</span>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Generate AI Prompt
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Description */}
          <div className="p-3.5 rounded-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              This generates a prompt describing your frontend layout. Copy it and give it to any AI agent
              (ChatGPT, Claude, Copilot, etc.) to recreate the same frontend.
            </p>
          </div>

          {/* Mode toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("detailed")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: mode === "detailed" ? "var(--accent)" : "transparent",
                color: mode === "detailed" ? "white" : "var(--text-secondary)",
                border: mode === "detailed" ? "none" : "1px solid var(--border-color)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" />
              </svg>
              Detailed
            </button>
            <button
              onClick={() => setMode("concise")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: mode === "concise" ? "var(--accent)" : "transparent",
                color: mode === "concise" ? "white" : "var(--text-secondary)",
                border: mode === "concise" ? "none" : "1px solid var(--border-color)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
              </svg>
              Concise
            </button>

            {/* Theme checkbox */}
            <button
              onClick={() => setIncludeTheme(!includeTheme)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: includeTheme ? "var(--accent-muted)" : "transparent",
                color: includeTheme ? "var(--accent)" : "var(--text-secondary)",
                border: `1px solid ${includeTheme ? "var(--accent-muted)" : "var(--border-color)"}`,
              }}
            >
              {includeTheme && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              Theme
            </button>

            {/* Styling checkbox */}
            <button
              onClick={() => setIncludeStyling(!includeStyling)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: includeStyling ? "var(--accent-muted)" : "transparent",
                color: includeStyling ? "var(--accent)" : "var(--text-secondary)",
                border: `1px solid ${includeStyling ? "var(--accent-muted)" : "var(--border-color)"}`,
              }}
            >
              {includeStyling && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              Styling
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>{blockCount} block(s)</span>
            <span>·</span>
            <span>{charCount} chars</span>
            <span>·</span>
            <span>~{tokenEstimate} tokens</span>
          </div>

          {/* Prompt preview */}
          <div
            className="rounded-lg p-4 max-h-[200px] overflow-y-auto"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11.5px",
              lineHeight: "1.7",
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {promptText}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button onClick={copyPrompt} className="btn btn-primary text-[12px]" style={{ padding: "8px 18px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Prompt
            </button>
            <button onClick={downloadMd} className="btn btn-ghost text-[12px]" style={{ padding: "8px 18px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download .md
            </button>
          </div>

          {/* Tip */}
          <div className="p-3 rounded-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Tip:</span>{" "}
              Paste this prompt into ChatGPT, Claude, or any AI coding assistant. It will generate a complete
              React + Tailwind frontend matching your layout. For best results, use the &quot;Detailed&quot; mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
