import { create } from "zustand";
import { temporal } from "zundo";
import { v4 as uuid } from "uuid";

// ── Block types ──
export type BlockType =
  | "container"
  | "text"
  | "heading"
  | "button"
  | "image"
  | "input"
  | "card"
  | "flex-row"
  | "grid"
  | "divider"
  | "spacer"
  | "badge"
  | "avatar"
  | "link"
  // ── Tambo AI Agent blocks ──
  | "chat-thread"
  | "chat-message"
  | "chat-input"
  | "agent-provider"
  | "component-renderer"
  | "tool-call"
  | "streaming-indicator"
  | "message-thread"
  | "thread-collapsible"
  | "data-chart"
  | "stat-card"
  | "data-table"
  | "code-block"
  | "alert"
  | "progress-bar"
  | "toggle"
  | "select"
  | "textarea"
  | "sidebar"
  | "navbar";

export interface BlockProps {
  text?: string;
  level?: 1 | 2 | 3 | 4;
  src?: string;
  alt?: string;
  placeholder?: string;
  href?: string;
  variant?: string;
  cols?: number;
  gap?: number;
  padding?: string;
  bgColor?: string;
  textColor?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  fontSize?: string;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  justify?: "start" | "center" | "end" | "between";
  className?: string;
  // Tambo-specific props
  apiKey?: string;
  userKey?: string;
  componentName?: string;
  toolName?: string;
  toolStatus?: "pending" | "running" | "done" | "error";
  chartType?: "bar" | "line" | "pie" | "area";
  value?: number;
  maxValue?: number;
  label?: string;
  checked?: boolean;
  options?: string;
  rows?: number;
  language?: string;
  role?: "user" | "assistant" | "system";
  streaming?: boolean;
  threadId?: string;
  position?: "left" | "right" | "top" | "bottom";
  items?: string;
  columns?: string;
  color?: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
  children: string[];
  parentId: string | null;
}

export type AgentConnectionMode = "built-in" | "external-api" | "webhook";

export interface AgentConfig {
  type: "langchain" | "langgraph" | "deepagents" | "custom";
  connectionMode: AgentConnectionMode;
  apiKey: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  // External connection
  externalEndpoint: string;
  webhookUrl: string;
  customHeaders: string;
}

// Tracked state (undo/redo applies to this)
interface TrackedState {
  blocks: Record<string, Block>;
  rootIds: string[];
  selectedId: string | null;
}

interface EditorState extends TrackedState {
  agentConfig: AgentConfig;
  agentMessages: { role: "user" | "assistant"; content: string }[];
  agentLoading: boolean;
  activePanel: "blocks" | "properties" | "code" | "agent" | "layers";

  // Clipboard
  clipboard: AgentBlockDescription[] | null;

  // Actions
  addBlock: (type: BlockType, parentId?: string | null, index?: number) => string;
  removeBlock: (id: string) => void;
  updateBlockProps: (id: string, props: Partial<BlockProps>) => void;
  moveBlock: (id: string, newParentId: string | null, index: number) => void;
  selectBlock: (id: string | null) => void;
  duplicateBlock: (id: string) => void;
  setActivePanel: (panel: EditorState["activePanel"]) => void;
  setAgentConfig: (config: Partial<AgentConfig>) => void;
  addAgentMessage: (msg: { role: "user" | "assistant"; content: string }) => void;
  setAgentLoading: (loading: boolean) => void;
  clearCanvas: () => void;
  loadBlocks: (blocks: Record<string, Block>, rootIds: string[]) => void;
  exportLayout: () => string;
  importLayout: (json: string) => boolean;
  addBlocksFromAgent: (descriptions: AgentBlockDescription[]) => void;
  // Clipboard
  copyBlock: (id: string) => void;
  pasteBlock: (parentId?: string | null) => void;
  // Keyboard navigation
  selectNextSibling: () => void;
  selectPrevSibling: () => void;
  selectParentBlock: () => void;
  selectFirstChild: () => void;
  // Layer reorder
  moveBlockInList: (id: string, direction: "up" | "down") => void;
}

export interface AgentBlockDescription {
  type: BlockType;
  props?: Partial<BlockProps>;
  children?: AgentBlockDescription[];
}

export function isContainerType(type: BlockType): boolean {
  return ["container", "card", "flex-row", "grid", "chat-thread", "message-thread", "thread-collapsible", "agent-provider", "sidebar", "navbar"].includes(type);
}

