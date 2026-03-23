"use client";

import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "@/store/editor-store";
import { useState, useMemo } from "react";

const ALL_BLOCKS = [
  { type: "container" as BlockType, label: "Container", icon: "⬜", category: "Layout" },
  { type: "card" as BlockType, label: "Card", icon: "🃏", category: "Layout" },
  { type: "flex-row" as BlockType, label: "Flex Row", icon: "↔", category: "Layout" },
  { type: "grid" as BlockType, label: "Grid", icon: "⊞", category: "Layout" },
  { type: "heading" as BlockType, label: "Heading", icon: "H₁", category: "Content" },
  { type: "text" as BlockType, label: "Text", icon: "¶", category: "Content" },
  { type: "image" as BlockType, label: "Image", icon: "🖼", category: "Content" },
  { type: "link" as BlockType, label: "Link", icon: "↗", category: "Content" },
  { type: "button" as BlockType, label: "Button", icon: "⬡", category: "Interactive" },
  { type: "input" as BlockType, label: "Input", icon: "▭", category: "Interactive" },
  { type: "divider" as BlockType, label: "Divider", icon: "—", category: "Decorative" },
  { type: "spacer" as BlockType, label: "Spacer", icon: "↕", category: "Decorative" },
  { type: "badge" as BlockType, label: "Badge", icon: "◉", category: "Decorative" },
  { type: "avatar" as BlockType, label: "Avatar", icon: "◎", category: "Decorative" },
];

const CATEGORIES = ["Layout", "Content", "Interactive", "Decorative"];

const CATEGORY_COLORS: Record<string, string> = {
  Layout: "var(--accent)",
  Content: "var(--accent-2)",
  Interactive: "#22d3a0",
  Decorative: "#fbbf24",
};

function DraggableBlock({ type, label, icon }: { type: BlockType; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-item ${isDragging ? "opacity-20 scale-90" : ""}`}
    >
      <span className="text-[15px] leading-none select-none">{icon}</span>
      <span className="text-[10px] font-medium select-none" style={{ color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

export default function BlockPalette() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_BLOCKS.filter(
      (b) => b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks..." className="input-base text-[12px] py-1.5 pl-8" />
        </div>
      </div>

      <div className="p-2.5 space-y-4 overflow-y-auto flex-1">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="text-[11px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              No blocks match &quot;{search}&quot;
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {filtered.map((b) => <DraggableBlock key={b.type} type={b.type} label={b.label} icon={b.icon} />)}
            </div>
          )
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                <p className="sidebar-section-title mb-0">{cat}</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_BLOCKS.filter((b) => b.category === cat).map((b) => (
                  <DraggableBlock key={b.type} type={b.type} label={b.label} icon={b.icon} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
