"use client";

import { useEditorStore, BlockType } from "@/store/editor-store";
import { useState } from "react";

const BLOCK_META: Record<string, { label: string; color: string; category: string }> = {
  container:  { label: "Container", color: "var(--accent)", category: "Layout" },
  card:       { label: "Card", color: "var(--accent)", category: "Layout" },
  "flex-row": { label: "Flex Row", color: "var(--accent)", category: "Layout" },
  grid:       { label: "Grid", color: "var(--accent)", category: "Layout" },
  sidebar:    { label: "Sidebar", color: "var(--accent)", category: "Layout" },
  navbar:     { label: "Navbar", color: "var(--accent)", category: "Layout" },
  heading:    { label: "Heading", color: "var(--accent-2)", category: "Content" },
  text:       { label: "Text", color: "var(--accent-2)", category: "Content" },
  image:      { label: "Image", color: "var(--accent-2)", category: "Content" },
  link:       { label: "Link", color: "var(--accent-2)", category: "Content" },
  "code-block": { label: "Code Block", color: "var(--accent-2)", category: "Content" },
  "data-table": { label: "Data Table", color: "var(--accent-2)", category: "Content" },
  button:     { label: "Button", color: "#22d3a0", category: "Interactive" },
  input:      { label: "Input", color: "#22d3a0", category: "Interactive" },
  textarea:   { label: "Textarea", color: "#22d3a0", category: "Interactive" },
  select:     { label: "Select", color: "#22d3a0", category: "Interactive" },
  toggle:     { label: "Toggle", color: "#22d3a0", category: "Interactive" },
  divider:    { label: "Divider", color: "#fbbf24", category: "Decorative" },
  spacer:     { label: "Spacer", color: "#fbbf24", category: "Decorative" },
  badge:      { label: "Badge", color: "#fbbf24", category: "Decorative" },
  avatar:     { label: "Avatar", color: "#fbbf24", category: "Decorative" },
  alert:      { label: "Alert", color: "#fbbf24", category: "Decorative" },
  "progress-bar": { label: "Progress Bar", color: "#fbbf24", category: "Decorative" },
  "stat-card": { label: "Stat Card", color: "#fbbf24", category: "Decorative" },
  "agent-provider":     { label: "TamboProvider", color: "#e879f9", category: "Tambo AI" },
  "chat-thread":        { label: "Chat Thread", color: "#e879f9", category: "Tambo AI" },
  "chat-message":       { label: "Message", color: "#e879f9", category: "Tambo AI" },
  "chat-input":         { label: "Chat Input", color: "#e879f9", category: "Tambo AI" },
  "message-thread":     { label: "Msg Thread", color: "#e879f9", category: "Tambo AI" },
  "thread-collapsible": { label: "Collapsible", color: "#e879f9", category: "Tambo AI" },
  "component-renderer": { label: "Renderer", color: "#e879f9", category: "Tambo AI" },
  "tool-call":          { label: "Tool Call", color: "#e879f9", category: "Tambo AI" },
  "streaming-indicator":{ label: "Streaming", color: "#e879f9", category: "Tambo AI" },
  "data-chart":         { label: "Data Chart", color: "#e879f9", category: "Tambo AI" },
};

