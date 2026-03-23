"use client";

import { useEditorStore, BlockType } from "@/store/editor-store";

// Which block types belong to which category
const BLOCK_META: Record<string, { label: string; color: string; description: string; category: string }> = {
  // Layout
  container:  { label: "Container", color: "var(--accent)", description: "A wrapper block for grouping other blocks.", category: "Layout" },
  card:       { label: "Card", color: "var(--accent)", description: "A styled surface with background and border.", category: "Layout" },
  "flex-row": { label: "Flex Row", color: "var(--accent)", description: "Arranges children side by side horizontally.", category: "Layout" },
  grid:       { label: "Grid", color: "var(--accent)", description: "Arranges children in a responsive column grid.", category: "Layout" },
  sidebar:    { label: "Sidebar", color: "var(--accent)", description: "A vertical navigation panel on the left side.", category: "Layout" },
  navbar:     { label: "Navbar", color: "var(--accent)", description: "A top navigation bar for your app.", category: "Layout" },
  // Content
  heading:    { label: "Heading", color: "var(--accent-2)", description: "A title or section header (H1–H4).", category: "Content" },
  text:       { label: "Text", color: "var(--accent-2)", description: "A paragraph of body text.", category: "Content" },
  image:      { label: "Image", color: "var(--accent-2)", description: "Displays an image from a URL.", category: "Content" },
  link:       { label: "Link", color: "var(--accent-2)", description: "A clickable hyperlink.", category: "Content" },
  "code-block": { label: "Code Block", color: "var(--accent-2)", description: "Displays syntax-highlighted code.", category: "Content" },
  "data-table": { label: "Data Table", color: "var(--accent-2)", description: "A table with rows and columns of data.", category: "Content" },
  // Interactive
  button:     { label: "Button", color: "#22d3a0", description: "A clickable action button.", category: "Interactive" },
  input:      { label: "Input", color: "#22d3a0", description: "A single-line text input field.", category: "Interactive" },
  textarea:   { label: "Textarea", color: "#22d3a0", description: "A multi-line text input area.", category: "Interactive" },
  select:     { label: "Select", color: "#22d3a0", description: "A dropdown menu for choosing an option.", category: "Interactive" },
  toggle:     { label: "Toggle", color: "#22d3a0", description: "An on/off switch control.", category: "Interactive" },
  // Decorative
  divider:    { label: "Divider", color: "#fbbf24", description: "A horizontal line to separate sections.", category: "Decorative" },
  spacer:     { label: "Spacer", color: "#fbbf24", description: "Adds empty vertical space between blocks.", category: "Decorative" },
  badge:      { label: "Badge", color: "#fbbf24", description: "A small label pill for status or tags.", category: "Decorative" },
  avatar:     { label: "Avatar", color: "#fbbf24", description: "A circular user profile image.", category: "Decorative" },
  alert:      { label: "Alert", color: "#fbbf24", description: "A highlighted message box for info, warnings, or errors.", category: "Decorative" },
  "progress-bar": { label: "Progress Bar", color: "#fbbf24", description: "Shows completion percentage visually.", category: "Decorative" },
  "stat-card": { label: "Stat Card", color: "#fbbf24", description: "Displays a key metric with label and trend.", category: "Decorative" },
  // Tambo AI
  "agent-provider":     { label: "TamboProvider", color: "#e879f9", description: "Wraps your app with the Tambo AI context. Required for all Tambo blocks.", category: "Tambo AI" },
  "chat-thread":        { label: "Chat Thread", color: "#e879f9", description: "A scrollable container that holds chat messages.", category: "Tambo AI" },
  "chat-message":       { label: "Chat Message", color: "#e879f9", description: "A single message bubble — either from the user or the AI.", category: "Tambo AI" },
  "chat-input":         { label: "Chat Input", color: "#e879f9", description: "The text box where users type messages to the AI.", category: "Tambo AI" },
  "message-thread":     { label: "Message Thread", color: "#e879f9", description: "A full conversation thread with message history.", category: "Tambo AI" },
  "thread-collapsible": { label: "Collapsible Chat", color: "#e879f9", description: "A floating AI assistant that expands when clicked.", category: "Tambo AI" },
  "component-renderer": { label: "Component Renderer", color: "#e879f9", description: "Placeholder where Tambo renders AI-chosen components.", category: "Tambo AI" },
  "tool-call":          { label: "Tool Call", color: "#e879f9", description: "Shows when the AI is calling a tool or fetching data.", category: "Tambo AI" },
  "streaming-indicator":{ label: "Streaming Indicator", color: "#e879f9", description: "Animated dots shown while the AI is generating a response.", category: "Tambo AI" },
  "data-chart":         { label: "Data Chart", color: "#e879f9", description: "A bar, line, or pie chart rendered by the AI agent.", category: "Tambo AI" },
};

