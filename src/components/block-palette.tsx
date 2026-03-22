"use client";

import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "@/store/editor-store";
import { useState, useMemo } from "react";

const ALL_BLOCKS = [
  { type: "container" as BlockType, label: "Container", icon: "□", category: "Layout" },
  { type: "card" as BlockType, label: "Card", icon: "▢", category: "Layout" },
  { type: "flex-row" as BlockType, label: "Flex Row", icon: "⇔", category: "Layout" },
  { type: "grid" as BlockType, label: "Grid", icon: "⊞", category: "Layout" },
  { type: "heading" as BlockType, label: "Heading", icon: "H", category: "Content" },
  { type: "text" as BlockType, label: "Text", icon: "T", category: "Content" },
  { type: "image" as BlockType, label: "Image", icon: "◻", category: "Content" },
  { type: "link" as BlockType, label: "Link", icon: "↗", category: "Content" },
  { type: "button" as BlockType, label: "Button", icon: "▸", category: "Interactive" },
  { type: "input" as BlockType, label: "Input", icon: "⌨", category: "Interactive" },
  { type: "divider" as BlockType, label: "Divider", icon: "—", category: "Decorative" },
  { type: "spacer" as BlockType, label: "Spacer", icon: "↕", category: "Decorative" },
  { type: "badge" as BlockType, label: "Badge", icon: "●", category: "Decorative" },
  { type: "avatar" as BlockType, label: "Avatar", icon: "◉", category: "Decorative" },
];

const CATEGORIES = ["Layout", "Content", "Interactive", "Decorative"];

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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-grab active:cursor-grabbing
        border border-[var(--border-color)] bg-[var(--bg-secondary)]
        hover:bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]
        transition-all text-[13px] select-none
        ${isDragging ? "opacity-30 scale-95" : ""}`}
    >
      <span className="text-sm w-4 text-center text-[var(--text-muted)]">{icon}</span>
      <span className="text-[var(--text-primary)]">{label}</span>
    </div>
  );
}

export default function BlockPalette() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return null; // null = show categories
    const q = search.toLowerCase();
    return ALL_BLOCKS.filter(
      (b) => b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-[var(--border-subtle)]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className="input-base text-[12px] py-1.5"
        />
      </div>

      <div className="p-3 space-y-5 overflow-y-auto flex-1">
        {filtered ? (
          // Search results
          filtered.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center mt-4">No blocks match &quot;{search}&quot;</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map((b) => (
                <DraggableBlock key={b.type} type={b.type} label={b.label} icon={b.icon} />
              ))}
            </div>
          )
        ) : (
          // Categorized view
          CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2 px-0.5 font-medium">
                {cat}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
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
