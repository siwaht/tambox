"use client";

import { useEditorStore, Block, isContainerType } from "@/store/editor-store";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    case "code-block":
      return (
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d0d12", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#13131a", borderBottom: "1px solid var(--border-color)" }}>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{p.language || "typescript"}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>code</span>
          </div>
          <pre className="p-3 text-[11px] font-mono overflow-x-auto leading-relaxed" style={{ color: "#86efac" }}>{p.text}</pre>
        </div>
      );
    case "alert":
      return (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[12px]"
          style={{
            background: p.variant === "error" ? "var(--danger-subtle)" : p.variant === "success" ? "var(--success-subtle)" : p.variant === "warning" ? "var(--warning-subtle)" : "var(--accent-subtle)",
            border: `1px solid ${p.variant === "error" ? "var(--danger)" : p.variant === "success" ? "var(--success)" : p.variant === "warning" ? "var(--warning)" : "var(--accent)"}`,
            color: p.variant === "error" ? "var(--danger)" : p.variant === "success" ? "var(--success)" : p.variant === "warning" ? "var(--warning)" : "var(--accent-hover)",
          }}>
          <span>{p.icon || "ℹ"}</span>
          <span>{p.text}</span>
        </div>
      );
    case "progress-bar":
      return (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{p.label}</span>
            <span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>{p.value}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${p.value || 0}%`, background: "var(--gradient-accent)" }} />
          </div>
        </div>
      );
    case "toggle":
      return (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-5 rounded-full relative transition-colors" style={{ background: p.checked ? "var(--accent)" : "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm" style={{ left: p.checked ? "calc(100% - 18px)" : "2px", background: "white" }} />
          </div>
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{p.label}</span>
        </div>
      );
    case "select":
      return (
        <div>
          {p.label && <p className="text-[11px] mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>{p.label}</p>}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[12px] pointer-events-none"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
            <span>{p.placeholder || "Choose..."}</span>
            <span>▾</span>
          </div>
        </div>
      );
    case "textarea":
      return (
        <textarea placeholder={p.placeholder} rows={p.rows || 4} readOnly
          className="w-full px-3 py-2 text-sm pointer-events-none resize-none"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }} />
      );
    case "stat-card":
      return (
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>{p.label}</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value || "0"}</p>
          {p.text && <p className="text-[11px] mt-1" style={{ color: "var(--success)" }}>{p.text}</p>}
        </div>
      );
    case "data-table":
      return (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
          <div className="grid text-[10px] font-semibold uppercase tracking-wider px-3 py-2"
            style={{ gridTemplateColumns: `repeat(${(p.columns || "Name,Status,Value").split(",").length}, 1fr)`, background: "var(--bg-tertiary)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
            {(p.columns || "Name,Status,Value").split(",").map((col: string, i: number) => <span key={i}>{col.trim()}</span>)}
          </div>
          {(p.items || "Row 1,Active,$100\nRow 2,Pending,$200").split("\n").map((row: string, i: number) => (
            <div key={i} className="grid px-3 py-2 text-[12px]"
              style={{ gridTemplateColumns: `repeat(${(p.columns || "Name,Status,Value").split(",").length}, 1fr)`, color: "var(--text-secondary)", borderBottom: i < (p.items || "").split("\n").length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              {row.split(",").map((cell: string, j: number) => <span key={j}>{cell.trim()}</span>)}
            </div>
          ))}
        </div>
      );
    case "data-chart":
      return (
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{p.text || "Chart"}</p>
            <span className="pill text-[10px]">{p.chartType || "bar"}</span>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {[65, 40, 80, 55, 90, 45, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${h}%`, background: i % 2 === 0 ? "var(--accent)" : "var(--accent-2)", opacity: 0.8 }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <span key={d} className="text-[9px]" style={{ color: "var(--text-muted)" }}>{d}</span>
            ))}
          </div>
        </div>
      );
    case "chat-message":
      return (
        <div className={`flex gap-2.5 ${p.role === "user" ? "flex-row-reverse" : ""}`}>
          {p.role !== "user" && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px]"
              style={{ background: "var(--gradient-accent)", color: "white" }}>AI</div>
          )}
          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${p.role === "user" ? "msg-user" : "msg-assistant"}`}>
            {p.text}
          </div>
        </div>
      );
    case "chat-input":
      return (
        <div className="flex gap-2 items-center p-2 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <input readOnly placeholder={p.placeholder || "Type a message..."} className="flex-1 bg-transparent text-[12px] outline-none pointer-events-none" style={{ color: "var(--text-primary)" }} />
          <button className="w-8 h-8 rounded-lg flex items-center justify-center pointer-events-none" style={{ background: "var(--gradient-accent)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      );
    case "streaming-indicator":
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <div key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${delay}ms` }} />
            ))}
          </div>
          <span style={{ color: "var(--text-muted)" }}>{p.text || "AI is thinking..."}</span>
        </div>
      );
    case "tool-call":
      return (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px]"
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <span className="text-[14px]">⚙</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.toolName || "tool"}</p>
            <p className="truncate" style={{ color: "var(--text-muted)" }}>{p.text}</p>
          </div>
          <span className="pill text-[9px]" style={{
            background: p.toolStatus === "done" ? "var(--success-subtle)" : p.toolStatus === "error" ? "var(--danger-subtle)" : "var(--accent-subtle)",
            color: p.toolStatus === "done" ? "var(--success)" : p.toolStatus === "error" ? "var(--danger)" : "var(--accent)",
          }}>{p.toolStatus || "done"}</span>
        </div>
      );
    case "component-renderer":
      return (
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--accent-subtle)", border: "2px dashed var(--accent-muted)" }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>Tambo Component</p>
          <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{p.componentName || "GenerativeComponent"}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Rendered by AI based on user message</p>
        </div>
      );
    case "agent-provider":
      return (
        <div className="rounded-xl p-3 text-[11px]" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--accent-muted)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: "var(--accent)" }}>⚡</span>
            <span className="font-semibold" style={{ color: "var(--accent)" }}>TamboProvider</span>
          </div>
          <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
            <p>apiKey: <span style={{ color: "var(--success)" }}>{p.apiKey || "NEXT_PUBLIC_TAMBO_API_KEY"}</span></p>
            <p>userKey: <span style={{ color: "var(--accent-2)" }}>&quot;{p.userKey || "user-1"}&quot;</span></p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ── Sortable canvas block (used inside sortable lists) ──
