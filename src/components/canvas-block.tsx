"use client";

import { useEditorStore, Block, isContainerType } from "@/store/editor-store";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import React from "react";

function BlockContent({ block }: { block: Block }) {
  const p = block.props;
  const customStyle: React.CSSProperties = {};
  if (p.textColor) customStyle.color = p.textColor;
  if (p.fontSize) customStyle.fontSize = p.fontSize;

  switch (block.type) {
    case "heading": {
      const sizes: Record<number, string> = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl", 4: "text-lg" };
      return <div className={`${sizes[p.level || 2]} font-bold leading-tight`} style={customStyle}>{p.text}</div>;
    }
    case "text":
      return <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", ...customStyle }}>{p.text}</p>;
    case "button":
      return (
        <button className="px-4 py-2 text-white text-sm font-medium transition pointer-events-none shadow-sm"
          style={{ background: "var(--gradient-accent)", borderRadius: p.borderRadius || "8px", ...customStyle }}>
          {p.text}
        </button>
      );
    case "image":
      return <img src={p.src} alt={p.alt} className="max-w-full h-auto" style={{ borderRadius: p.borderRadius || "8px" }} />;
    case "input":
      return (
        <input placeholder={p.placeholder}
          className="w-full px-3 py-2 text-sm pointer-events-none"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: p.borderRadius || "8px",
            color: "var(--text-primary)",
          }}
          readOnly />
      );
    case "divider":
      return <hr style={{ borderColor: "var(--border-color)" }} />;
    case "spacer":
      return (
        <div style={{ height: p.height || "24px" }} className="relative group/spacer">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed opacity-0 group-hover/spacer:opacity-100 transition"
            style={{ borderColor: "var(--accent-glow)" }} />
        </div>
      );
    case "badge":
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full"
          style={{ background: "var(--accent-muted)", color: "var(--accent-hover)" }}>
          {p.text}
        </span>
      );
    case "avatar":
      return <img src={p.src} alt={p.alt} className="w-10 h-10 rounded-full"
        style={{ outline: "2px solid var(--border-color)", outlineOffset: "2px" }} />;
    case "link":
      return <span className="text-sm cursor-pointer underline underline-offset-2"
        style={{ color: "var(--accent-hover)", ...customStyle }}>{p.text}</span>;
    default:
      return null;
  }
}

export default function CanvasBlock({ id, depth = 0 }: { id: string; depth?: number }) {
  const block = useEditorStore((s) => s.blocks[id]);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `canvas-${id}`,
    data: { blockId: id, fromPalette: false },
  });

  const isContainer = block ? isContainerType(block.type) : false;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { blockId: id },
    disabled: !isContainer,
  });

  if (!block) return null;

  const isSelected = selectedId === id;

  const containerStyles: Record<string, React.CSSProperties> = {
    container: {
      padding: block.props.padding,
      borderRadius: block.props.borderRadius,
      backgroundColor: block.props.bgColor && block.props.bgColor !== "transparent" ? block.props.bgColor : undefined,
    },
    card: {
      padding: block.props.padding || "16px",
      borderRadius: block.props.borderRadius || "12px",
      background: block.props.bgColor || "var(--bg-tertiary)",
      border: "1px solid var(--border-color)",
    },
    "flex-row": {
      display: "flex",
      alignItems: "center",
      gap: `${block.props.gap || 12}px`,
      padding: block.props.padding,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: `repeat(${block.props.cols || 2}, 1fr)`,
      gap: `${block.props.gap || 12}px`,
      padding: block.props.padding,
    },
  };

  const selectedStyle: React.CSSProperties = isSelected ? {
    outline: "2px solid var(--accent)",
    boxShadow: "0 0 0 4px var(--accent-subtle)",
  } : {};

  return (
    <div
      ref={(node) => { setDragRef(node); if (isContainer) setDropRef(node); }}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); selectBlock(id); }}
      className={`relative group cursor-grab active:cursor-grabbing transition-all duration-150 ${isDragging ? "opacity-20 scale-[0.98]" : ""} ${isContainer ? "rounded-xl" : "rounded-lg"}`}
      style={{
        ...(isContainer ? containerStyles[block.type] : {}),
        ...selectedStyle,
        ...(isOver && isContainer ? { outline: "2px dashed var(--accent)", background: "var(--accent-subtle)" } : {}),
        ...(!isSelected && !isOver ? { outline: "1px solid transparent" } : {}),
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.outline = "1px solid var(--accent-glow)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.outline = "1px solid transparent";
      }}
    >
      {/* Type label */}
      <div className={`absolute -top-5 left-1.5 text-[9px] uppercase tracking-wider font-semibold pointer-events-none z-10 transition-colors
        ${isSelected ? "" : "text-transparent group-hover:text-[var(--text-muted)]"}`}
        style={{ color: isSelected ? "var(--accent)" : undefined }}>
        {block.type}
      </div>

      {/* Action buttons */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 flex gap-0.5 z-20 animate-in">
          <button onClick={(e) => { e.stopPropagation(); duplicateBlock(id); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[10px] transition-all shadow-sm"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            onPointerDown={(e) => e.stopPropagation()} title="Duplicate">⧉</button>
          <button onClick={(e) => { e.stopPropagation(); removeBlock(id); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[10px] transition-all shadow-sm"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--danger)"; (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            onPointerDown={(e) => e.stopPropagation()} title="Delete">×</button>
        </div>
      )}

      {/* Content */}
      {isContainer ? (
        <div className={`min-h-[52px] ${block.children.length === 0 ? "flex items-center justify-center" : ""}`}>
          {block.children.length === 0 ? (
            <span className="text-[11px] italic select-none" style={{ color: "var(--text-muted)" }}>
              Drop blocks here
            </span>
          ) : (
            block.children.map((childId: string) => (
              <div key={childId} className="my-1">
                <CanvasBlock id={childId} depth={depth + 1} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-2">
          <BlockContent block={block} />
        </div>
      )}
    </div>
  );
}
