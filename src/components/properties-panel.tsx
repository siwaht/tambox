"use client";

import { useEditorStore } from "@/store/editor-store";

const TYPE_COLORS: Record<string, string> = {
  container: "var(--accent)", card: "var(--accent)", "flex-row": "var(--accent)", grid: "var(--accent)",
  heading: "var(--accent-2)", text: "var(--accent-2)", image: "var(--accent-2)", link: "var(--accent-2)",
  button: "#22d3a0", input: "#22d3a0",
  divider: "#fbbf24", spacer: "#fbbf24", badge: "#fbbf24", avatar: "#fbbf24",
};

export default function PropertiesPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const block = useEditorStore((s) => (selectedId ? s.blocks[selectedId] : null));
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8" style={{ color: "var(--text-muted)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <p className="text-[12px] text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Select a block to edit its properties
        </p>
        <p className="text-[10px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
          Click any block on the canvas
        </p>
      </div>
    );
  }

  const p = block.props;
  const typeColor = TYPE_COLORS[block.type] || "var(--accent)";

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" = "text", options?: string[]) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-3">
        <span className="sidebar-section-title block mb-1.5">{label}</span>
        {type === "select" && options ? (
          <select value={String(val)} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base text-[12px]">
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2 items-center">
            <input type="color" value={String(val) || "#000000"}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-8 h-8 rounded-lg border cursor-pointer bg-transparent shrink-0"
              style={{ borderColor: "var(--border-color)" }} />
            <input type="text" value={String(val)}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="input-base text-[12px]" placeholder="transparent" />
          </div>
        ) : (
          <input type={type} value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
            className="input-base text-[12px]" />
        )}
      </label>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full">
      {/* Block header */}
      <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl"
        style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: typeColor }} />
          <span className="text-[12px] font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            {block.type}
          </span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
          {block.id.slice(0, 8)}
        </span>
      </div>

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => duplicateBlock(block.id)} className="btn btn-ghost flex-1 text-[11px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Duplicate
        </button>
        <button onClick={() => removeBlock(block.id)} className="btn btn-danger-ghost flex-1 text-[11px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete
        </button>
      </div>

      <div className="separator" />

      {/* Content section */}
      {["heading", "text", "button", "badge", "link"].includes(block.type) && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Text", "text")}
          {block.type === "heading" && field("Level", "level", "select", ["1", "2", "3", "4"])}
          {block.type === "link" && field("URL", "href")}
        </>
      )}
      {block.type === "image" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Source URL", "src")}
          {field("Alt Text", "alt")}
        </>
      )}
      {block.type === "input" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Placeholder", "placeholder")}
        </>
      )}
      {["textarea", "select"].includes(block.type) && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Label", "label")}
          {field("Placeholder", "placeholder")}
          {block.type === "textarea" && field("Rows", "rows", "number")}
          {block.type === "select" && field("Options (one per line)", "options")}
        </>
      )}
      {block.type === "toggle" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Label", "label")}
        </>
      )}
      {block.type === "alert" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Message", "text")}
          {field("Variant", "variant", "select", ["info", "success", "warning", "error"])}
          {field("Icon", "icon")}
        </>
      )}
      {block.type === "progress-bar" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Label", "label")}
          {field("Value (0-100)", "value", "number")}
        </>
      )}
      {block.type === "stat-card" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Label", "label")}
          {field("Value", "value", "number")}
          {field("Subtitle", "text")}
        </>
      )}
      {block.type === "data-table" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Columns (comma-separated)", "columns")}
          {field("Rows (one per line, comma-separated)", "items")}
        </>
      )}
      {block.type === "code-block" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Language", "language")}
          {field("Code", "text")}
        </>
      )}
      {block.type === "data-chart" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Title", "text")}
          {field("Chart Type", "chartType", "select", ["bar", "line", "pie", "area"])}
        </>
      )}
      {block.type === "chat-message" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Message", "text")}
          {field("Role", "role", "select", ["user", "assistant", "system"])}
        </>
      )}
      {block.type === "chat-input" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Placeholder", "placeholder")}
        </>
      )}
      {block.type === "streaming-indicator" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Label", "text")}
        </>
      )}
      {block.type === "tool-call" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Tool Name", "toolName")}
          {field("Description", "text")}
          {field("Status", "toolStatus", "select", ["pending", "running", "done", "error"])}
        </>
      )}
      {block.type === "component-renderer" && (
        <>
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Component Name", "componentName")}
        </>
      )}
      {block.type === "agent-provider" && (
        <>
          <p className="sidebar-section-title mt-3">Config</p>
          {field("API Key Env Var", "apiKey")}
          {field("User Key", "userKey")}
        </>
      )}

      {/* Layout section */}
      {["container", "card", "flex-row", "grid"].includes(block.type) && (
        <>
          <p className="sidebar-section-title mt-3">Layout</p>
          {block.type === "grid" && field("Columns", "cols", "number")}
          {field("Gap", "gap", "number")}
          {field("Padding", "padding")}
        </>
      )}

      <div className="separator" />

      {/* Style section */}
      <p className="sidebar-section-title mt-3">Style</p>
      {field("Border Radius", "borderRadius")}
      {field("Background", "bgColor", "color")}
      {field("Text Color", "textColor", "color")}
      {field("Font Size", "fontSize")}
      {block.type === "spacer" && field("Height", "height")}
      {field("Width", "width")}
      {field("Custom Class", "className")}
    </div>
  );
}
