"use client";

import { useState, useEffect } from "react";
import { useEditorStore, AgentBlockDescription, Block } from "@/store/editor-store";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  blocks: AgentBlockDescription[];
  builtIn?: boolean;
}

const CUSTOM_TEMPLATES_KEY = "ui-creator-custom-templates";

function loadCustomTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: Template[]) {
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

function serializeBlocks(blocks: Record<string, Block>, rootIds: string[]): AgentBlockDescription[] {
  function serialize(blockId: string): AgentBlockDescription {
    const b = blocks[blockId];
    if (!b) return { type: "text", props: {} };
    const desc: AgentBlockDescription = { type: b.type, props: { ...b.props } };
    if (b.children.length > 0) desc.children = b.children.map(serialize);
    return desc;
  }
  return rootIds.map(serialize);
}

const ICON_OPTIONS = ["◆", "◈", "◇", "⊞", "◉", "▦", "⬡", "⬢", "△", "▽", "☆", "♦", "⊡", "⊠"];
const COLOR_OPTIONS = [
  "from-indigo-500/20 to-purple-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-sky-500/20 to-blue-500/20",
  "from-pink-500/20 to-rose-500/20",
  "from-violet-500/20 to-fuchsia-500/20",
  "from-lime-500/20 to-green-500/20",
  "from-red-500/20 to-orange-500/20",
];

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "builtin-hero", name: "Hero Section", description: "Landing page hero with heading, text, and CTA",
    icon: "◆", color: "from-indigo-500/20 to-purple-500/20", builtIn: true,
    blocks: [
      { type: "container", props: { padding: "48px 24px", bgColor: "transparent" }, children: [
        { type: "heading", props: { text: "Build something amazing", level: 1, fontSize: "36px" } },
        { type: "spacer", props: { height: "12px" } },
        { type: "text", props: { text: "A modern platform to create, ship, and scale your ideas. Start building today with our intuitive tools.", fontSize: "16px" } },
        { type: "spacer", props: { height: "24px" } },
        { type: "flex-row", props: { gap: 12 }, children: [
          { type: "button", props: { text: "Get Started", borderRadius: "8px" } },
          { type: "link", props: { text: "Learn more →", href: "#" } },
        ]},
      ]},
    ],
  },
  {
    id: "builtin-pricing", name: "Pricing Card", description: "Single pricing tier with features list",
    icon: "◈", color: "from-emerald-500/20 to-teal-500/20", builtIn: true,
    blocks: [
      { type: "card", props: { padding: "24px", borderRadius: "16px" }, children: [
        { type: "badge", props: { text: "Popular" } },
        { type: "spacer", props: { height: "12px" } },
        { type: "heading", props: { text: "$29/mo", level: 2 } },
        { type: "text", props: { text: "Everything you need to get started" } },
        { type: "divider" },
        { type: "text", props: { text: "✓ Unlimited projects" } },
        { type: "text", props: { text: "✓ Priority support" } },
        { type: "text", props: { text: "✓ Custom integrations" } },
        { type: "text", props: { text: "✓ Analytics dashboard" } },
        { type: "spacer", props: { height: "16px" } },
        { type: "button", props: { text: "Subscribe Now", borderRadius: "8px" } },
      ]},
    ],
  },
  {
    id: "builtin-contact", name: "Contact Form", description: "Simple contact form with inputs and submit",
    icon: "◇", color: "from-amber-500/20 to-orange-500/20", builtIn: true,
    blocks: [
      { type: "card", props: { padding: "24px", borderRadius: "16px" }, children: [
        { type: "heading", props: { text: "Get in Touch", level: 3 } },
        { type: "text", props: { text: "We'd love to hear from you." } },
        { type: "spacer", props: { height: "16px" } },
        { type: "input", props: { placeholder: "Your name" } },
        { type: "spacer", props: { height: "8px" } },
        { type: "input", props: { placeholder: "Email address" } },
        { type: "spacer", props: { height: "8px" } },
        { type: "input", props: { placeholder: "Your message..." } },
        { type: "spacer", props: { height: "16px" } },
        { type: "button", props: { text: "Send Message", borderRadius: "8px" } },
      ]},
    ],
  },
  {
    id: "builtin-features", name: "Feature Grid", description: "2-column grid of feature cards",
    icon: "⊞", color: "from-sky-500/20 to-blue-500/20", builtIn: true,
    blocks: [
      { type: "grid", props: { cols: 2, gap: 16, padding: "8px" }, children: [
        { type: "card", props: { padding: "20px" }, children: [
          { type: "heading", props: { text: "⚡ Fast", level: 4 } },
          { type: "text", props: { text: "Lightning-fast performance with optimized rendering." } },
        ]},
        { type: "card", props: { padding: "20px" }, children: [
          { type: "heading", props: { text: "🔒 Secure", level: 4 } },
          { type: "text", props: { text: "Enterprise-grade security with end-to-end encryption." } },
        ]},
        { type: "card", props: { padding: "20px" }, children: [
          { type: "heading", props: { text: "🎨 Beautiful", level: 4 } },
          { type: "text", props: { text: "Stunning designs with customizable themes." } },
        ]},
        { type: "card", props: { padding: "20px" }, children: [
          { type: "heading", props: { text: "🔌 Extensible", level: 4 } },
          { type: "text", props: { text: "Plugin system for unlimited customization." } },
        ]},
      ]},
    ],
  },
  {
    id: "builtin-profile", name: "User Profile", description: "Profile card with avatar and details",
    icon: "◉", color: "from-pink-500/20 to-rose-500/20", builtIn: true,
    blocks: [
      { type: "card", props: { padding: "24px", borderRadius: "16px" }, children: [
        { type: "flex-row", props: { gap: 16 }, children: [
          { type: "avatar", props: { src: "https://placehold.co/48x48/6366f1/fff?text=JD", alt: "avatar" } },
          { type: "container", props: { padding: "0" }, children: [
            { type: "heading", props: { text: "Jane Doe", level: 4 } },
            { type: "text", props: { text: "Senior Developer · San Francisco" } },
          ]},
        ]},
        { type: "divider" },
        { type: "text", props: { text: "Building the future of web development, one component at a time." } },
        { type: "spacer", props: { height: "12px" } },
        { type: "flex-row", props: { gap: 8 }, children: [
          { type: "badge", props: { text: "React" } },
          { type: "badge", props: { text: "TypeScript" } },
          { type: "badge", props: { text: "Next.js" } },
        ]},
      ]},
    ],
  },
  {
    id: "builtin-dashboard", name: "Dashboard Stats", description: "Stats cards with metrics",
    icon: "▦", color: "from-violet-500/20 to-fuchsia-500/20", builtIn: true,
    blocks: [
      { type: "grid", props: { cols: 3, gap: 12, padding: "8px" }, children: [
        { type: "card", props: { padding: "20px" }, children: [
          { type: "text", props: { text: "Total Users", fontSize: "12px" } },
          { type: "heading", props: { text: "12,847", level: 2 } },
          { type: "badge", props: { text: "+12.5%" } },
        ]},
        { type: "card", props: { padding: "20px" }, children: [
          { type: "text", props: { text: "Revenue", fontSize: "12px" } },
          { type: "heading", props: { text: "$48.2K", level: 2 } },
          { type: "badge", props: { text: "+8.1%" } },
        ]},
        { type: "card", props: { padding: "20px" }, children: [
          { type: "text", props: { text: "Conversion", fontSize: "12px" } },
          { type: "heading", props: { text: "3.24%", level: 2 } },
          { type: "badge", props: { text: "+2.3%" } },
        ]},
      ]},
    ],
  },
];

