"use client";

import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "@/store/editor-store";
import { useState, useMemo, useCallback } from "react";

// Reorganized blocks to match the screenshot's "CORE BLOCKS" style
const CORE_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "chat-thread", label: "Chat", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { type: "component-renderer", label: "Results", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg> },
  { type: "tool-call", label: "Tool Activity", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { type: "toggle", label: "Approvals", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg> },
  { type: "code-block", label: "Logs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { type: "streaming-indicator", label: "Status", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 12h2M12 12h.01"/><circle cx="17" cy="12" r="1" fill="currentColor"/></svg> },
  { type: "message-thread", label: "Async", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
  { type: "data-table", label: "Table", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
  { type: "data-chart", label: "Chart", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { type: "stat-card", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> },
  { type: "card", label: "Cards", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { type: "container", label: "Panel", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
];

const MORE_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "heading", label: "Heading", icon: <span className="text-[15px] font-bold">H₁</span> },
  { type: "text", label: "Text", icon: <span className="text-[15px]">¶</span> },
  { type: "button", label: "Button", icon: <span className="text-[15px]">⬡</span> },
  { type: "input", label: "Input", icon: <span className="text-[15px]">▭</span> },
  { type: "image", label: "Image", icon: <span className="text-[15px]">🖼</span> },
  { type: "link", label: "Link", icon: <span className="text-[15px]">↗</span> },
  { type: "textarea", label: "Textarea", icon: <span className="text-[15px]">▣</span> },
  { type: "select", label: "Select", icon: <span className="text-[15px]">▾</span> },
  { type: "divider", label: "Divider", icon: <span className="text-[15px]">—</span> },
  { type: "spacer", label: "Spacer", icon: <span className="text-[15px]">↕</span> },
  { type: "badge", label: "Badge", icon: <span className="text-[15px]">◉</span> },
  { type: "avatar", label: "Avatar", icon: <span className="text-[15px]">◎</span> },
  { type: "alert", label: "Alert", icon: <span className="text-[15px]">⚠</span> },
  { type: "progress-bar", label: "Progress", icon: <span className="text-[15px]">▰</span> },
  { type: "flex-row", label: "Flex Row", icon: <span className="text-[15px]">↔</span> },
  { type: "grid", label: "Grid", icon: <span className="text-[15px]">⊞</span> },
  { type: "sidebar", label: "Sidebar", icon: <span className="text-[15px]">▐</span> },
  { type: "navbar", label: "Navbar", icon: <span className="text-[15px]">▬</span> },
  { type: "agent-provider", label: "TamboProvider", icon: <span className="text-[15px]">⚡</span> },
  { type: "chat-message", label: "Message", icon: <span className="text-[15px]">◌</span> },
  { type: "chat-input", label: "Chat Input", icon: <span className="text-[15px]">✎</span> },
  { type: "thread-collapsible", label: "Collapsible", icon: <span className="text-[15px]">⊕</span> },
  { type: "alert", label: "Markdown", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15V9l3 3 3-3v6M17 9v6l-2-2"/></svg> },
];

function DraggableBlock({ type, label, icon }: { type: BlockType; label: string; icon: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`block-tile ${isDragging ? "opacity-20 scale-90" : ""}`}
    >
      <div className="block-tile-icon">{icon}</div>
      <span className="text-[9.5px] font-medium select-none" style={{ color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

export default function BlockPalette() {
  const [search, setSearch] = useState("");

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const allBlocks = useMemo(() => [...CORE_BLOCKS, ...MORE_BLOCKS], []);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allBlocks.filter(
      (b) => b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)
    );
  }, [search, allBlocks]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-primary)" }}>Blocks</span>
        <button className="toolbar-icon-btn" style={{ padding: "3px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-2.5 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            defaultValue=""
            onChange={handleSearch}
            placeholder="Search blocks..."
            className="input-base text-[11px] py-1.5 pl-8"
          />
        </div>
        <p className="text-[9px] mt-1.5 px-0.5" style={{ color: "var(--text-muted)" }}>
          Drag a block or click to add to canvas
        </p>
      </div>

      {/* Block grid */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="text-[11px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              No blocks match &quot;{search}&quot;
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((b) => <DraggableBlock key={b.type + b.label} type={b.type} label={b.label} icon={b.icon} />)}
            </div>
          )
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Core Blocks</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {CORE_BLOCKS.map((b) => <DraggableBlock key={b.type + b.label} type={b.type} label={b.label} icon={b.icon} />)}
            </div>

            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent-2)" }} />
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>More Blocks</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE_BLOCKS.map((b) => <DraggableBlock key={b.type + b.label} type={b.type} label={b.label} icon={b.icon} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
