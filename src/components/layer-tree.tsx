"use client";

import { useEditorStore } from "@/store/editor-store";

const TYPE_ICONS: Record<string, string> = {
  container: "□", card: "▢", "flex-row": "⇔", grid: "⊞",
  heading: "H", text: "T", image: "◻", link: "↗",
  button: "▸", input: "⌨", divider: "—", spacer: "↕",
  badge: "●", avatar: "◉",
};

function LayerItem({ id, depth = 0 }: { id: string; depth?: number }) {
  const block = useEditorStore((s) => s.blocks[id]);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const moveBlockInList = useEditorStore((s) => s.moveBlockInList);

  if (!block) return null;

  const isSelected = selectedId === id;
  const hasChildren = block.children.length > 0;
  const label = block.props.text
    ? `${block.props.text.slice(0, 20)}${(block.props.text.length || 0) > 20 ? "…" : ""}`
    : block.type;

  return (
    <div>
      <div
        onClick={(e) => { e.stopPropagation(); selectBlock(id); }}
        className={`flex items-center gap-1.5 py-[5px] cursor-pointer text-[12px] transition-all group rounded-md mx-1 my-px
          ${isSelected
            ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "6px" }}
      >
        {/* Indent guide */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-[var(--border-subtle)]"
            style={{ marginLeft: `${depth * 16}px` }}
          />
        )}

        <span className={`w-4 text-center shrink-0 text-[10px] ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
          {TYPE_ICONS[block.type] || "?"}
        </span>

        <span className="truncate flex-1 text-[11px]">{label}</span>

        {hasChildren && (
          <span className="text-[9px] text-[var(--text-muted)] font-mono shrink-0">{block.children.length}</span>
        )}

        <div className="flex gap-px opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "up"); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[9px] p-0.5 rounded hover:bg-[var(--accent-subtle)]"
            title="Move up"
          >▲</button>
          <button
            onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "down"); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[9px] p-0.5 rounded hover:bg-[var(--accent-subtle)]"
            title="Move down"
          >▼</button>
          <button
            onClick={(e) => { e.stopPropagation(); duplicateBlock(id); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[9px] p-0.5 rounded hover:bg-[var(--accent-subtle)]"
            title="Duplicate"
          >⧉</button>
          <button
            onClick={(e) => { e.stopPropagation(); removeBlock(id); }}
            className="text-[var(--text-muted)] hover:text-[var(--danger)] transition text-[9px] p-0.5 rounded hover:bg-[var(--danger-subtle)]"
            title="Delete"
          >✕</button>
        </div>
      </div>
      {hasChildren && (
        <div className="relative">
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
    <div className="h-full overflow-y-auto py-1.5">
      {rootIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
          <p className="text-[11px]">No blocks on canvas</p>
        </div>
      ) : (
        rootIds.map((id) => <LayerItem key={id} id={id} />)
      )}
    </div>
  );
}
