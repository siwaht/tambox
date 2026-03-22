"use client";

import { useEditorStore, AgentBlockDescription } from "@/store/editor-store";

interface Template {
  name: string;
  description: string;
  icon: string;
  blocks: AgentBlockDescription[];
}

const TEMPLATES: Template[] = [
  {
    name: "Hero Section",
    description: "Landing page hero with heading, text, and CTA",
    icon: "◆",
    blocks: [
      {
        type: "container",
        props: { padding: "48px 24px", bgColor: "transparent" },
        children: [
          { type: "heading", props: { text: "Build something amazing", level: 1, fontSize: "36px" } },
          { type: "spacer", props: { height: "12px" } },
          { type: "text", props: { text: "A modern platform to create, ship, and scale your ideas. Start building today with our intuitive tools.", fontSize: "16px" } },
          { type: "spacer", props: { height: "24px" } },
          {
            type: "flex-row",
            props: { gap: 12 },
            children: [
              { type: "button", props: { text: "Get Started", borderRadius: "8px" } },
              { type: "link", props: { text: "Learn more →", href: "#" } },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Pricing Card",
    description: "Single pricing tier with features list",
    icon: "◈",
    blocks: [
      {
        type: "card",
        props: { padding: "24px", borderRadius: "16px" },
        children: [
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
        ],
      },
    ],
  },
  {
    name: "Contact Form",
    description: "Simple contact form with inputs and submit",
    icon: "◇",
    blocks: [
      {
        type: "card",
        props: { padding: "24px", borderRadius: "16px" },
        children: [
          { type: "heading", props: { text: "Get in Touch", level: 3 } },
          { type: "text", props: { text: "We'd love to hear from you. Send us a message." } },
          { type: "spacer", props: { height: "16px" } },
          { type: "input", props: { placeholder: "Your name" } },
          { type: "spacer", props: { height: "8px" } },
          { type: "input", props: { placeholder: "Email address" } },
          { type: "spacer", props: { height: "8px" } },
          { type: "input", props: { placeholder: "Your message..." } },
          { type: "spacer", props: { height: "16px" } },
          { type: "button", props: { text: "Send Message", borderRadius: "8px" } },
        ],
      },
    ],
  },
  {
    name: "Feature Grid",
    description: "2-column grid of feature cards",
    icon: "⊞",
    blocks: [
      {
        type: "grid",
        props: { cols: 2, gap: 16, padding: "8px" },
        children: [
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "heading", props: { text: "⚡ Fast", level: 4 } },
              { type: "text", props: { text: "Lightning-fast performance with optimized rendering." } },
            ],
          },
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "heading", props: { text: "🔒 Secure", level: 4 } },
              { type: "text", props: { text: "Enterprise-grade security with end-to-end encryption." } },
            ],
          },
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "heading", props: { text: "🎨 Beautiful", level: 4 } },
              { type: "text", props: { text: "Stunning designs with customizable themes and layouts." } },
            ],
          },
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "heading", props: { text: "🔌 Extensible", level: 4 } },
              { type: "text", props: { text: "Plugin system for unlimited customization options." } },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "User Profile",
    description: "Profile card with avatar and details",
    icon: "◉",
    blocks: [
      {
        type: "card",
        props: { padding: "24px", borderRadius: "16px" },
        children: [
          {
            type: "flex-row",
            props: { gap: 16 },
            children: [
              { type: "avatar", props: { src: "https://placehold.co/48x48/6366f1/fff?text=JD", alt: "avatar" } },
              {
                type: "container",
                props: { padding: "0" },
                children: [
                  { type: "heading", props: { text: "Jane Doe", level: 4 } },
                  { type: "text", props: { text: "Senior Developer · San Francisco" } },
                ],
              },
            ],
          },
          { type: "divider" },
          { type: "text", props: { text: "Building the future of web development, one component at a time. Open source enthusiast and coffee lover." } },
          { type: "spacer", props: { height: "12px" } },
          {
            type: "flex-row",
            props: { gap: 8 },
            children: [
              { type: "badge", props: { text: "React" } },
              { type: "badge", props: { text: "TypeScript" } },
              { type: "badge", props: { text: "Next.js" } },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Dashboard Widget",
    description: "Stats card with metrics",
    icon: "▦",
    blocks: [
      {
        type: "grid",
        props: { cols: 3, gap: 12, padding: "8px" },
        children: [
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "text", props: { text: "Total Users", fontSize: "12px" } },
              { type: "heading", props: { text: "12,847", level: 2 } },
              { type: "badge", props: { text: "+12.5%" } },
            ],
          },
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "text", props: { text: "Revenue", fontSize: "12px" } },
              { type: "heading", props: { text: "$48.2K", level: 2 } },
              { type: "badge", props: { text: "+8.1%" } },
            ],
          },
          {
            type: "card",
            props: { padding: "20px" },
            children: [
              { type: "text", props: { text: "Conversion", fontSize: "12px" } },
              { type: "heading", props: { text: "3.24%", level: 2 } },
              { type: "badge", props: { text: "+2.3%" } },
            ],
          },
        ],
      },
    ],
  },
];

export default function TemplateGallery({ onClose, onApply }: { onClose: () => void; onApply?: (name: string) => void }) {
  const addBlocksFromAgent = useEditorStore((s) => s.addBlocksFromAgent);

  function applyTemplate(template: Template) {
    addBlocksFromAgent(template.blocks);
    onApply?.(template.name);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-[560px] max-h-[80vh] flex flex-col shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Templates</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Start with a pre-built layout</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost px-2 text-[14px]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="text-left p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]
                  hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] text-[var(--text-muted)] group-hover:text-[var(--accent)]">{t.icon}</span>
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{t.name}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