const DEFAULT_PROPS: Record<BlockType, BlockProps> = {
  container: { padding: "16px", bgColor: "transparent", borderRadius: "8px" },
  text: { text: "Text block", fontSize: "14px" },
  heading: { text: "Heading", level: 2, fontWeight: "bold" },
  button: { text: "Button", variant: "primary", borderRadius: "6px" },
  image: { src: "https://placehold.co/400x200/18181b/6366f1?text=Image", alt: "placeholder", borderRadius: "8px" },
  input: { placeholder: "Enter text...", borderRadius: "6px" },
  card: { padding: "16px", bgColor: "#18181b", borderRadius: "12px" },
  "flex-row": { gap: 12, justify: "start", align: "center", padding: "8px" },
  grid: { cols: 2, gap: 12, padding: "8px" },
  divider: {},
  spacer: { height: "24px" },
  badge: { text: "Badge", variant: "default" },
  avatar: { src: "https://placehold.co/40x40/6366f1/fff?text=A", alt: "avatar" },
  link: { text: "Link", href: "#" },
  // ── Tambo AI Agent blocks ──
  "chat-thread": { padding: "16px", bgColor: "transparent", height: "500px" },
  "chat-message": { text: "Hello! How can I help you today?", role: "assistant" },
  "chat-input": { placeholder: "Type a message...", variant: "default" },
  "agent-provider": { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
  "component-renderer": { componentName: "GenerativeComponent", text: "AI-rendered component appears here" },
  "tool-call": { toolName: "get-data", toolStatus: "done", text: "Tool executed successfully" },
  "streaming-indicator": { text: "AI is thinking...", streaming: true },
  "message-thread": { padding: "16px", height: "400px", bgColor: "transparent" },
  "thread-collapsible": { text: "Ask me anything...", placeholder: "Type a message..." },
  "data-chart": { chartType: "bar", label: "Sales Data", text: "Monthly Revenue" },
  "stat-card": { label: "Total Users", value: 24521, text: "+12% from last month", color: "purple" },
  "data-table": { label: "Data Table", columns: "Name,Status,Value", items: "Row 1,Active,$100\nRow 2,Pending,$200" },
  "code-block": { text: 'const agent = new TamboAgent({\n  apiKey: process.env.TAMBO_API_KEY,\n});\n\nawait agent.send("Show me sales data");', language: "typescript" },
  alert: { text: "This is an important message.", variant: "info", icon: "ℹ" },
  "progress-bar": { label: "Progress", value: 65, maxValue: 100, color: "purple" },
  toggle: { label: "Enable feature", checked: false },
  select: { label: "Select option", placeholder: "Choose...", options: "Option 1\nOption 2\nOption 3" },
  textarea: { placeholder: "Enter your message...", rows: 4 },
  sidebar: { padding: "16px", bgColor: "#0d0d12", width: "240px" },
  navbar: { text: "My AI App", bgColor: "#0d0d12", padding: "12px 24px" },
};

const STORAGE_KEY = "ui-creator-layout";

function autoSave(state: TrackedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks: state.blocks, rootIds: state.rootIds }));
  } catch { /* noop */ }
}

export function autoLoad(): Partial<TrackedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.blocks && data.rootIds) return data;
    }
  } catch { /* noop */ }
  return null;
}