// ── Save / Edit Template Dialog ──
function SaveTemplateDialog({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (name: string, description: string, icon: string, color: string) => void;
  onCancel: () => void;
  initial?: { name: string; description: string; icon: string; color: string };
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? ICON_OPTIONS[0]);
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);

  return (
    <div className="overlay-backdrop" style={{ zIndex: 60 }} onClick={onCancel}>
      <div className="overlay-panel w-[400px] animate-scale" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
            {initial ? "Edit Template" : "Save as Template"}
          </h3>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">Name</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Template"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">Description</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description..."
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-[14px] border transition-all
                    ${icon === ic
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                    }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-md border transition-all bg-gradient-to-br ${c}
                    ${color === c
                      ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                      : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border-color)]">
          <button onClick={onCancel} className="btn btn-subtle text-[12px]">Cancel</button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), description.trim(), icon, color)}
            disabled={!name.trim()}
            className="btn btn-primary text-[12px] disabled:opacity-40"
          >
            {initial ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Gallery ──
type Tab = "built-in" | "my-templates";

export default function TemplateGallery({ onClose, onApply }: { onClose: () => void; onApply?: (name: string) => void }) {
  const addBlocksFromAgent = useEditorStore((s) => s.addBlocksFromAgent);
  const blocks = useEditorStore((s) => s.blocks);
  const rootIds = useEditorStore((s) => s.rootIds);

  const [tab, setTab] = useState<Tab>("built-in");
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  const canSave = rootIds.length > 0;

  function applyTemplate(template: Template) {
    addBlocksFromAgent(template.blocks);
    onApply?.(template.name);
    onClose();
  }

  function handleSaveNew(name: string, description: string, icon: string, color: string) {
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon,
      color,
      blocks: serializeBlocks(blocks, rootIds),
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    setShowSaveDialog(false);
    setTab("my-templates");
  }

  function handleUpdate(name: string, description: string, icon: string, color: string) {
    if (!editingTemplate) return;
    const updated = customTemplates.map((t) =>
      t.id === editingTemplate.id ? { ...t, name, description, icon, color } : t
    );
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    setEditingTemplate(null);
  }

  function handleOverwrite(template: Template) {
    const updated = customTemplates.map((t) =>
      t.id === template.id ? { ...t, blocks: serializeBlocks(blocks, rootIds) } : t
    );
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
  }

  function handleDelete(id: string) {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    setConfirmDeleteId(null);
  }

  const displayTemplates = tab === "built-in" ? BUILT_IN_TEMPLATES : customTemplates;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose}>
        <div
          className="overlay-panel w-[580px] max-h-[80vh] flex flex-col animate-scale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Templates</h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Start with a pre-built layout or use your own</p>
            </div>
            <div className="flex items-center gap-2">
              {tab === "my-templates" && canSave && (
                <button onClick={() => setShowSaveDialog(true)} className="btn btn-primary text-[11px] px-3 py-1.5">
                  + Save Current
                </button>
              )}
              <button onClick={onClose} className="btn btn-subtle text-[14px]">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] px-5">
            {(["built-in", "my-templates"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors -mb-px
                  ${tab === t
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
              >
                {t === "built-in" ? "Built-in" : `My Templates (${customTemplates.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {displayTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-[28px] mb-3 opacity-40">📁</span>
                <p className="text-[13px] text-[var(--text-muted)] mb-1">No custom templates yet</p>
                <p className="text-[11px] text-[var(--text-muted)] mb-4">
                  Build something on the canvas, then save it here for reuse.
                </p>
                {canSave && (
                  <button onClick={() => setShowSaveDialog(true)} className="btn btn-primary text-[12px] px-4 py-2">
                    Save Current Canvas
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="relative text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]
                      hover:border-[var(--accent)] hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <button onClick={() => applyTemplate(t)} className="relative w-full text-left">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[16px] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition">{t.icon}</span>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{t.name}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t.description}</p>
                    </button>

                    {/* Actions for custom templates */}
                    {!t.builtIn && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {canSave && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOverwrite(t); }}
                            title="Overwrite with current canvas"
                            className="w-6 h-6 rounded flex items-center justify-center text-[10px]
                              bg-[var(--bg-secondary)] border border-[var(--border-color)]
                              hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                          >
                            ↻
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTemplate(t); }}
                          title="Edit name & description"
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px]
                            bg-[var(--bg-secondary)] border border-[var(--border-color)]
                            hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(t.id); }}
                          title="Delete template"
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px]
                            bg-[var(--bg-secondary)] border border-[var(--border-color)]
                            hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <SaveTemplateDialog onSave={handleSaveNew} onCancel={() => setShowSaveDialog(false)} />
      )}

      {/* Edit dialog */}
      {editingTemplate && (
        <SaveTemplateDialog
          initial={{ name: editingTemplate.name, description: editingTemplate.description, icon: editingTemplate.icon, color: editingTemplate.color }}
          onSave={handleUpdate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="overlay-backdrop" style={{ zIndex: 60 }} onClick={() => setConfirmDeleteId(null)}>
          <div className="overlay-panel w-[360px] p-5 animate-scale" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">Delete Template</h3>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-5">
              Are you sure? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="btn btn-subtle text-[12px]">Cancel</button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="btn text-[12px] bg-[var(--danger)] text-white hover:brightness-110"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