export default function CanvasBlock({ id, depth = 0, inFlexRow = false }: { id: string; depth?: number; inFlexRow?: boolean }) {
  const block = useEditorStore((s) => s.blocks[id]);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);

  const isContainer = block ? isContainerType(block.type) : false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `canvas-${id}`,
    data: { blockId: id, fromPalette: false, type: block?.type },
  });

  // Container drop zone (for dropping INTO containers)
  const { setNodeRef: setContainerDropRef, isOver: isOverContainer } = useDroppable({
    id: `container-${id}`,
    data: { blockId: id, isContainer: true },
    disabled: !isContainer,
  });

  if (!block) return null;

  const isSelected = selectedId === id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const containerStyles: Record<string, React.CSSProperties> = {
    container: {
      padding: block.props.padding,
      borderRadius: block.props.borderRadius,
      backgroundColor: block.props.bgColor && block.props.bgColor !== "transparent" ? block.props.bgColor : undefined,
    },
    card: {
      padding: block.props.padding || "16px",
      borderRadius: block.props.borderRadius || "12px",
      backgroundColor: block.props.bgColor || "var(--bg-tertiary)",
      border: "1px solid var(--border-color)",
    },
    "flex-row": {
      display: "flex",
      flexWrap: "wrap",
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
    "chat-thread": {
      padding: block.props.padding || "16px",
      height: block.props.height || "400px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      overflowY: "auto",
      backgroundColor: block.props.bgColor || "var(--bg-primary)",
      borderRadius: "12px",
      border: "1px solid var(--border-color)",
    },
    "message-thread": {
      padding: block.props.padding || "16px",
      height: block.props.height || "400px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: block.props.bgColor || "transparent",
    },
    "thread-collapsible": {
      borderRadius: "12px",
      border: "1px solid var(--border-color)",
      overflow: "hidden",
      backgroundColor: "var(--bg-secondary)",
    },
    "agent-provider": {
      padding: "12px",
      borderRadius: "12px",
      border: "2px dashed var(--accent-muted)",
      backgroundColor: "var(--accent-subtle)",
    },
    sidebar: {
      width: block.props.width || "240px",
      padding: block.props.padding || "16px",
      backgroundColor: block.props.bgColor || "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minHeight: "300px",
    },
    navbar: {
      padding: block.props.padding || "12px 24px",
      backgroundColor: block.props.bgColor || "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
  };

  const selectedStyle: React.CSSProperties = isSelected ? {
    outline: "2px solid var(--accent)",
    boxShadow: "0 0 0 4px var(--accent-subtle)",
  } : {};

  const containerDropStyle: React.CSSProperties = isOverContainer && isContainer ? {
    outline: "2px dashed var(--accent)",
    backgroundColor: "var(--accent-subtle)",
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...(inFlexRow ? { flex: "1 1 0", minWidth: 0 } : {}) }}
      className="relative group"
    >
      <div
        ref={isContainer ? setContainerDropRef : undefined}
        {...attributes}
        {...listeners}
        onClick={(e) => { e.stopPropagation(); selectBlock(id); }}
        className={`relative cursor-grab active:cursor-grabbing transition-all duration-150 ${isContainer ? "rounded-xl" : "rounded-lg"}`}
        style={{
          ...(isContainer ? containerStyles[block.type] : {}),
          ...selectedStyle,
          ...containerDropStyle,
          ...(!isSelected && !isOverContainer ? { outline: "1px solid transparent" } : {}),
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
              <SortableContext
                items={block.children.map((cid) => `canvas-${cid}`)}
                strategy={verticalListSortingStrategy}
              >
                {block.children.map((childId: string) => (
                  <CanvasBlock key={childId} id={childId} depth={depth + 1} inFlexRow={block.type === "flex-row"} />
                ))}
              </SortableContext>
            )}
          </div>
        ) : (
          <div className="p-2">
            <BlockContent block={block} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drag overlay preview (shown while dragging) ──
export function BlockDragPreview({ type }: { type: string }) {
  return (
    <div
      className="px-3 py-2 rounded-lg text-[12px] font-medium shadow-2xl pointer-events-none select-none flex items-center gap-2"
      style={{
        background: "var(--gradient-accent)",
        color: "white",
        border: "1px solid var(--accent)",
        boxShadow: "0 8px 32px var(--accent-glow)",
        minWidth: 80,
      }}
    >
      <span style={{ opacity: 0.8 }}>⠿</span>
      {type}
    </div>
  );
}