// System prompt is defined in route.ts — leave this empty so the route's prompt is used as fallback
const DEFAULT_SYSTEM_PROMPT = "";

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      blocks: {},
      rootIds: [],
      selectedId: null,
      agentConfig: {
        type: "langchain",
        connectionMode: "built-in",
        apiKey: "",
        model: "gpt-4o",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        tools: [],
        externalEndpoint: "",
        webhookUrl: "",
        customHeaders: "",
      },
      agentMessages: [],
      agentLoading: false,
      activePanel: "blocks",
      clipboard: null,

      addBlock: (type, parentId = null, index) => {
        const id = uuid();
        const block: Block = {
          id,
          type,
          props: { ...DEFAULT_PROPS[type] },
          children: [],
          parentId,
        };

        set((state) => {
          const blocks = { ...state.blocks, [id]: block };
          const rootIds = [...state.rootIds];

          if (parentId && blocks[parentId]) {
            const parent = { ...blocks[parentId], children: [...blocks[parentId].children] };
            const idx = index !== undefined ? index : parent.children.length;
            parent.children.splice(idx, 0, id);
            blocks[parentId] = parent;
          } else {
            const idx = index !== undefined ? index : rootIds.length;
            rootIds.splice(idx, 0, id);
          }

          autoSave({ blocks, rootIds, selectedId: id });
          return { blocks, rootIds, selectedId: id };
        });

        return id;
      },

      removeBlock: (id) => {
        set((state) => {
          const blocks = { ...state.blocks };
          const rootIds = [...state.rootIds];

          const toRemove = new Set<string>();
          const collect = (blockId: string) => {
            toRemove.add(blockId);
            blocks[blockId]?.children.forEach(collect);
          };
          collect(id);

          const block = blocks[id];
          if (block?.parentId && blocks[block.parentId]) {
            const parent = { ...blocks[block.parentId] };
            parent.children = parent.children.filter((c) => c !== id);
            blocks[block.parentId] = parent;
          }

          const newRootIds = rootIds.filter((r) => !toRemove.has(r));
          toRemove.forEach((rid) => delete blocks[rid]);

          const result = {
            blocks,
            rootIds: newRootIds,
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
          autoSave(result);
          return result;
        });
      },

      updateBlockProps: (id, props) => {
        set((state) => {
          if (!state.blocks[id]) return state;
          const blocks = { ...state.blocks };
          blocks[id] = { ...blocks[id], props: { ...blocks[id].props, ...props } };
          autoSave({ blocks, rootIds: state.rootIds, selectedId: state.selectedId });
          return { blocks };
        });
      },

      moveBlock: (id, newParentId, index) => {
        set((state) => {
          const blocks = { ...state.blocks };
          const rootIds = [...state.rootIds];
          const block = blocks[id];
          if (!block) return state;

          if (block.parentId && blocks[block.parentId]) {
            const oldParent = { ...blocks[block.parentId], children: [...blocks[block.parentId].children] };
            oldParent.children = oldParent.children.filter((c) => c !== id);
            blocks[block.parentId] = oldParent;
          } else {
            const idx = rootIds.indexOf(id);
            if (idx !== -1) rootIds.splice(idx, 1);
          }

          blocks[id] = { ...block, parentId: newParentId };
          if (newParentId && blocks[newParentId]) {
            const newParent = { ...blocks[newParentId], children: [...blocks[newParentId].children] };
            newParent.children.splice(index, 0, id);
            blocks[newParentId] = newParent;
          } else {
            rootIds.splice(index, 0, id);
          }

          autoSave({ blocks, rootIds, selectedId: state.selectedId });
          return { blocks, rootIds };
        });
      },

      selectBlock: (id) => set({ selectedId: id }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setAgentConfig: (config) =>
        set((state) => ({ agentConfig: { ...state.agentConfig, ...config } })),
      addAgentMessage: (msg) =>
        set((state) => ({ agentMessages: [...state.agentMessages, msg] })),
      setAgentLoading: (loading) => set({ agentLoading: loading }),
      clearCanvas: () => {
        autoSave({ blocks: {}, rootIds: [], selectedId: null });
        set({ blocks: {}, rootIds: [], selectedId: null });
      },
      loadBlocks: (blocks, rootIds) => {
        autoSave({ blocks, rootIds, selectedId: null });
        set({ blocks, rootIds, selectedId: null });
      },

      duplicateBlock: (id) => {
        set((state) => {
          const blocks = { ...state.blocks };
          const rootIds = [...state.rootIds];
          const source = blocks[id];
          if (!source) return state;

          const cloneBlock = (srcId: string, newParentId: string | null): string => {
            const src = blocks[srcId];
            if (!src) return "";
            const newId = uuid();
            const clonedChildren: string[] = [];
            for (const childId of src.children) {
              const clonedChildId = cloneBlock(childId, newId);
              if (clonedChildId) clonedChildren.push(clonedChildId);
            }
            blocks[newId] = {
              id: newId,
              type: src.type,
              props: { ...src.props },
              children: clonedChildren,
              parentId: newParentId,
            };
            return newId;
          };

          const newId = cloneBlock(id, source.parentId);
          if (!newId) return state;

          if (source.parentId && blocks[source.parentId]) {
            const parent = { ...blocks[source.parentId], children: [...blocks[source.parentId].children] };
            const idx = parent.children.indexOf(id);
            parent.children.splice(idx + 1, 0, newId);
            blocks[source.parentId] = parent;
          } else {
            const idx = rootIds.indexOf(id);
            rootIds.splice(idx + 1, 0, newId);
          }

          autoSave({ blocks, rootIds, selectedId: newId });
          return { blocks, rootIds, selectedId: newId };
        });
      },

      exportLayout: () => {
        const { blocks, rootIds } = get();
        return JSON.stringify({ blocks, rootIds }, null, 2);
      },

      importLayout: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (data.blocks && data.rootIds) {
            set({ blocks: data.blocks, rootIds: data.rootIds, selectedId: null });
            autoSave({ blocks: data.blocks, rootIds: data.rootIds, selectedId: null });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      addBlocksFromAgent: (descriptions: AgentBlockDescription[]) => {
        set((state) => {
          const blocks = { ...state.blocks };
          const rootIds = [...state.rootIds];

          const createBlock = (desc: AgentBlockDescription, parentId: string | null): string => {
            const id = uuid();
            const childIds: string[] = [];
            if (desc.children) {
              for (const child of desc.children) {
                childIds.push(createBlock(child, id));
              }
            }
            blocks[id] = {
              id,
              type: desc.type,
              props: { ...DEFAULT_PROPS[desc.type], ...desc.props },
              children: childIds,
              parentId,
            };
            return id;
          };

          for (const desc of descriptions) {
            const id = createBlock(desc, null);
            rootIds.push(id);
          }

          autoSave({ blocks, rootIds, selectedId: state.selectedId });
          return { blocks, rootIds };
        });
      },

      // ── Clipboard ──
      copyBlock: (id: string) => {
        const { blocks } = get();
        const block = blocks[id];
        if (!block) return;

        function serialize(blockId: string): AgentBlockDescription {
          const b = blocks[blockId];
          const desc: AgentBlockDescription = { type: b.type, props: { ...b.props } };
          if (b.children.length > 0) {
            desc.children = b.children.map(serialize);
          }
          return desc;
        }

        set({ clipboard: [serialize(id)] });
      },

      pasteBlock: (parentId = null) => {
        const { clipboard } = get();
        if (!clipboard || clipboard.length === 0) return;
        // Reuse addBlocksFromAgent logic — it creates blocks from descriptions
        get().addBlocksFromAgent(clipboard);
      },

      // ── Keyboard navigation ──
      selectNextSibling: () => {
        const { selectedId, blocks, rootIds } = get();
        if (!selectedId) {
          if (rootIds.length > 0) set({ selectedId: rootIds[0] });
          return;
        }
        const block = blocks[selectedId];
        if (!block) return;
        const siblings = block.parentId ? blocks[block.parentId]?.children || [] : rootIds;
        const idx = siblings.indexOf(selectedId);
        if (idx < siblings.length - 1) {
          set({ selectedId: siblings[idx + 1] });
        }
      },

      selectPrevSibling: () => {
        const { selectedId, blocks, rootIds } = get();
        if (!selectedId) {
          if (rootIds.length > 0) set({ selectedId: rootIds[rootIds.length - 1] });
          return;
        }
        const block = blocks[selectedId];
        if (!block) return;
        const siblings = block.parentId ? blocks[block.parentId]?.children || [] : rootIds;
        const idx = siblings.indexOf(selectedId);
        if (idx > 0) {
          set({ selectedId: siblings[idx - 1] });
        }
      },

      selectParentBlock: () => {
        const { selectedId, blocks } = get();
        if (!selectedId) return;
        const block = blocks[selectedId];
        if (block?.parentId) {
          set({ selectedId: block.parentId });
        }
      },

      selectFirstChild: () => {
        const { selectedId, blocks } = get();
        if (!selectedId) return;
        const block = blocks[selectedId];
        if (block && block.children.length > 0) {
          set({ selectedId: block.children[0] });
        }
      },

      // ── Layer reorder ──
      moveBlockInList: (id: string, direction: "up" | "down") => {
        set((state) => {
          const blocks = { ...state.blocks };
          const rootIds = [...state.rootIds];
          const block = blocks[id];
          if (!block) return state;

          const list = block.parentId
            ? [...(blocks[block.parentId]?.children || [])]
            : rootIds;
          const idx = list.indexOf(id);
          if (idx === -1) return state;

          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= list.length) return state;

          // Swap
          [list[idx], list[newIdx]] = [list[newIdx], list[idx]];

          if (block.parentId && blocks[block.parentId]) {
            blocks[block.parentId] = { ...blocks[block.parentId], children: list };
          }

          const finalRootIds = block.parentId ? state.rootIds : list;
          autoSave({ blocks, rootIds: finalRootIds, selectedId: state.selectedId });
          return { blocks, rootIds: finalRootIds };
        });
      },
    }),
    {
      partialize: (state) => ({
        blocks: state.blocks,
        rootIds: state.rootIds,
        selectedId: state.selectedId,
      }),
      limit: 50,
    }
  )
);

