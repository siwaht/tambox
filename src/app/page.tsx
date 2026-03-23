"use client";

import {
  DndContext, DragEndEvent, DragStartEvent, DragOverEvent,
  PointerSensor, useSensor, useSensors, DragOverlay,
  useDroppable, closestCenter, pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useEditorStore, BlockType, autoLoad } from "@/store/editor-store";
import BlockPalette from "@/components/block-palette";
import CanvasBlock, { BlockDragPreview } from "@/components/canvas-block";
import PropertiesPanel from "@/components/properties-panel";
import CodePanel from "@/components/code-panel";
import AgentPanel from "@/components/agent-panel";
import LayerTree from "@/components/layer-tree";
import TemplateGallery from "@/components/template-gallery";
import ConfirmDialog from "@/components/confirm-dialog";
import { ToastProvider, useToast } from "@/components/toast";
import ErrorBoundary from "@/components/error-boundary";
import { useState, useEffect, useRef, useCallback } from "react";

type PreviewSize = "desktop" | "tablet" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewSize, string> = { desktop: "100%", tablet: "768px", mobile: "375px" };
const ZOOM_LEVELS = [50, 75, 100, 125, 150];
const CONTAINER_TYPES = ["container", "card", "flex-row", "grid", "chat-thread", "message-thread", "thread-collapsible", "agent-provider", "sidebar", "navbar"];

// ── Drop indicator line between blocks ──
function DropIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="relative h-0.5 my-0.5 pointer-events-none z-30">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent-glow)" }}
      />
      <div
        className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full border-2"
        style={{ borderColor: "var(--accent)", background: "var(--bg-primary)" }}
      />
    </div>
  );
}

