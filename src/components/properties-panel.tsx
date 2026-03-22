"use client";

import { useEditorStore } from "@/store/editor-store";

export default function PropertiesPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const block = useEditorStore((s) => (selectedId ? s.blocks[selectedId] : null));
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] px-8">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-20 mb-3">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <p className="text-[11px] text-center leading-relaxed">Select a block to edit its properties</p>
      </div>
    );
  }

  const p = block.props;

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" = "text", options?: string[]) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block font-medium">{label}</span>
        {type === "select" && options ? (
          <select
            value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base text-[12px]"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={String(val) || "#000000"}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-7 h-7 rounded-md border border-[var(--border-color)] cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={String(val)}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="input-base text-[12px]"
              placeholder="transparent"
            />
          </div>
        ) : (
          <input
            type={type}
            value={String(val)}
            onChange={(e) =>
              updateBlockProps(block.id, {
                [key]: type === "number" ? Number(e.target.value) : e.target.value,
              })
            }
            className="input-base text-[12px]"
          />
        )}
      </label>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="pill pill-accent font-medium">{block.type}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono opacity-60">{block.id.slice(0, 8)}</span>
      </div>

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => duplicateBlock(block.id)} className="btn btn-ghost flex-1 text-[11px]">Duplicate</button>
        <button onClick={() => removeBlock(block.id)} className="btn btn-danger-ghost flex-1 text-[11px]">Delete</button>
      </div>

      <div className="separator" />

      {/* Content */}
      {["heading", "text", "button", "badge", "link"].includes(block.type) && (
        <div className="mb-1">
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Text", "text")}
          {block.type === "heading" && field("Level", "level", "select", ["1", "2", "3", "4"])}
          {block.type === "link" && field("URL", "href")}
        </div>
      )}
      {block.type === "image" && (
        <div className="mb-1">
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Source URL", "src")}
          {field("Alt Text", "alt")}
        </div>
      )}
      {block.type === "input" && (
        <div className="mb-1">
          <p className="sidebar-section-title mt-3">Content</p>
          {field("Placeholder", "placeholder")}
        </div>
      )}

      {/* Layout */}
      {["container", "card", "flex-row", "grid"].includes(block.type) && (
        <div className="mb-1">
          <p className="sidebar-section-title mt-3">Layout</p>
          {block.type === "grid" && field("Columns", "cols", "number")}
          {field("Gap", "gap", "number")}
          {field("Padding", "padding")}
        </div>
      )}

      <div className="separator" />

      {/* Style */}
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