// localStorage initialization is handled in the component via useEffect to avoid hydration mismatches

// ── Code generation ──
export function generateCode(state: Pick<EditorState, "blocks" | "rootIds" | "agentConfig">): string {
  const { blocks, rootIds, agentConfig } = state;

  function indent(code: string, level: number): string {
    const pad = "  ".repeat(level);
    return code.split("\n").map((l) => pad + l).join("\n");
  }

  function styleStr(props: BlockProps, keys: (keyof BlockProps)[]): string {
    const parts: string[] = [];
    for (const k of keys) {
      const v = props[k];
      if (v !== undefined && v !== "" && v !== "transparent") {
        const cssProp = k === "bgColor" ? "backgroundColor" : k === "textColor" ? "color" : k;
        parts.push(`${cssProp}: "${v}"`);
      }
    }
    return parts.length ? ` style={{ ${parts.join(", ")} }}` : "";
  }

  function renderBlock(id: string, depth: number): string {
    const block = blocks[id];
    if (!block) return "";
    const p = block.props;

    switch (block.type) {
      case "heading": {
        const Tag = `h${p.level || 2}`;
        const style = styleStr(p, ["fontSize", "fontWeight", "textColor"]);
        return `<${Tag} className="font-bold"${style}>${p.text}</${Tag}>`;
      }
      case "text": {
        const style = styleStr(p, ["fontSize", "textColor"]);
        return `<p className="text-sm"${style}>${p.text}</p>`;
      }
      case "button": {
        const style = styleStr(p, ["borderRadius", "bgColor", "textColor"]);
        return `<button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition"${style}>${p.text}</button>`;
      }
      case "image": {
        const style = styleStr(p, ["borderRadius", "width", "height"]);
        return `<img src="${p.src}" alt="${p.alt}" className="rounded-lg max-w-full"${style} />`;
      }
      case "input": {
        const style = styleStr(p, ["borderRadius"]);
        return `<input placeholder="${p.placeholder}" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white"${style} />`;
      }
      case "divider":
        return `<hr className="border-zinc-800 my-4" />`;
      case "spacer":
        return `<div style={{ height: "${p.height}" }} />`;
      case "badge":
        return `<span className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-full">${p.text}</span>`;
      case "avatar": {
        const style = styleStr(p, ["width", "height"]);
        return `<img src="${p.src}" alt="${p.alt}" className="w-10 h-10 rounded-full"${style} />`;
      }
      case "link":
        return `<a href="${p.href}" className="text-indigo-400 hover:underline">${p.text}</a>`;
      case "container":
      case "card": {
        const style = styleStr(p, ["padding", "bgColor", "borderRadius"]);
        const cls = block.type === "card" ? "bg-zinc-900 border border-zinc-800 rounded-xl p-4" : "p-4";
        const kids = block.children.map((cid) => renderBlock(cid, depth + 1)).join("\n");
        return `<div className="${cls}"${style}>\n${indent(kids, 1)}\n</div>`;
      }
      case "flex-row": {
        const gap = p.gap || 12;
        const style = styleStr(p, ["padding"]);
        const kids = block.children.map((cid) => renderBlock(cid, depth + 1)).join("\n");
        return `<div className="flex items-center gap-[${gap}px]"${style}>\n${indent(kids, 1)}\n</div>`;
      }
      case "grid": {
        const gap = p.gap || 12;
        const style = styleStr(p, ["padding"]);
        const kids = block.children.map((cid) => renderBlock(cid, depth + 1)).join("\n");
        return `<div className="grid grid-cols-${p.cols || 2} gap-[${gap}px]"${style}>\n${indent(kids, 1)}\n</div>`;
      }
      default:
        return `<div>{/* ${block.type} */}</div>`;
    }
  }

  const jsx = rootIds.map((id) => renderBlock(id, 1)).join("\n");

  let agentImport = "";
  let agentSetup = "";

  if (agentConfig.apiKey || agentConfig.externalEndpoint) {
    switch (agentConfig.type) {
      case "langchain":
        agentImport = `import { ChatOpenAI } from "@langchain/openai";\nimport { HumanMessage } from "@langchain/core/messages";`;
        agentSetup = `\n  // LangChain agent\n  const model = new ChatOpenAI({ modelName: "${agentConfig.model}", openAIApiKey: process.env.OPENAI_API_KEY });\n`;
        break;
      case "langgraph":
        agentImport = `import { StateGraph, START, END } from "@langchain/langgraph";\nimport { ChatOpenAI } from "@langchain/openai";`;
        agentSetup = `\n  // LangGraph agent\n  const model = new ChatOpenAI({ modelName: "${agentConfig.model}" });\n`;
        break;
      case "deepagents":
        agentImport = `import { createDeepAgent } from "deepagents";`;
        agentSetup = `\n  // DeepAgents\n  const agent = createDeepAgent({ model: "${agentConfig.model}" });\n`;
        break;
      case "custom":
        agentSetup = `\n  // Custom agent endpoint: ${agentConfig.externalEndpoint || agentConfig.webhookUrl}\n`;
        break;
    }
  }

  return `"use client";
${agentImport ? "\n" + agentImport : ""}
import { useState } from "react";

export default function GeneratedPage() {${agentSetup}
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
${indent(jsx, 3)}
    </main>
  );
}
`;
}

