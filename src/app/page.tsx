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

function DropIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="relative h-0.5 my-0.5 pointer-events-none z-30">
      <div className="absolute inset-0 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent-glow)" }} />
      <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full border-2" style={{ borderColor: "var(--accent)", background: "var(--bg-primary)" }} />
    </div>
  );
}

// Quick Start Template cards shown in the empty canvas
const QUICK_TEMPLATES = [
  { id: "chat", name: "Chat Agent", desc: "Simple conversational agent with status and logs", icon: "💬", blocks: "~50 sub-blocks", color: "#7c6af7" },
  { id: "dashboard", name: "Dashboard Agent", desc: "Data-rich agent with charts, tables, and KPIs", icon: "📊", blocks: "~65 sub-blocks", color: "#22d3a0" },
  { id: "tool", name: "Tool Agent", desc: "Agent with tool call/try, approvals, and results", icon: "🔧", blocks: "~56 sub-blocks", color: "#fbbf24" },
  { id: "blank", name: "Blank Canvas", desc: "Start from scratch — add blocks as you go", icon: "📄", blocks: "", color: "#8080a8" },
];

function CanvasDropZone({
  previewSize,
  zoom,
  activeId,
  overId,
  onTemplateClick,
}: {
  previewSize: PreviewSize;
  zoom: number;
  activeId: string | null;
  overId: string | null;
  onTemplateClick: (id: string) => void;
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
            {/* Empty state card */}
            <div className="w-full max-w-[560px] rounded-2xl p-10 flex flex-col items-center"
              style={{ border: "2px dashed var(--border-color)", background: "var(--bg-secondary)" }}>
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "var(--gradient-subtle)", border: "1px solid var(--border-color)" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="9" height="9" rx="2.5" fill="var(--accent)" fillOpacity="0.85"/>
                  <rect x="16" y="3" width="9" height="9" rx="2.5" fill="var(--accent-2)" fillOpacity="0.5"/>
                  <rect x="3" y="16" width="9" height="9" rx="2.5" fill="var(--accent-2)" fillOpacity="0.4"/>
                  <rect x="16" y="16" width="9" height="9" rx="2.5" fill="var(--accent)" fillOpacity="0.25"/>
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold mb-1.5 tracking-tight" style={{ color: "var(--text-primary)" }}>
                Build your AI frontend
              </h3>
              <p className="text-[12px] text-center max-w-[320px] leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                Drag blocks from the palette, pick a template, or click any block to add it.
              </p>
              {/* Action hints */}
              <div className="flex items-center gap-5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add blocks
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  Connect agent
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Preview &amp; publish
                </span>
              </div>
            </div>

            {/* Quick Start Templates */}
            <div className="w-full max-w-[560px] mt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px]" style={{ color: "var(--accent)" }}>✦</span>
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Quick Start Templates</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_TEMPLATES.map((t) => (
                  <button key={t.id} onClick={(e) => { e.stopPropagation(); onTemplateClick(t.id); }}
                    className="text-left p-3.5 rounded-xl transition-all"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "var(--bg-tertiary)"; }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[16px] mt-0.5">{t.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold mb-0.5" style={{ color: t.color }}>{t.name}</div>
                        <div className="text-[10.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.desc}</div>
                        {t.blocks && <div className="text-[9.5px] mt-1.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{t.blocks}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <SortableContext items={rootIds.map((id) => `canvas-${id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {rootIds.map((id) => (
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
  const agentConfig = useEditorStore((s) => s.agentConfig);
  const agentMessages = useEditorStore((s) => s.agentMessages);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview" | "code">("preview");
  const [previewInput, setPreviewInput] = useState("");
  const [previewLogs] = useState([
    { time: "00:01", level: "info", msg: "Agent initialized — connected to runtime" },
    { time: "00:02", level: "info", msg: 'Processing user query: "Analyze Q4 sales data"' },
    { time: "00:03", level: "tool", msg: "Tool call: query_database started" },
    { time: "00:04", level: "info", msg: "Database query returned 3 rows in 0.1s" },
    { time: "00:05", level: "warn", msg: "Rate limit approaching: 45/50 requests" },
  ]);
  const [previewResults] = useState([
    { region: "West", q4_revenue: "$4.2M", growth: "+12.5%" },
    { region: "East", q4_revenue: "$3.8M", growth: "+8.3%" },
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const chatMessages = agentMessages.length > 0 ? agentMessages : [
    { role: "user" as const, content: "Analyze the Q4 sales data and find the top performing regions." },
    { role: "assistant" as const, content: "I'll analyze the Q4 sales data now. Let me pull the regional breakdown and identify the top performers." },
    { role: "user" as const, content: "Also compare it with Q3 numbers." },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "#080810" }}>
      {/* Top toolbar */}
      <header className="shrink-0 flex items-center justify-between px-4" style={{ height: "48px", borderBottom: "1px solid var(--border-color)", background: "#0c0c16" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.95"/><rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/><rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/><rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.3"/></svg>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>My Agent Frontend</span>
          </div>
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
            {(["Edit", "Preview", "Code"] as const).map((tab) => (
              <button key={tab} onClick={() => setPreviewTab(tab.toLowerCase() as "edit" | "preview" | "code")}
                className="px-4 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: previewTab === tab.toLowerCase() ? "var(--accent)" : "transparent",
                  color: previewTab === tab.toLowerCase() ? "white" : "var(--text-muted)",
                }}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {["undo", "redo", "copy", "save", "settings"].map((action) => (
            <button key={action} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: "var(--text-muted)", border: "1px solid var(--border-color)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-focus)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {action === "undo" && <><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></>}
                {action === "redo" && <><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></>}
                {action === "copy" && <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                {action === "save" && <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></>}
                {action === "settings" && <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></>}
              </svg>
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "var(--success)", color: "#000" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Project
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: "rgba(34,211,160,0.15)", color: "var(--success)", border: "1px solid rgba(34,211,160,0.3)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
            Connected
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: "var(--accent)", color: "white" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            AI Prompt
          </button>
        </div>
      </header>

      {/* Breadcrumb bar */}
      <div className="shrink-0 flex items-center px-4 gap-2" style={{ height: "32px", borderBottom: "1px solid var(--border-color)", background: "#0a0a14" }}>
        <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>▸ Local Agent</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{agentConfig.model || "gpt-4o"} / {agentConfig.externalEndpoint || "api/agent"}</span>
      </div>

      {/* Workspace hint */}
      <div className="shrink-0 flex items-center justify-center py-1.5" style={{ background: "#09090f" }}>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Default workspace — add blocks in the editor or connect an agent</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3" style={{ background: "#09090f" }}>
        {/* Top row: Chat + Status */}
        <div className="flex gap-3 flex-1 min-h-0">
          {/* CHAT panel */}
          <div className="flex-[3] flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)", background: "#0c0c16" }}>
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>Chat</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]" style={{ background: "var(--gradient-accent)", color: "white" }}>AI</div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                    style={{
                      background: msg.role === "user" ? "var(--accent-muted)" : "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: `1px solid ${msg.role === "user" ? "var(--accent-glow)" : "var(--border-color)"}`,
                    }}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-semibold" style={{ background: "var(--accent)", color: "white" }}>A</div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3" style={{ borderTop: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                <input value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent text-[12px] outline-none" style={{ color: "var(--text-primary)" }} />
                <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-accent)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* STATUS panel */}
          <div className="flex-[1] flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)", background: "#0c0c16" }}>
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>Status</div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Idle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Results + Tool Activity */}
        <div className="flex gap-3" style={{ height: "180px" }}>
          {/* RESULTS panel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)", background: "#0c0c16" }}>
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>Results</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {previewResults.map((r, i) => (
                <div key={i} className="p-3 rounded-lg text-[11px] font-mono leading-relaxed" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                  <div>{`{`}</div>
                  <div className="pl-3">&quot;region&quot;: &quot;<span style={{ color: "var(--success)" }}>{r.region}</span>&quot;,</div>
                  <div className="pl-3">&quot;q4_revenue&quot;: &quot;<span style={{ color: "var(--accent-hover)" }}>{r.q4_revenue}</span>&quot;,</div>
                  <div className="pl-3">&quot;growth&quot;: &quot;<span style={{ color: "var(--success)" }}>{r.growth}</span>&quot;</div>
                  <div>{`}`}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TOOL ACTIVITY panel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)", background: "#0c0c16" }}>
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>Tool Activity</div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Waiting for agent tool calls...</span>
            </div>
          </div>
        </div>

        {/* LOGS panel */}
        <div className="flex flex-col rounded-xl overflow-hidden" style={{ height: "130px", border: "1px solid var(--border-color)", background: "#0c0c16" }}>
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>Logs</div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-relaxed space-y-0.5">
            {previewLogs.map((log, i) => (
              <div key={i} className="flex gap-2 px-1.5 py-0.5 rounded" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-muted)" }}>{log.time}</span>
                <span className="font-semibold" style={{
                  color: log.level === "warn" ? "var(--warning)" : log.level === "tool" ? "var(--accent-2)" : log.level === "info" ? "var(--text-muted)" : "var(--text-secondary)",
                }}>[{log.level}]</span>
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar with zoom controls */}
      <div className="shrink-0 flex items-center justify-end px-4 gap-2" style={{ height: "28px", borderTop: "1px solid var(--border-color)", background: "#0c0c16" }}>
        <button onClick={onClose} className="text-[10px] px-2 py-0.5 rounded transition-colors" style={{ color: "var(--text-muted)", border: "1px solid var(--border-color)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
          Exit Preview · Esc
        </button>
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
  const [rightPanel, setRightPanel] = useState<"properties" | "code">("properties");
  const [showImport, setShowImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "code">("edit");
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
      if (e.key === "f" || e.key === "F") { setActiveTab((t) => t === "preview" ? "edit" : "preview"); return; }
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

    if (activeData?.fromPalette) {
      const blockType = activeData.type as BlockType;
      if (overId === "canvas-root" || overData?.isRoot) { addBlock(blockType, null); return; }
      if (overData?.isContainer) { addBlock(blockType, overData.blockId); return; }
      if (overId.startsWith("canvas-")) {
        const targetBlockId = overId.replace("canvas-", "");
        const targetBlock = blocks[targetBlockId];
        if (!targetBlock) { addBlock(blockType, null); return; }
        if (CONTAINER_TYPES.includes(targetBlock.type)) { addBlock(blockType, targetBlockId); return; }
        const parentId = targetBlock.parentId;
        const siblings = parentId ? blocks[parentId]?.children || [] : rootIds;
        const idx = siblings.indexOf(targetBlockId);
        addBlock(blockType, parentId, idx + 1);
        return;
      }
      addBlock(blockType, null);
      return;
    }

    if (activeData?.blockId) {
      const blockId = activeData.blockId as string;
      const activeBlockId = `canvas-${blockId}`;
      if (activeBlockId === overId) return;
      if (overData?.isContainer && overData.blockId !== blockId) {
        const targetBlock = blocks[overData.blockId];
        if (targetBlock) moveBlock(blockId, overData.blockId, targetBlock.children.length);
        return;
      }
      if (overId === "canvas-root" || overData?.isRoot) { moveBlock(blockId, null, rootIds.length); return; }
      if (overId.startsWith("canvas-")) {
        const targetBlockId = overId.replace("canvas-", "");
        if (targetBlockId === blockId) return;
        const targetBlock = blocks[targetBlockId];
        const sourceBlock = blocks[blockId];
        if (!targetBlock || !sourceBlock) return;
        const sameParent = sourceBlock.parentId === targetBlock.parentId;
        if (sameParent) {
          const parentId = sourceBlock.parentId;
          const siblings = parentId ? [...(blocks[parentId]?.children || [])] : [...rootIds];
          const oldIdx = siblings.indexOf(blockId);
          const newIdx = siblings.indexOf(targetBlockId);
          if (oldIdx === -1 || newIdx === -1) return;
          if (parentId && blocks[parentId]) {
            useEditorStore.getState().moveBlock(blockId, parentId, newIdx);
          } else {
            useEditorStore.getState().moveBlock(blockId, null, newIdx);
          }
          return;
        }
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

  function handleQuickTemplate(id: string) {
    if (id === "blank") return;
    setShowTemplates(true);
  }

  const isConnected = true; // placeholder for agent connection status

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>

        {/* ── Header ── */}
        <header className="shrink-0 flex items-center justify-between px-4 gap-3"
          style={{ height: "48px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>

          {/* Left: Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.95"/>
                  <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.3"/>
                </svg>
              </div>
              <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>My Agent Frontend</span>
            </div>
          </div>

          {/* Center: Edit / Preview / Code toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
              {(["edit", "preview", "code"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-1.5 text-[11px] font-medium rounded-md transition-all capitalize"
                  style={{
                    background: activeTab === tab ? "var(--accent)" : "transparent",
                    color: activeTab === tab ? "white" : "var(--text-muted)",
                  }}>
                  {tab === "edit" ? "Edit" : tab === "preview" ? "Preview" : "Code"}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Toolbar actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Toolbar icons */}
            <div className="flex items-center gap-0.5">
              <button onClick={() => useEditorStore.temporal.getState().undo()} className="toolbar-icon-btn" title="Undo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button onClick={() => useEditorStore.temporal.getState().redo()} className="toolbar-icon-btn" title="Redo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
              </button>
              <button onClick={() => setPreviewSize(previewSize === "desktop" ? "tablet" : previewSize === "tablet" ? "mobile" : "desktop")} className="toolbar-icon-btn" title="Device preview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="toolbar-icon-btn" title="Toggle theme">
                {theme === "dark"
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                }
              </button>
            </div>

            {/* Download Project button */}
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
              style={{ background: "var(--accent)", boxShadow: "0 0 0 1px rgba(124,106,247,0.3)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Project
            </button>

            {/* Connected badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
              style={{ background: "var(--success-subtle)", color: "var(--success)", border: "1px solid rgba(34,211,160,0.2)" }}>
              <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--success)" }} />
              Connected
            </div>

            {/* AI Prompt button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background: "var(--accent-muted)", color: "var(--accent-hover)", border: "1px solid rgba(124,106,247,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              AI Prompt
            </button>
          </div>
        </header>

        {/* ── Main area ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left sidebar - Block Palette */}
          <aside className="flex flex-col shrink-0" style={{ width: "220px", borderRight: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <BlockPalette />
          </aside>

          {/* Canvas / Preview / Code */}
          {activeTab === "edit" && (
            <CanvasDropZone previewSize={previewSize} zoom={zoom} activeId={activeId} overId={overId} onTemplateClick={handleQuickTemplate} />
          )}
          {activeTab === "preview" && (
            <div className="flex-1 overflow-auto p-8 canvas-grid">
              <div className="max-w-5xl mx-auto min-h-full">
                {rootIds.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] mt-20 text-[13px]">Nothing to preview</p>
                ) : (
                  <div className="space-y-2">{rootIds.map((id) => <CanvasBlock key={id} id={id} />)}</div>
                )}
              </div>
            </div>
          )}
          {activeTab === "code" && (
            <div className="flex-1 overflow-hidden">
              <CodePanel />
            </div>
          )}

          {/* Right sidebar - Properties */}
          {activeTab === "edit" && (
            <aside className="flex flex-col shrink-0" style={{ width: "260px", borderLeft: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
              <PropertiesPanel />
            </aside>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="shrink-0 flex items-center justify-between px-4 select-none"
          style={{ height: "26px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-3 text-[9.5px]" style={{ color: "var(--text-muted)" }}>
            <span>LANGSMITH</span>
          </div>
          <div className="flex items-center gap-2 text-[9.5px]" style={{ color: "var(--text-muted)" }}>
            <span className="gradient-text font-semibold">My Agent Frontend</span>
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
