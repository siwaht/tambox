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
  const label = block.props.text
    ? `${block.type} — "${block.props.text.slice(0, 18)}${(block.props.text.length || 0) > 18 ? "…" : ""}"`
    : block.type;

  return (
    <div>
      <div
        onClick={(e) => { e.stopPropagation(); selectBlock(id); }}
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer text-[12px] transition-colors group rounded-sm mx-1
          ${isSelected
            ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
            : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
          }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <span className="w-4 text-center shrink-0 text-[10px] text-[var(--text-muted)]">
          {TYPE_ICONS[block.type] || "?"}
        </span>
        <span className="truncate flex-1">{label}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "up"); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[10px] p-0.5"
            title="Move up"
          >
            ▲
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "down"); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[10px] p-0.5"
            title="Move down"
          >
            ▼
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); duplicateBlock(id); }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition text-[10px] p-0.5"
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeBlock(id); }}
            className="text-[var(--text-muted)] hover:text-[var(--danger)] transition text-[10px] p-0.5"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
      {block.children.length > 0 && (
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
      {rootIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
          <p className="text-xs">No blocks on canvas</p>
        </div>
      ) : (
        rootIds.map((id) => <LayerItem key={id} id={id} />)
      )}
    </div>
  );
}
