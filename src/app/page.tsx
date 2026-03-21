"use client";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import { useEditorStore, BlockType } from "@/store/editor-store";
import BlockPalette from "@/components/block-palette";
import CanvasBlock from "@/components/canvas-block";
import PropertiesPanel from "@/components/properties-panel";
import CodePanel from "@/components/code-panel";
import AgentPanel from "@/components/agent-panel";
import LayerTree from "@/components/layer-tree";
import { useState, useEffect, useCallback, useRef } from "react";

function CanvasDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-root", data: { isRoot: true } });
  const rootIds = useEditorStore((s) => s.rootIds);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  return (
    <div
      ref={setNodeRef}
      onClick={() => selectBlock(null)}
      className={`flex-1 overflow-auto p-6 transition-colors ${isOver ? "bg-[var(--accent)]/5" : ""}`}
    >
      <div className="max-w-4xl mx-auto min-h-full">
        {rootIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--text-secondary)]">
            <div className="text-6xl mb-4 opacity-20">⊞</div>
            <p className="text-lg mb-2">Drag blocks here to start building</p>
            <p className="text-sm">Drop components from the left panel onto this canvas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rootIds.map((id) => (
              <CanvasBlock key={id} id={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const selectedId = useEditorStore((s) => s.selectedId);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const clearCanvas = useEditorStore((s) => s.clearCanvas);
  const exportLayout = useEditorStore((s) => s.exportLayout);
  const importLayout = useEditorStore((s) => s.importLayout);
  const rootIds = useEditorStore((s) => s.rootIds);
  const blocks = useEditorStore((s) => s.blocks);
  const [dragType, setDragType] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<"blocks" | "layers" | "agent">("blocks");
  const [rightPanel, setRightPanel] = useState<"properties" | "code">("properties");
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      // Undo: Ctrl+Z
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
        return;
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
        return;
      }

      if (isInput) return;

      // Delete selected block
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeBlock(selectedId);
        return;
      }
      // Duplicate: Ctrl+D
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedId) {
        e.preventDefault();
        duplicateBlock(selectedId);
        return;
      }
      // Escape: deselect
      if (e.key === "Escape") {
        selectBlock(null);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, removeBlock, duplicateBlock, selectBlock]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.fromPalette) {
      setDragType(data.type);
    } else {
      setDragType("move");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragType(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.fromPalette) {
      const blockType = activeData.type as BlockType;
      if (overData?.isRoot) {
        addBlock(blockType, null);
      } else if (overData?.blockId) {
        const targetBlock = blocks[overData.blockId];
        if (targetBlock && ["container", "card", "flex-row", "grid"].includes(targetBlock.type)) {
          addBlock(blockType, overData.blockId);
        } else {
          addBlock(blockType, targetBlock?.parentId || null);
        }
      }
    } else if (activeData?.blockId) {
      const blockId = activeData.blockId as string;
      if (overData?.isRoot) {
        moveBlock(blockId, null, rootIds.length);
      } else if (overData?.blockId && overData.blockId !== blockId) {
        const targetBlock = blocks[overData.blockId];
        if (targetBlock && ["container", "card", "flex-row", "grid"].includes(targetBlock.type)) {
          moveBlock(blockId, overData.blockId, targetBlock.children.length);
        }
      }
    }
  }

  function handleExport() {
    const json = exportLayout();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ui-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importLayout(text)) {
        setShowImport(false);
        setImportJson("");
      }
    };
    reader.readAsText(file);
  }

  const leftPanels = [
    { key: "blocks" as const, label: "Blocks", icon: "⊞" },
    { key: "layers" as const, label: "Layers", icon: "☰" },
    { key: "agent" as const, label: "Agent", icon: "🤖" },
  ];

  const rightPanels = [
    { key: "properties" as const, label: "Props", icon: "⚙" },
    { key: "code" as const, label: "Code", icon: "</>" },
  ];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold bg-gradient-to-r from-[var(--accent)] to-purple-400 bg-clip-text text-transparent">
              UI Creator
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent-hover)] rounded-full">
              v2.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">
              {Object.keys(blocks).length} blocks
            </span>
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
            >
              Export
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="text-xs px-3 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
            >
              Import
            </button>
            <button
              onClick={() => { useEditorStore.temporal.getState().undo(); }}
              className="text-xs px-2 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title="Undo (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              onClick={() => { useEditorStore.temporal.getState().redo(); }}
              className="text-xs px-2 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title="Redo (Ctrl+Shift+Z)"
            >
              ↪
            </button>
            <button
              onClick={clearCanvas}
              className="text-xs px-3 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
            <div className="flex border-b border-[var(--border-color)]">
              {leftPanels.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setLeftPanel(p.key)}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition
                    ${leftPanel === p.key
                      ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-tertiary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <span className="block text-sm mb-0.5">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {leftPanel === "blocks" && <BlockPalette />}
              {leftPanel === "layers" && <LayerTree />}
              {leftPanel === "agent" && <AgentPanel />}
            </div>
          </aside>

          {/* Canvas */}
          <CanvasDropZone />

          {/* Right sidebar */}
          <aside className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
            <div className="flex border-b border-[var(--border-color)]">
              {rightPanels.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setRightPanel(p.key)}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition
                    ${rightPanel === p.key
                      ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-tertiary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <span className="block text-sm mb-0.5">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {rightPanel === "properties" && <PropertiesPanel />}
              {rightPanel === "code" && <CodePanel />}
            </div>
          </aside>
        </div>

        {/* Keyboard shortcuts hint */}
        <footer className="h-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center px-4 text-[10px] text-[var(--text-secondary)] gap-4 shrink-0">
          <span>Del — delete</span>
          <span>Ctrl+D — duplicate</span>
          <span>Ctrl+Z — undo</span>
          <span>Ctrl+Shift+Z — redo</span>
          <span>Esc — deselect</span>
        </footer>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-[480px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-primary)]">Import Layout</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm transition"
              >
                Choose File
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Or paste JSON:</p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="flex-1 min-h-[200px] p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-primary)] resize-none"
              placeholder='{"blocks": {...}, "rootIds": [...]}'
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (importLayout(importJson)) {
                    setShowImport(false);
                    setImportJson("");
                  }
                }}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm transition"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      <DragOverlay>
        {dragType && dragType !== "move" ? (
          <div className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm shadow-xl opacity-90">
            {dragType}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