// Blocks where the generic Style section is NOT useful
const TAMBO_BLOCKS: BlockType[] = [
  "agent-provider", "chat-thread", "chat-message", "chat-input",
  "message-thread", "thread-collapsible", "component-renderer",
  "tool-call", "streaming-indicator", "data-chart",
  "stat-card", "data-table", "code-block", "alert", "progress-bar",
  "toggle", "select", "textarea", "sidebar", "navbar",
];

export default function PropertiesPanel() {
  const selectedId = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.selectedId);
  const block = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => (selectedId ? s.blocks[selectedId] : null));
  const updateBlockProps = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.updateBlockProps);
  const duplicateBlock = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.duplicateBlock);
  const removeBlock = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.removeBlock);

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6" style={{ color: "var(--text-muted)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <p className="text-[12px] text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Select a block to edit its properties
        </p>
        <p className="text-[10px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
          Click any block on the canvas
        </p>
      </div>
    );
  }

  const p = block.props;
  const meta = BLOCK_META[block.type];
  const typeColor = meta?.color || "var(--accent)";
  const showGenericStyle = !TAMBO_BLOCKS.includes(block.type as BlockType);

  function field(label: string, key: string, type: "text" | "number" | "select" | "color" | "textarea" = "text", options?: string[], hint?: string) {
    if (!block) return null;
    const val = (p as Record<string, unknown>)[key] ?? "";
    return (
      <label className="block mb-3">
        <span className="sidebar-section-title block mb-1">{label}</span>
        {hint && <p className="text-[10px] mb-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{hint}</p>}
        {type === "select" && options ? (
          <select value={String(val)} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base text-[12px]">
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "color" ? (
          <div className="flex gap-2 items-center">
            <input type="color" value={String(val) || "#000000"}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-8 h-8 rounded-lg border cursor-pointer bg-transparent shrink-0"
              style={{ borderColor: "var(--border-color)" }} />
            <input type="text" value={String(val)}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="input-base text-[12px]" placeholder="transparent" />
          </div>
        ) : type === "textarea" ? (
          <textarea value={String(val)} rows={3}
            onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
            className="input-base text-[12px] resize-none" />
        ) : (
          <input type={type === "number" ? "number" : "text"} value={String(val)}
            onChange={(e) => updateBlockProps(block.id, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
            className="input-base text-[12px]" />
        )}
      </label>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full">

      {/* Block header with description */}
      <div className="mb-3 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColor }} />
            <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta?.label || block.type}
            </span>
            {meta?.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: `${typeColor}18`, color: typeColor }}>
                {meta.category}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
            {block.id.slice(0, 8)}
          </span>
        </div>
        {meta?.description && (
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {meta.description}
          </p>
        )}
      </div>

      <div className="flex gap-1.5 mb-3">
        <button onClick={() => duplicateBlock(block.id)} className="btn btn-ghost flex-1 text-[11px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Duplicate
        </button>
        <button onClick={() => removeBlock(block.id)} className="btn btn-danger-ghost flex-1 text-[11px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete
        </button>
      </div>

      <div className="separator" />

      {/* ── Content / Config fields per block type ── */}

      {/* Text content blocks */}
      {["heading", "text", "button", "badge", "link"].includes(block.type) && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Text", "text")}
          {block.type === "heading" && field("Level", "level", "select", ["1", "2", "3", "4"], "H1 is the largest, H4 the smallest.")}
          {block.type === "link" && field("URL", "href", "text", undefined, "Where this link points to.")}
        </div>
      )}

      {block.type === "image" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Image URL", "src", "text", undefined, "Paste a direct link to an image.")}
          {field("Alt Text", "alt", "text", undefined, "Describes the image for accessibility.")}
        </div>
      )}

      {block.type === "input" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Placeholder", "placeholder", "text", undefined, "Hint text shown when the field is empty.")}
        </div>
      )}

      {block.type === "textarea" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "label")}
          {field("Placeholder", "placeholder", "text", undefined, "Hint text shown when empty.")}
          {field("Rows", "rows", "number", undefined, "Height of the textarea in lines.")}
        </div>
      )}

      {block.type === "select" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "label")}
          {field("Placeholder", "placeholder")}
          {field("Options", "options", "textarea", undefined, "One option per line.")}
        </div>
      )}

      {block.type === "toggle" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "label", "text", undefined, "Text shown next to the toggle.")}
        </div>
      )}

      {block.type === "alert" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Message", "text")}
          {field("Type", "variant", "select", ["info", "success", "warning", "error"], "Controls the color and meaning of the alert.")}
          {field("Icon", "icon", "text", undefined, "Optional emoji or symbol shown on the left.")}
        </div>
      )}

      {block.type === "progress-bar" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "label", "text", undefined, "Text shown above the bar.")}
          {field("Value", "value", "number", undefined, "Current progress (0–100).")}
        </div>
      )}

      {block.type === "stat-card" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "label", "text", undefined, "The metric name, e.g. 'Total Users'.")}
          {field("Value", "value", "number", undefined, "The main number to display.")}
          {field("Subtitle", "text", "text", undefined, "Trend or context, e.g. '+12% this month'.")}
        </div>
      )}

      {block.type === "data-table" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Columns", "columns", "text", undefined, "Comma-separated column names, e.g. Name,Status,Value")}
          {field("Rows", "items", "textarea", undefined, "One row per line, values comma-separated.")}
        </div>
      )}

      {block.type === "code-block" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Language", "language", "select", ["typescript", "javascript", "python", "bash", "json", "css", "html"], "Used for syntax highlighting label.")}
          {field("Code", "text", "textarea")}
        </div>
      )}

      {block.type === "data-chart" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Title", "text", "text", undefined, "Chart heading shown above the bars.")}
          {field("Chart Type", "chartType", "select", ["bar", "line", "pie", "area"], "Bar = comparisons, Line = trends, Pie = proportions.")}
        </div>
      )}

      {/* Layout blocks */}
      {["container", "card", "flex-row", "grid"].includes(block.type) && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Layout</p>
          {block.type === "grid" && field("Columns", "cols", "number", undefined, "Number of equal-width columns.")}
          {["flex-row", "grid"].includes(block.type) && field("Gap", "gap", "number", undefined, "Space between children in pixels.")}
          {field("Padding", "padding", "text", undefined, "Inner spacing, e.g. 16px or 8px 16px.")}
        </div>
      )}

      {block.type === "sidebar" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Layout</p>
          {field("Width", "width", "text", undefined, "e.g. 240px")}
          {field("Padding", "padding")}
          {field("Background", "bgColor", "color")}
        </div>
      )}

      {block.type === "navbar" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("App Name", "text", "text", undefined, "Brand name shown in the navbar.")}
          {field("Padding", "padding")}
          {field("Background", "bgColor", "color")}
        </div>
      )}

      {/* Tambo AI blocks */}
      {block.type === "agent-provider" && (
        <div className="mt-3">
          <div className="p-2.5 rounded-lg mb-3 text-[11px] leading-relaxed"
            style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", color: "var(--accent-hover)" }}>
            ⚡ Wrap your entire app with this block. It connects all Tambo AI blocks to the agent.
          </div>
          <p className="sidebar-section-title mb-2">Config</p>
          {field("API Key Env Var", "apiKey", "text", undefined, "The environment variable name holding your Tambo API key, e.g. NEXT_PUBLIC_TAMBO_API_KEY")}
          {field("User Key", "userKey", "text", undefined, "Identifies the current user. Threads are scoped per user. Use a real user ID in production.")}
        </div>
      )}

      {block.type === "chat-thread" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Layout</p>
          {field("Height", "height", "text", undefined, "e.g. 400px — the scrollable area height.")}
          {field("Padding", "padding")}
          {field("Background", "bgColor", "color")}
        </div>
      )}

      {block.type === "chat-message" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Message", "text", "textarea")}
          {field("Role", "role", "select", ["user", "assistant", "system"], "User = right-aligned bubble. Assistant = left-aligned AI response.")}
        </div>
      )}

      {block.type === "chat-input" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Placeholder", "placeholder", "text", undefined, "Hint text shown in the input, e.g. 'Ask me anything...'")}
        </div>
      )}

      {block.type === "streaming-indicator" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Label", "text", "text", undefined, "Text shown next to the animated dots while the AI responds.")}
        </div>
      )}

      {block.type === "tool-call" && (
        <div className="mt-3">
          <div className="p-2.5 rounded-lg mb-3 text-[11px] leading-relaxed"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
            Shows when the AI is calling a function or fetching data in the background.
          </div>
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Tool Name", "toolName", "text", undefined, "The function name being called, e.g. get-sales-data")}
          {field("Description", "text", "text", undefined, "What the tool is doing, shown as a subtitle.")}
          {field("Status", "toolStatus", "select", ["pending", "running", "done", "error"], "Visual state of the tool call.")}
        </div>
      )}

      {block.type === "component-renderer" && (
        <div className="mt-3">
          <div className="p-2.5 rounded-lg mb-3 text-[11px] leading-relaxed"
            style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", color: "var(--accent-hover)" }}>
            This is where Tambo renders AI-chosen components. Register your React components with TamboProvider and the AI will pick the right one.
          </div>
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Component Name", "componentName", "text", undefined, "The name of the registered Tambo component, e.g. SalesChart")}
        </div>
      )}

      {block.type === "message-thread" && (
        <div className="mt-3">
          <p className="sidebar-section-title mb-2">Layout</p>
          {field("Height", "height", "text", undefined, "e.g. 400px")}
          {field("Padding", "padding")}
        </div>
      )}

      {block.type === "thread-collapsible" && (
        <div className="mt-3">
          <div className="p-2.5 rounded-lg mb-3 text-[11px] leading-relaxed"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
            A floating AI assistant button. Expands into a full chat panel when clicked. Place it anywhere in your layout.
          </div>
          <p className="sidebar-section-title mb-2">Content</p>
          {field("Button Label", "text", "text", undefined, "Text shown on the collapsed button.")}
          {field("Input Placeholder", "placeholder", "text", undefined, "Hint text in the chat input.")}
        </div>
      )}

      {/* Generic style section — only for basic blocks */}
      {showGenericStyle && (
        <>
          <div className="separator mt-3" />
          <p className="sidebar-section-title mt-3 mb-2">Style</p>
          {field("Border Radius", "borderRadius", "text", undefined, "e.g. 8px or 50%")}
          {field("Background", "bgColor", "color")}
          {field("Text Color", "textColor", "color")}
          {field("Font Size", "fontSize", "text", undefined, "e.g. 14px or 1rem")}
          {block.type === "spacer" && field("Height", "height", "text", undefined, "e.g. 24px")}
          {field("Width", "width", "text", undefined, "e.g. 100% or 320px")}
          {field("Custom Class", "className", "text", undefined, "Add Tailwind or custom CSS classes.")}
        </>
      )}
    </div>
  );
}
