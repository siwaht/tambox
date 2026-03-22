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
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] px-6">
        <div className="text-3xl mb-3 opacity-20">⚙</div>
        <p className="text-xs text-center leading-relaxed">Select a block on the canvas to edit its properties</p>
      </div>
    );
  }

  const p = block.props;

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" = "text", options?: string[]) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">{label}</span>
        {type === "select" && options ? (
          <select
            value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base"
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={String(val) || "#000000"}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-7 h-7 rounded border border-[var(--border-color)] cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={String(val)}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="input-base"
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
            className="input-base"
          />
        )}
      </label>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] px-2 py-1 bg-[var(--accent-muted)] text-[var(--accent-hover)] rounded font-medium">
          {block.type}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">{block.id.slice(0, 8)}</span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => duplicateBlock(block.id)} className="btn btn-ghost flex-1 text-[11px]">
          Duplicate
        </button>
        <button onClick={() => removeBlock(block.id)} className="btn btn-danger-ghost flex-1 text-[11px]">
          Delete
        </button>
      </div>

      <div className="h-px bg-[var(--border-color)] mb-4" />

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

      <div className="h-px bg-[var(--border-color)] mb-4 mt-1" />

      {/* Style fields */}
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-3 font-medium">Style</p>
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
