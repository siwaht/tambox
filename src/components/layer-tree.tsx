"use client";

import { useEditorStore } from "@/store/editor-store";

const TYPE_ICONS: Record<string, string> = {
  container: "⬜", card: "🃏", "flex-row": "↔", grid: "⊞",
  heading: "H", text: "¶", image: "🖼", link: "↗",
  button: "⬡", input: "▭", divider: "—", spacer: "↕",
  badge: "◉", avatar: "◎",
};

const TYPE_COLORS: Record<string, string> = {
  container: "var(--accent)", card: "var(--accent)", "flex-row": "var(--accent)", grid: "var(--accent)",
  heading: "var(--accent-2)", text: "var(--accent-2)", image: "var(--accent-2)", link: "var(--accent-2)",
  button: "#22d3a0", input: "#22d3a0",
  divider: "#fbbf24", spacer: "#fbbf24", badge: "#fbbf24", avatar: "#fbbf24",
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
    ? `${block.props.text.slice(0, 18)}${(block.props.text.length || 0) > 18 ? "…" : ""}`
    : block.type;
  const color = TYPE_COLORS[block.type] || "var(--accent)";

  return (
    <div>
      <div
        onClick={(e) => { e.stopPropagation(); selectBlock(id); }}
        className="flex items-center gap-1.5 py-[5px] cursor-pointer text-[12px] transition-all group rounded-lg mx-1 my-px"
        style={{
          paddingLeft: `${depth * 14 + 8}px`,
          paddingRight: "6px",
          background: isSelected ? "var(--accent-subtle)" : undefined,
          border: isSelected ? "1px solid var(--accent-muted)" : "1px solid transparent",
          color: isSelected ? "var(--accent-hover)" : "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }
        }}
      >
        {/* Color dot */}
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, opacity: isSelected ? 1 : 0.5 }} />

        <span className="text-[12px] shrink-0 leading-none">{TYPE_ICONS[block.type] || "?"}</span>

        <span className="truncate flex-1 text-[11px]">{label}</span>

        {hasChildren && (
          <span className="text-[9px] font-mono shrink-0 px-1 py-0.5 rounded"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
            {block.children.length}
          </span>
        )}

        <div className="flex gap-px opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "up"); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px] transition"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            title="Move up">▲</button>
          <button onClick={(e) => { e.stopPropagation(); moveBlockInList(id, "down"); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px] transition"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            title="Move down">▼</button>
          <button onClick={(e) => { e.stopPropagation(); duplicateBlock(id); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px] transition"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            title="Duplicate">⧉</button>
          <button onClick={(e) => { e.stopPropagation(); removeBlock(id); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px] transition"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--danger)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            title="Delete">✕</button>
        </div>
      </div>

      {hasChildren && (
        <div className="relative">
          {depth < 8 && block.children.map((childId: string) => (
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
        <div className="flex flex-col items-center justify-center h-32" style={{ color: "var(--text-muted)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" className="mb-2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
          </svg>
          <p className="text-[11px]">No blocks on canvas</p>
        </div>
      ) : (
        rootIds.map((id: string) => <LayerItem key={id} id={id} />)
      )}
    </div>
  );
}
