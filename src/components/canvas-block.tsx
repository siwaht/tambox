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
      return <div className={`${sizes[p.level || 2]} font-bold`} style={customStyle}>{p.text}</div>;
    }
    case "text":
      return <p className="text-sm text-[var(--text-primary)] leading-relaxed" style={customStyle}>{p.text}</p>;
    case "button":
      return (
        <button
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-sm font-medium transition pointer-events-none"
          style={{ borderRadius: p.borderRadius, ...customStyle }}
        >
          {p.text}
        </button>
      );
    case "image":
      return <img src={p.src} alt={p.alt} className="rounded-lg max-w-full h-auto" style={{ borderRadius: p.borderRadius }} />;
    case "input":
      return (
        <input
          placeholder={p.placeholder}
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] pointer-events-none"
          style={{ borderRadius: p.borderRadius }}
          readOnly
        />
      );
    case "divider":
      return <hr className="border-[var(--border-color)]" />;
    case "spacer":
      return <div style={{ height: p.height || "24px" }} />;
    case "badge":
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-[var(--accent-muted)] text-[var(--accent-hover)] rounded-full">
          {p.text}
        </span>
      );
    case "avatar":
      return <img src={p.src} alt={p.alt} className="w-10 h-10 rounded-full ring-2 ring-[var(--border-color)]" />;
    case "link":
      return <span className="text-[var(--accent-hover)] underline underline-offset-2 text-sm cursor-pointer" style={customStyle}>{p.text}</span>;
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
      padding: block.props.padding,
      borderRadius: block.props.borderRadius,
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

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        if (isContainer) setDropRef(node);
      }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(id);
      }}
      className={`relative group cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? "opacity-20 scale-[0.98]" : ""}
        ${isSelected ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-primary)]" : ""}
        ${isOver && isContainer ? "ring-2 ring-dashed ring-[var(--accent)]/50" : ""}
        ${!isContainer ? "block-hover rounded-md" : "rounded-lg"}
      `}
      style={isContainer ? containerStyles[block.type] : undefined}
    >
      {/* Block type label */}
      <div
        className={`absolute -top-5 left-1 text-[9px] uppercase tracking-wider font-medium
          ${isSelected ? "text-[var(--accent)]" : "text-transparent group-hover:text-[var(--text-muted)]"}
          transition-colors pointer-events-none z-10`}
      >
        {block.type}
      </div>

      {/* Action buttons */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-20 animate-in">
          <button
            onClick={(e) => { e.stopPropagation(); duplicateBlock(id); }}
            className="w-5 h-5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded text-[10px] flex items-center justify-center hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
            onPointerDown={(e) => e.stopPropagation()}
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeBlock(id); }}
            className="w-5 h-5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded text-[10px] flex items-center justify-center hover:text-[var(--danger)] hover:border-[var(--danger)] transition"
            onPointerDown={(e) => e.stopPropagation()}
            title="Delete"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      {isContainer ? (
        <div className={`min-h-[48px] ${block.children.length === 0 ? "flex items-center justify-center" : ""}`}>
          {block.children.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)] italic">Drop blocks here</span>
          ) : (
            block.children.map((childId) => (
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
