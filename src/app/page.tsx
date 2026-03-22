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
import TemplateGallery from "@/components/template-gallery";
import ConfirmDialog from "@/components/confirm-dialog";
import { ToastProvider, useToast } from "@/components/toast";
import { useState, useEffect, useRef, useCallback } from "react";

type PreviewSize = "desktop" | "tablet" | "mobile";

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

function CanvasDropZone({ previewSize, zoom }: { previewSize: PreviewSize; zoom: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-root", data: { isRoot: true } });
  const rootIds = useEditorStore((s) => s.rootIds);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  return (
    <div
      ref={setNodeRef}
      onClick={() => selectBlock(null)}
      className={`flex-1 overflow-auto p-8 canvas-grid transition-colors ${isOver ? "bg-[var(--accent-subtle)]" : ""}`}
    >
      <div
        className="preview-frame min-h-full origin-top"
        style={{
          maxWidth: PREVIEW_WIDTHS[previewSize],
          width: "100%",
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          transformOrigin: "top center",
        }}
      >
        {rootIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--text-muted)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center mb-5">
              <span className="text-2xl opacity-40">⊞</span>
            </div>
            <p className="text-sm mb-1.5 text-[var(--text-secondary)]">Drag blocks here to start building</p>
            <p className="text-xs">or use templates / AI agent to generate layouts</p>
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

// Full-screen preview overlay
function PreviewOverlay({ onClose }: { onClose: () => void }) {
  const rootIds = useEditorStore((s) => s.rootIds);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "f" || e.key === "F") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-[var(--bg-primary)] overflow-auto">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="btn btn-ghost text-[12px] shadow-lg bg-[var(--bg-elevated)]">
          Exit Preview · Esc
        </button>
      </div>
      <div className="max-w-5xl mx-auto p-8 min-h-full">
        {rootIds.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] mt-20">Nothing to preview</p>
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

function EditorInner() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const selectedId = useEditorStore((s) => s.selectedId);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const clearCanvas = useEditorStore((s) => s.clearCanvas);
  const exportLayout = useEditorStore((s) => s.exportLayout);
  const importLayout = useEditorStore((s) => s.importLayout);
  const copyBlock = useEditorStore((s) => s.copyBlock);
  const pasteBlock = useEditorStore((s) => s.pasteBlock);
  const selectNextSibling = useEditorStore((s) => s.selectNextSibling);
  const selectPrevSibling = useEditorStore((s) => s.selectPrevSibling);
  const selectParentBlock = useEditorStore((s) => s.selectParentBlock);
  const selectFirstChild = useEditorStore((s) => s.selectFirstChild);
  const clipboard = useEditorStore((s) => s.clipboard);
  const rootIds = useEditorStore((s) => s.rootIds);
  const blocks = useEditorStore((s) => s.blocks);
  const { toast } = useToast();

  const [dragType, setDragType] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<"blocks" | "layers" | "agent">("blocks");
  const [rightPanel, setRightPanel] = useState<"properties" | "code">("properties");
  const [showImport, setShowImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : z;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      return idx > 0 ? ZOOM_LEVELS[idx - 1] : z;
    });
  }, []);

  const zoomReset = useCallback(() => setZoom(100), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      // Undo/Redo always work
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
        return;
      }
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
        return;
      }

      // Copy/Paste work even in inputs (standard behavior)
      if (e.key === "c" && (e.ctrlKey || e.metaKey) && selectedId && !isInput) {
        e.preventDefault();
        copyBlock(selectedId);
        toast("Block copied", "info");
        return;
      }
      if (e.key === "v" && (e.ctrlKey || e.metaKey) && clipboard && !isInput) {
        e.preventDefault();
        pasteBlock(null);
        toast("Block pasted", "success");
        return;
      }

      // Zoom
      if (e.key === "=" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (e.key === "-" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomReset();
        return;
      }

      if (isInput) return;

      // Preview mode
      if (e.key === "f" || e.key === "F") {
        setShowPreview((p) => !p);
        return;
      }

      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        const block = blocks[selectedId];
        if (block && block.children.length > 0) {
          setConfirmAction({
            title: "Delete block?",
            message: `This ${block.type} has ${block.children.length} child block(s). Deleting it will remove all children too.`,
            action: () => removeBlock(selectedId),
          });
        } else {
          removeBlock(selectedId);
        }
        return;
      }

      // Duplicate
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedId) {
        e.preventDefault();
        duplicateBlock(selectedId);
        toast("Block duplicated", "success");
        return;
      }

      // Arrow key navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectNextSibling();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectPrevSibling();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectParentBlock();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        selectFirstChild();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        selectBlock(null);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, removeBlock, duplicateBlock, selectBlock, blocks, toast, copyBlock, pasteBlock, clipboard, selectNextSibling, selectPrevSibling, selectParentBlock, selectFirstChild, zoomIn, zoomOut, zoomReset]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    setDragType(data?.fromPalette ? data.type : "move");
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
    toast("Layout exported", "success");
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
        toast("Layout imported successfully", "success");
      } else {
        toast("Invalid layout file", "error");
      }
    };
    reader.readAsText(file);
  }

  function handleClearCanvas() {
    const count = Object.keys(blocks).length;
    if (count === 0) return;
    setConfirmAction({
      title: "Clear canvas?",
      message: `This will remove all ${count} block(s) from the canvas. This action can be undone with Ctrl+Z.`,
      action: () => {
        clearCanvas();
        toast("Canvas cleared", "info");
      },
    });
  }

  const leftPanels = [
    { key: "blocks" as const, label: "Blocks", icon: "⊞" },
    { key: "layers" as const, label: "Layers", icon: "☰" },
    { key: "agent" as const, label: "Agent", icon: "◎" },
  ];

  const rightPanels = [
    { key: "properties" as const, label: "Props", icon: "⚙" },
    { key: "code" as const, label: "Code", icon: "⟨/⟩" },
  ];

  const previewSizes: { key: PreviewSize; label: string; icon: string }[] = [
    { key: "desktop", label: "Desktop", icon: "🖥" },
    { key: "tablet", label: "Tablet", icon: "⊟" },
    { key: "mobile", label: "Mobile", icon: "📱" },
  ];

  const blockCount = Object.keys(blocks).length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
        {/* Top bar */}
        <header className="h-11 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">U</span>
              </div>
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">UI Creator</span>
            </div>
            {blockCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-full font-mono">
                {blockCount} {blockCount === 1 ? "block" : "blocks"}
              </span>
            )}
            <div className="w-px h-4 bg-[var(--border-color)]" />
            <button onClick={() => setShowTemplates(true)} className="btn btn-ghost text-[11px]">
              Templates
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Responsive preview toggle */}
            <div className="flex items-center bg-[var(--bg-primary)] rounded-md p-0.5 border border-[var(--border-color)]">
              {previewSizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setPreviewSize(s.key)}
                  className={`px-2 py-1 text-[11px] rounded transition-all ${
                    previewSize === s.key
                      ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                  title={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center bg-[var(--bg-primary)] rounded-md p-0.5 border border-[var(--border-color)]">
              <button onClick={zoomOut} className="px-1.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition" title="Zoom out (Ctrl+-)">−</button>
              <button onClick={zoomReset} className="px-1.5 py-1 text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition min-w-[36px]" title="Reset zoom (Ctrl+0)">{zoom}%</button>
              <button onClick={zoomIn} className="px-1.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition" title="Zoom in (Ctrl+=)">+</button>
            </div>

            <div className="w-px h-4 bg-[var(--border-color)] mx-0.5" />

            {/* Preview mode */}
            <button onClick={() => setShowPreview(true)} className="btn btn-ghost text-[11px]" title="Full preview (F)">
              Preview
            </button>

            <button onClick={handleExport} className="btn btn-ghost text-[11px]">Export</button>
            <button onClick={() => setShowImport(true)} className="btn btn-ghost text-[11px]">Import</button>

            <div className="w-px h-4 bg-[var(--border-color)] mx-0.5" />

            <button onClick={() => useEditorStore.temporal.getState().undo()} className="btn btn-ghost px-2" title="Undo (Ctrl+Z)">
              <span className="text-[13px]">↩</span>
            </button>
            <button onClick={() => useEditorStore.temporal.getState().redo()} className="btn btn-ghost px-2" title="Redo (Ctrl+Shift+Z)">
              <span className="text-[13px]">↪</span>
            </button>

            <div className="w-px h-4 bg-[var(--border-color)] mx-0.5" />

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn btn-ghost px-2"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span className="text-[13px]">{theme === "dark" ? "☀" : "☾"}</span>
            </button>

            <button onClick={handleClearCanvas} className="btn btn-danger-ghost text-[11px]">Clear</button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-60 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
            <div className="flex border-b border-[var(--border-color)]">
              {leftPanels.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setLeftPanel(p.key)}
                  className={`tab-btn ${leftPanel === p.key ? "active" : ""}`}
                >
                  <span className="block text-[13px] mb-0.5">{p.icon}</span>
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
          <CanvasDropZone previewSize={previewSize} zoom={zoom} />

          {/* Right sidebar */}
          <aside className="w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
            <div className="flex border-b border-[var(--border-color)]">
              {rightPanels.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setRightPanel(p.key)}
                  className={`tab-btn ${rightPanel === p.key ? "active" : ""}`}
                >
                  <span className="block text-[13px] mb-0.5">{p.icon}</span>
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

        {/* Footer */}
        <footer className="h-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
            <span>↑↓←→ navigate</span>
            <span>Ctrl+C/V copy/paste</span>
            <span>Ctrl+D duplicate</span>
            <span>Del delete</span>
            <span>F preview</span>
            <span>Ctrl+Z undo</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            {previewSize !== "desktop" && (
              <span className="text-[var(--accent)]">{PREVIEW_WIDTHS[previewSize]}</span>
            )}
            {zoom !== 100 && (
              <span className="text-[var(--accent)]">{zoom}%</span>
            )}
            <span>v2.2</span>
          </div>
        </footer>
      </div>

      {/* Preview mode */}
      {showPreview && <PreviewOverlay onClose={() => setShowPreview(false)} />}

      {/* Template gallery */}
      {showTemplates && (
        <TemplateGallery
          onClose={() => setShowTemplates(false)}
          onApply={(name) => toast(`"${name}" template added`, "success")}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-[460px] max-h-[80vh] flex flex-col shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-primary)]">Import Layout</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary text-[12px]">
                Choose File
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">Or paste JSON:</p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="flex-1 min-h-[180px] p-3 input-base font-mono text-[12px] resize-none"
              placeholder='{"blocks": {...}, "rootIds": [...]}'
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowImport(false)} className="btn btn-ghost">Cancel</button>
              <button
                onClick={() => {
                  if (importLayout(importJson)) {
                    setShowImport(false);
                    setImportJson("");
                    toast("Layout imported successfully", "success");
                  } else {
                    toast("Invalid JSON format", "error");
                  }
                }}
                className="btn btn-primary"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          confirmAction?.action();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Drag overlay */}
      <DragOverlay>
        {dragType && dragType !== "move" ? (
          <div className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-md text-[12px] font-medium shadow-lg opacity-90">
            {dragType}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function EditorPage() {
  return (
    <ToastProvider>
      <EditorInner />
    </ToastProvider>
  );
}
