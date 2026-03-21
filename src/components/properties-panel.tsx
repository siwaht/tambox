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
      <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
        <p className="mb-2">No block selected</p>
        <p className="text-xs">Click a block on the canvas to edit its properties</p>
      </div>
    );
  }

  const p = block.props;

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" = "text", options?: string[]) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">{label}</span>
        {type === "select" && options ? (
          <select
            value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2">
            <input
              type="color"
              value={String(val) || "#000000"}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-8 h-8 rounded border border-[var(--border-color)] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={String(val)}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="flex-1 px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
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
            className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
          />
        )}
      </label>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Properties
        </h3>
        <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent-hover)] rounded-full">
          {block.type}
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => duplicateBlock(block.id)}
          className="flex-1 text-xs py-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
        >
          Duplicate
        </button>
        <button
          onClick={() => removeBlock(block.id)}
          className="flex-1 text-xs py-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition"
        >
          Delete
        </button>
      </div>

      {/* Content fields */}
      {["heading", "text", "button", "badge", "link"].includes(block.type) && field("Text", "text")}
      {block.type === "heading" && field("Level", "level", "select", ["1", "2", "3", "4"])}
      {block.type === "link" && field("URL", "href")}
      {block.type === "image" && (
        <>
          {field("Source URL", "src")}
          {field("Alt Text", "alt")}
        </>
      )}
      {block.type === "input" && field("Placeholder", "placeholder")}

      {/* Layout fields */}
      {block.type === "grid" && field("Columns", "cols", "number")}
      {["container", "card", "flex-row", "grid"].includes(block.type) && field("Gap", "gap", "number")}
      {["container", "card", "flex-row", "grid"].includes(block.type) && field("Padding", "padding")}

      {/* Style fields */}
      {field("Border Radius", "borderRadius")}
      {field("Background", "bgColor", "color")}
      {field("Text Color", "textColor", "color")}
      {field("Font Size", "fontSize")}
      {block.type === "spacer" && field("Height", "height")}
      {field("Width", "width")}
      {field("Height", "height")}
      {field("Custom Class", "className")}
    </div>
  );
}