// ── Standalone project generation ──
export function generateStandaloneProject(state: Pick<EditorState, "blocks" | "rootIds" | "agentConfig">): Record<string, string> {
  const code = generateCode(state);
  const { agentConfig } = state;

  const packageJson: Record<string, unknown> = {
    name: "ui-creator-export",
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: {
      next: "^15.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      "@tailwindcss/postcss": "^4.0.0",
      tailwindcss: "^4.0.0",
      typescript: "^5.0.0",
      "@types/react": "^19.0.0",
      "@types/node": "^22.0.0",
    },
  };

  // Add agent deps based on config
  const deps = packageJson.dependencies as Record<string, string>;
  if (agentConfig.type === "langchain" || agentConfig.type === "langgraph") {
    deps["@langchain/openai"] = "^0.3.0";
    deps["@langchain/core"] = "^0.3.0";
  }
  if (agentConfig.type === "langgraph") {
    deps["@langchain/langgraph"] = "^0.2.0";
  }
  if (agentConfig.type === "deepagents") {
    deps["deepagents"] = "^1.0.0";
  }

  const files: Record<string, string> = {
    "package.json": JSON.stringify(packageJson, null, 2),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    }, null, 2),
    "next.config.ts": `import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n`,
    "postcss.config.mjs": `/** @type {import('postcss-load-config').Config} */\nconst config = { plugins: { "@tailwindcss/postcss": {} } };\nexport default config;\n`,
    "src/app/globals.css": `@import "tailwindcss";\n\nbody {\n  background: #09090b;\n  color: #fafafa;\n  font-family: system-ui, sans-serif;\n}\n`,
    "src/app/layout.tsx": `import "./globals.css";\nexport const metadata = { title: "Generated UI" };\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n`,
    "src/app/page.tsx": code,
    "README.md": `# Generated UI\n\nThis project was exported from UI Creator.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000).\n\n## Agent Integration\n\nFramework: ${agentConfig.type}\nModel: ${agentConfig.model}\n${agentConfig.externalEndpoint ? `External Endpoint: ${agentConfig.externalEndpoint}\n` : ""}${agentConfig.webhookUrl ? `Webhook URL: ${agentConfig.webhookUrl}\n` : ""}\n`,
  };

  // Add .env.example if using API keys
  if (agentConfig.apiKey) {
    const envKey = agentConfig.type === "deepagents" && agentConfig.model?.includes("claude")
      ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    files[".env.local.example"] = `# Add your API key\n${envKey}=your-key-here\n`;
  }

  return files;
}
