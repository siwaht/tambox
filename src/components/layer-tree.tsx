"use client";

import { useEditorStore, isContainerType } from "@/store/editor-store";

const TYPE_ICONS: Record<string, string> = {
  container: "☐",
  card: "▢",
  "flex-row": "⇔",
  grid: "⊞",
  heading: "H",
  text: "T",
  image: "🖼",
  link: "🔗",
  button: "▶",
  input: "✎",
  divider: "—",
  spacer: "↕",
  badge: "●",
  avatar: "◉",
};

function LayerItem({ id, depth = 0 }: { id: string; depth?: number }) {
  const block = useEditorStore((s) => s.blocks[id]);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);

  if (!block) return null;

  const isSelected = selectedId === id;
  const hasChildren = block.children.length > 0;
  const label = block.props.text
    ? `${block.type} — "${block.props.text.slice(0, 20)}${(block.props.text.length || 0) > 20 ? "…" : ""}"`
    : block.type;

  return (
    <div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(id);
        }}
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs transition-colors group
          ${isSelected ? "bg-[var(--accent)]/20 text-[var(--accent-hover)]" : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="w-4 text-center shrink-0 text-[10px]">
          {TYPE_ICONS[block.type] || "?"}
        </span>
        <span className="truncate flex-1">{label}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            duplicateBlock(id);
          }}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent)] transition text-[10px]"
          title="Duplicate"
        >
          ⧉
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(id);
          }}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--danger)] transition text-[10px]"
          title="Delete"
        >
          ✕
        </button>
      </div>
      {hasChildren && (
        <div>
          {block.children.map((childId) => (
            <LayerItem key={childId} id={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayerTree() {
  const rootIds = useEditorStore((s) => s.rootIds);

  return (
    <div className="h-full overflow-y-auto py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-3 mb-2">
        Layer Tree
      </h3>
      {rootIds.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)] px-3 mt-4 text-center">
          No blocks on canvas
        </p>
      ) : (
        rootIds.map((id) => <LayerItem key={id} id={id} />)
      )}
    </div>
  );
}
