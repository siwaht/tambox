"use client";

import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "@/store/editor-store";

const BLOCK_CATEGORIES = [
  {
    label: "Layout",
    blocks: [
      { type: "container" as BlockType, label: "Container", icon: "☐" },
      { type: "card" as BlockType, label: "Card", icon: "▢" },
      { type: "flex-row" as BlockType, label: "Flex Row", icon: "⇔" },
      { type: "grid" as BlockType, label: "Grid", icon: "⊞" },
    ],
  },
  {
    label: "Content",
    blocks: [
      { type: "heading" as BlockType, label: "Heading", icon: "H" },
      { type: "text" as BlockType, label: "Text", icon: "T" },
      { type: "image" as BlockType, label: "Image", icon: "🖼" },
      { type: "link" as BlockType, label: "Link", icon: "🔗" },
    ],
  },
  {
    label: "Interactive",
    blocks: [
      { type: "button" as BlockType, label: "Button", icon: "▶" },
      { type: "input" as BlockType, label: "Input", icon: "✎" },
    ],
  },
  {
    label: "Decorative",
    blocks: [
      { type: "divider" as BlockType, label: "Divider", icon: "—" },
      { type: "spacer" as BlockType, label: "Spacer", icon: "↕" },
      { type: "badge" as BlockType, label: "Badge", icon: "●" },
      { type: "avatar" as BlockType, label: "Avatar", icon: "◉" },
    ],
  },
];

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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
        border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]
        hover:border-[var(--accent)] transition-all text-sm select-none
        ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="text-[var(--text-primary)]">{label}</span>
    </div>
  );
}

export default function BlockPalette() {
  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-1">
        Components
      </h3>
      {BLOCK_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2 px-1">
            {cat.label}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {cat.blocks.map((b) => (
              <DraggableBlock key={b.type} {...b} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