export default function PropertiesPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const block = useEditorStore((s) => (selectedId ? s.blocks[selectedId] : null));
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6" style={{ color: "var(--text-muted)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <p className="text-[12px] text-center" style={{ color: "var(--text-secondary)" }}>
          Select a block to edit its properties
        </p>
      </div>
    );
  }

  const p = block.props;
  const meta = BLOCK_META[block.type];
  const typeColor = meta?.color || "var(--accent)";

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" | "textarea" = "text", options?: string[]) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>{label}</span>
        {type === "select" && options ? (
          <select value={String(val)} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })} className="input-base text-[12px]">
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2 items-center">
            <input type="color" value={String(val) || "#000000"} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-7 h-7 rounded border cursor-pointer bg-transparent shrink-0" style={{ borderColor: "var(--border-color)" }} />
            <input type="text" value={String(val)} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="input-base text-[12px]" placeholder="transparent" />
          </div>
        ) : type === "textarea" ? (
          <textarea value={String(val)} rows={3} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base text-[12px] resize-none" />
        ) : (
          <input type={type === "number" ? "number" : "text"} value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
            className="input-base text-[12px]" />
        )}
      </label>
    );
  }

  // ── Determine which fields to show per block type ──
  function renderFields() {
    if (!block) return null;
    switch (block.type) {
      case "heading":
        return <>{field("Text", "text")}{field("Level", "level", "select", ["1", "2", "3", "4"])}</>;
      case "text":
        return <>{field("Text", "text")}</>;
      case "button":
        return <>{field("Text", "text")}{field("Variant", "variant", "select", ["primary", "ghost", "default"])}</>;
      case "badge":
        return <>{field("Text", "text")}</>;
      case "link":
        return <>{field("Text", "text")}{field("URL", "href")}</>;
      case "image":
        return <>{field("Image URL", "src")}{field("Alt Text", "alt")}</>;
      case "input":
        return <>{field("Placeholder", "placeholder")}</>;
      case "textarea":
        return <>{field("Placeholder", "placeholder")}{field("Rows", "rows", "number")}</>;
      case "select":
        return <>{field("Placeholder", "placeholder")}{field("Options", "options", "textarea")}</>;
      case "toggle":
        return <>{field("Label", "label")}</>;
      case "alert":
        return <>{field("Message", "text")}{field("Type", "variant", "select", ["info", "success", "warning", "error"])}</>;
      case "progress-bar":
        return <>{field("Label", "label")}{field("Value", "value", "number")}</>;
      case "stat-card":
        return <>{field("Label", "label")}{field("Value", "value", "number")}{field("Subtitle", "text")}</>;
      case "data-table":
        return <>{field("Columns", "columns")}{field("Rows", "items", "textarea")}</>;
      case "code-block":
        return <>{field("Language", "language", "select", ["typescript", "javascript", "python", "bash", "json", "css", "html"])}{field("Code", "text", "textarea")}</>;
      case "data-chart":
        return <>{field("Title", "text")}{field("Type", "chartType", "select", ["bar", "line", "pie", "area"])}</>;
      case "container":
        return <>{field("Padding", "padding")}</>;
      case "card":
        return <>{field("Padding", "padding")}</>;
      case "flex-row":
        return <>{field("Gap", "gap", "number")}{field("Padding", "padding")}</>;
      case "grid":
        return <>{field("Columns", "cols", "number")}{field("Gap", "gap", "number")}{field("Padding", "padding")}</>;
      case "sidebar":
        return <>{field("Width", "width")}{field("Padding", "padding")}</>;
      case "navbar":
        return <>{field("App Name", "text")}{field("Padding", "padding")}</>;
      case "spacer":
        return <>{field("Height", "height")}</>;
      case "divider":
        return null;
      case "avatar":
        return <>{field("Image URL", "src")}{field("Alt Text", "alt")}</>;
      // Tambo AI blocks
      case "agent-provider":
        return <>{field("API Key Env Var", "apiKey")}{field("User Key", "userKey")}</>;
      case "chat-thread":
        return <>{field("Height", "height")}</>;
      case "chat-message":
        return <>{field("Message", "text", "textarea")}{field("Role", "role", "select", ["user", "assistant", "system"])}</>;
      case "chat-input":
        return <>{field("Placeholder", "placeholder")}</>;
      case "streaming-indicator":
        return <>{field("Label", "text")}</>;
      case "tool-call":
        return <>{field("Tool Name", "toolName")}{field("Description", "text")}{field("Status", "toolStatus", "select", ["pending", "running", "done", "error"])}</>;
      case "component-renderer":
        return <>{field("Component Name", "componentName")}</>;
      case "message-thread":
        return <>{field("Height", "height")}</>;
      case "thread-collapsible":
        return <>{field("Button Label", "text")}{field("Placeholder", "placeholder")}</>;
      default:
        return null;
    }
  }

  // Blocks that should NOT show the advanced style section
  const noStyleBlocks: BlockType[] = [
    "divider", "spacer", "agent-provider", "chat-thread", "chat-message", "chat-input",
    "message-thread", "thread-collapsible", "component-renderer", "tool-call",
    "streaming-indicator", "data-chart", "stat-card", "data-table", "code-block",
    "alert", "progress-bar", "toggle", "select", "textarea",
  ];
  const hasAdvancedStyle = !noStyleBlocks.includes(block.type as BlockType);

  return (
    <div className="p-3 overflow-y-auto h-full">
      {/* Block header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColor }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {meta?.label || block.type}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: `${typeColor}18`, color: typeColor }}>
          {meta?.category}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => duplicateBlock(block.id)} className="btn btn-ghost flex-1 text-[11px]">
          ⧉ Duplicate
        </button>
        <button onClick={() => removeBlock(block.id)} className="btn btn-danger-ghost flex-1 text-[11px]">
          × Delete
        </button>
      </div>

      <div className="separator" />

      {/* Main fields */}
      <div className="mt-3">
        {renderFields()}
      </div>

      {/* Advanced style — collapsible */}
      {hasAdvancedStyle && (
        <>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-2 mt-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Advanced Style</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showAdvanced && (
            <div className="animate-in">
              {field("Background", "bgColor", "color")}
              {field("Text Color", "textColor", "color")}
              {field("Border Radius", "borderRadius")}
              {field("Font Size", "fontSize")}
              {field("Width", "width")}
              {field("Custom Class", "className")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