function CanvasDropZone({
  previewSize,
  zoom,
  activeId,
  overId,
}: {
  previewSize: PreviewSize;
  zoom: number;
  activeId: string | null;
  overId: string | null;
}) {
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
          <div className="flex flex-col items-center justify-center h-[65vh] select-none">
            <div className="relative mb-8 float">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--gradient-subtle)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="4" y="4" width="12" height="12" rx="3" fill="var(--accent)" fillOpacity="0.85"/>
                  <rect x="20" y="4" width="12" height="12" rx="3" fill="var(--accent-2)" fillOpacity="0.5"/>
                  <rect x="4" y="20" width="12" height="12" rx="3" fill="var(--accent-2)" fillOpacity="0.4"/>
                  <rect x="20" y="20" width="12" height="12" rx="3" fill="var(--accent)" fillOpacity="0.25"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] opacity-50 blur-sm" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[var(--accent-2)] opacity-40 blur-sm" />
            </div>
            <h3 className="text-[16px] font-semibold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
              Start building your UI
            </h3>
            <p className="text-[12.5px] text-center max-w-[240px] leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              Drag blocks from the left panel, pick a template, or describe what you want to the AI agent
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent)" }}>⊞</span> Drag blocks
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent-2)" }}>◎</span> Ask AI
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <span style={{ color: "var(--success)" }}>▤</span> Templates
              </div>
            </div>
          </div>
        ) : (
          <SortableContext
            items={rootIds.map((id) => `canvas-${id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {rootIds.map((id, index) => (
                <div key={id}>
                  <DropIndicator active={overId === `canvas-${id}` && activeId !== `canvas-${id}`} />
                  <CanvasBlock id={id} />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function PreviewOverlay({ onClose }: { onClose: () => void }) {
  const rootIds = useEditorStore((s) => s.rootIds);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "f" || e.key === "F") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-[var(--bg-primary)] overflow-auto">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="btn btn-ghost text-[11px] glass-panel shadow-lg">
          Exit Preview · Esc
        </button>
      </div>
      <div className="max-w-5xl mx-auto p-8 min-h-full">
        {rootIds.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] mt-20 text-[13px]">Nothing to preview</p>
        ) : (
          <div className="space-y-2">{rootIds.map((id) => <CanvasBlock key={id} id={id} />)}</div>
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

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
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
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    const saved = autoLoad();
    if (saved && saved.blocks && saved.rootIds) {
      useEditorStore.setState({ blocks: saved.blocks, rootIds: saved.rootIds });
    }
  }, []);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const zoomIn = useCallback(() => setZoom((z) => { const i = ZOOM_LEVELS.indexOf(z); return i < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[i + 1] : z; }), []);
  const zoomOut = useCallback(() => setZoom((z) => { const i = ZOOM_LEVELS.indexOf(z); return i > 0 ? ZOOM_LEVELS[i - 1] : z; }), []);
  const zoomReset = useCallback(() => setZoom(100), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); useEditorStore.temporal.getState().undo(); return; }
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); useEditorStore.temporal.getState().redo(); return; }
      if (e.key === "c" && (e.ctrlKey || e.metaKey) && selectedId && !isInput) { e.preventDefault(); copyBlock(selectedId); toast("Block copied", "info"); return; }
      if (e.key === "v" && (e.ctrlKey || e.metaKey) && clipboard && !isInput) { e.preventDefault(); pasteBlock(null); toast("Block pasted", "success"); return; }
      if (e.key === "=" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomIn(); return; }
      if (e.key === "-" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomOut(); return; }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomReset(); return; }
      if (isInput) return;
      if (e.key === "f" || e.key === "F") { setShowPreview((p) => !p); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        const block = blocks[selectedId];
        if (block && block.children.length > 0) {
          setConfirmAction({ title: "Delete block?", message: `This ${block.type} has ${block.children.length} child block(s). Deleting it will remove all children too.`, action: () => removeBlock(selectedId) });
        } else { removeBlock(selectedId); }
        return;
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); duplicateBlock(selectedId); toast("Block duplicated", "success"); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); selectNextSibling(); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); selectPrevSibling(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectParentBlock(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); selectFirstChild(); return; }
      if (e.key === "Escape") { selectBlock(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, removeBlock, duplicateBlock, selectBlock, blocks, toast, copyBlock, pasteBlock, clipboard, selectNextSibling, selectPrevSibling, selectParentBlock, selectFirstChild, zoomIn, zoomOut, zoomReset]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    setActiveId(event.active.id as string);
    setDragType(data?.fromPalette ? data.type : (data?.type || "block"));
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    setDragType(null);

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const overId = over.id as string;

    // ── Palette drop ──
    if (activeData?.fromPalette) {
      const blockType = activeData.type as BlockType;

      // Dropped on canvas root
      if (overId === "canvas-root" || overData?.isRoot) {
        addBlock(blockType, null);
        return;
      }

      // Dropped on a container's inner drop zone
      if (overData?.isContainer) {
        addBlock(blockType, overData.blockId);
        return;
      }

      // Dropped on a sortable block — insert before/after it
      if (overId.startsWith("canvas-")) {
        const targetBlockId = overId.replace("canvas-", "");
        const targetBlock = blocks[targetBlockId];
        if (!targetBlock) { addBlock(blockType, null); return; }

        // If target is a container, add inside it
        if (CONTAINER_TYPES.includes(targetBlock.type)) {
          addBlock(blockType, targetBlockId);
          return;
        }

        // Insert as sibling after the target
        const parentId = targetBlock.parentId;
        const siblings = parentId ? blocks[parentId]?.children || [] : rootIds;
        const idx = siblings.indexOf(targetBlockId);
        addBlock(blockType, parentId, idx + 1);
        return;
      }

      addBlock(blockType, null);
      return;
    }

    // ── Canvas reorder ──
    if (activeData?.blockId) {
      const blockId = activeData.blockId as string;
      const activeBlockId = `canvas-${blockId}`;

      if (activeBlockId === overId) return;

      // Dropped into a container's inner zone
      if (overData?.isContainer && overData.blockId !== blockId) {
        const targetBlock = blocks[overData.blockId];
        if (targetBlock) {
          moveBlock(blockId, overData.blockId, targetBlock.children.length);
        }
        return;
      }

      // Dropped on canvas root
      if (overId === "canvas-root" || overData?.isRoot) {
        moveBlock(blockId, null, rootIds.length);
        return;
      }

      // Dropped on another sortable block
      if (overId.startsWith("canvas-")) {
        const targetBlockId = overId.replace("canvas-", "");
        if (targetBlockId === blockId) return;

        const targetBlock = blocks[targetBlockId];
        const sourceBlock = blocks[blockId];
        if (!targetBlock || !sourceBlock) return;

        // Same parent — reorder within the list
        const sameParent = sourceBlock.parentId === targetBlock.parentId;
        if (sameParent) {
          const parentId = sourceBlock.parentId;
          const siblings = parentId ? [...(blocks[parentId]?.children || [])] : [...rootIds];
          const oldIdx = siblings.indexOf(blockId);
          const newIdx = siblings.indexOf(targetBlockId);
          if (oldIdx === -1 || newIdx === -1) return;

          const reordered = arrayMove(siblings, oldIdx, newIdx);
          if (parentId && blocks[parentId]) {
            useEditorStore.getState().moveBlock(blockId, parentId, newIdx);
          } else {
            useEditorStore.getState().moveBlock(blockId, null, newIdx);
          }
          return;
        }

        // Different parent — move to target's parent, after target
        const newParentId = targetBlock.parentId;
        const newSiblings = newParentId ? blocks[newParentId]?.children || [] : rootIds;
        const newIdx = newSiblings.indexOf(targetBlockId);
        moveBlock(blockId, newParentId, newIdx + 1);
      }
    }
  }

  function handleExport() {
    const json = exportLayout();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ui-layout.json"; a.click();
    URL.revokeObjectURL(url);
    toast("Layout exported", "success");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importLayout(text)) { setShowImport(false); setImportJson(""); toast("Layout imported", "success"); }
      else { toast("Invalid layout file", "error"); }
    };
    reader.readAsText(file);
  }

  function handleClearCanvas() {
    const count = Object.keys(blocks).length;
    if (count === 0) return;
    setConfirmAction({ title: "Clear canvas?", message: `This will remove all ${count} block(s). You can undo with Ctrl+Z.`, action: () => { clearCanvas(); toast("Canvas cleared", "info"); } });
  }

  const blockCount = Object.keys(blocks).length;
  const previewSizes: { key: PreviewSize; label: string; icon: React.ReactNode }[] = [
    { key: "desktop", label: "Desktop", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { key: "tablet", label: "Tablet", icon: <svg width="11" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg> },
    { key: "mobile", label: "Mobile", icon: <svg width="9" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg> },
  ];

  const leftPanelTabs = [
    { key: "blocks" as const, label: "Blocks", shortLabel: "Blocks", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { key: "layers" as const, label: "Layers", shortLabel: "Layers", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
    { key: "agent" as const, label: "Agent", shortLabel: "Agent", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>

        {/* ── Header ── */}
        <header className="shrink-0 flex items-center justify-between px-4 gap-3"
          style={{
            height: "52px",
            borderBottom: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
          }}>

          {/* Left: Logo + nav */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--gradient-accent)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.95"/>
                  <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.3"/>
                </svg>
              </div>
              <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                UI Creator
              </span>
            </div>

            {blockCount > 0 && (
              <span className="pill pill-accent font-mono text-[10px] shrink-0">{blockCount} {blockCount === 1 ? "block" : "blocks"}</span>
            )}

            <div className="toolbar-divider shrink-0" />

            <button onClick={() => setShowTemplates(true)} className="header-action shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
              Templates
            </button>
          </div>

          {/* Center: Preview size + zoom */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="toolbar-group">
              {previewSizes.map((s) => (
                <button key={s.key} onClick={() => setPreviewSize(s.key)}
                  className={`toolbar-btn tooltip ${previewSize === s.key ? "active" : ""}`}
                  data-tip={s.label}>
                  {s.icon}
                </button>
              ))}
            </div>
            <div className="toolbar-group">
              <button onClick={zoomOut} className="toolbar-btn" title="Zoom out (Ctrl+-)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button onClick={zoomReset} className="toolbar-btn font-mono text-[10px] min-w-[38px]" title="Reset zoom (Ctrl+0)">{zoom}%</button>
              <button onClick={zoomIn} className="toolbar-btn" title="Zoom in (Ctrl+=)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="toolbar-group">
              <button onClick={() => useEditorStore.temporal.getState().undo()} className="toolbar-btn tooltip" data-tip="Undo (Ctrl+Z)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button onClick={() => useEditorStore.temporal.getState().redo()} className="toolbar-btn tooltip" data-tip="Redo (Ctrl+Y)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
              </button>
            </div>

            <div className="toolbar-divider" />

            <button onClick={() => setShowPreview(true)} className="header-action" title="Preview (F)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview
            </button>

            <button onClick={handleExport} className="header-action">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>

            <button onClick={() => setShowImport(true)} className="header-action">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>

            <div className="toolbar-divider" />

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="toolbar-btn tooltip"
              data-tip={`${theme === "dark" ? "Light" : "Dark"} mode`}
              style={{
                padding: "5px 8px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)",
              }}>
              {theme === "dark"
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            <button onClick={handleClearCanvas} className="btn btn-danger-ghost text-[11px]" style={{ padding: "5px 10px" }}>
              Clear
            </button>
          </div>
        </header>

        {/* ── Main area ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left sidebar */}
          <aside className="flex shrink-0" style={{ borderRight: "1px solid var(--border-color)" }}>
            {/* Icon nav rail */}
            <div className="flex flex-col items-center py-2 shrink-0"
              style={{
                width: "48px",
                borderRight: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
              }}>
              {leftPanelTabs.map((p) => (
                <button key={p.key} onClick={() => setLeftPanel(p.key)}
                  className={`sidebar-nav-btn ${leftPanel === p.key ? "active" : ""}`}
                  title={p.label}>
                  {p.icon}
                  <span style={{ fontSize: "8.5px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {p.shortLabel}
                  </span>
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div style={{ width: "220px", background: "var(--bg-secondary)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="flex-1 overflow-hidden">
                {leftPanel === "blocks" && <BlockPalette />}
                {leftPanel === "layers" && <LayerTree />}
                {leftPanel === "agent" && <AgentPanel />}
              </div>
            </div>
          </aside>

          {/* Canvas */}
          <CanvasDropZone previewSize={previewSize} zoom={zoom} activeId={activeId} overId={overId} />

          {/* Right sidebar */}
          <aside className="w-[272px] flex flex-col shrink-0"
            style={{ borderLeft: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <div className="flex" style={{ borderBottom: "1px solid var(--border-color)" }}>
              {([
                { key: "properties" as const, label: "Properties", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
                { key: "code" as const, label: "Code", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
              ]).map((p) => (
                <button key={p.key} onClick={() => setRightPanel(p.key)}
                  className={`tab-btn flex items-center justify-center gap-1.5 ${rightPanel === p.key ? "active" : ""}`}>
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {rightPanel === "properties" && <PropertiesPanel />}
              {rightPanel === "code" && <CodePanel />}
            </div>
          </aside>
        </div>

        {/* ── Footer ── */}
        <footer className="shrink-0 flex items-center justify-between px-4 select-none"
          style={{
            height: "28px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
          }}>
          <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>↑↓←→ navigate</span>
            <span>Ctrl+C/V copy/paste</span>
            <span>Ctrl+D duplicate</span>
            <span>Del remove</span>
            <span>F preview</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            {previewSize !== "desktop" && <span className="pill pill-accent">{PREVIEW_WIDTHS[previewSize]}</span>}
            {zoom !== 100 && <span className="pill pill-accent">{zoom}%</span>}
            <span className="gradient-text font-semibold text-[10px]">LangChain · LangGraph · DeepAgents</span>
          </div>
        </footer>
      </div>

      {showPreview && <PreviewOverlay onClose={() => setShowPreview(false)} />}

      {showTemplates && (
        <TemplateGallery onClose={() => setShowTemplates(false)} onApply={(name) => toast(`"${name}" applied`, "success")} />
      )}

      {showImport && (
        <div className="overlay-backdrop" onClick={() => setShowImport(false)}>
          <div className="overlay-panel p-6 w-[440px] max-h-[80vh] flex flex-col animate-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Import Layout</h2>
              <button onClick={() => setShowImport(false)} className="btn btn-subtle" style={{ padding: "4px 6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary text-[12px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Choose File
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              <span className="flex items-center text-[11px]" style={{ color: "var(--text-muted)" }}>or paste JSON below</span>
            </div>
            <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)}
              className="flex-1 min-h-[160px] p-3 input-base font-mono text-[12px] resize-none"
              placeholder='{"blocks": {...}, "rootIds": [...]}' />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowImport(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => {
                if (importLayout(importJson)) { setShowImport(false); setImportJson(""); toast("Layout imported", "success"); }
                else { toast("Invalid JSON format", "error"); }
              }} className="btn btn-primary">Import</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmAction} title={confirmAction?.title || ""} message={confirmAction?.message || ""}
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { confirmAction?.action(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)} />

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {dragType ? <BlockDragPreview type={dragType} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function EditorPage() {
  return (
    <ErrorBoundary>
      <ToastProvider><EditorInner /></ToastProvider>
    </ErrorBoundary>
  );
}
