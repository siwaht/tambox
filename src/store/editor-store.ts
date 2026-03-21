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
  | "link";

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
}

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
  children: string[];
  parentId: string | null;
}

export interface AgentConfig {
  type: "langchain" | "langgraph" | "deepagents";
  apiKey: string;
  model: string;
  systemPrompt: string;
  tools: string[];
}

// Tracked state (undo/redo applies to this)
interface TrackedState {
  blocks: Record<string, Block>;
  rootIds: string[];
  selectedId: string | null;
}

interface EditorState extends TrackedState {
  // Agent (not tracked by undo)
  agentConfig: AgentConfig;
  agentMessages: { role: "user" | "assistant"; content: string }[];
  agentLoading: boolean;

  // Panel
  activePanel: "blocks" | "properties" | "code" | "agent" | "layers";

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
}

export interface AgentBlockDescription {
  type: BlockType;
  props?: Partial<BlockProps>;
  children?: AgentBlockDescription[];
}

export function isContainerType(type: BlockType): boolean {
  return ["container", "card", "flex-row", "grid"].includes(type);
}

const DEFAULT_PROPS: Record<BlockType, BlockProps> = {
  container: { padding: "16px", bgColor: "transparent", borderRadius: "8px" },
  text: { text: "Text block", fontSize: "14px" },
  heading: { text: "Heading", level: 2, fontWeight: "bold" },
  button: { text: "Button", variant: "primary", borderRadius: "6px" },
  image: { src: "https://placehold.co/400x200/1a1a2e/6366f1?text=Image", alt: "placeholder", borderRadius: "8px" },
  input: { placeholder: "Enter text...", borderRadius: "6px" },
  card: { padding: "16px", bgColor: "#1a1a2e", borderRadius: "12px" },
  "flex-row": { gap: 12, justify: "start", align: "center", padding: "8px" },
  grid: { cols: 2, gap: 12, padding: "8px" },
  divider: {},
  spacer: { height: "24px" },
  badge: { text: "Badge", variant: "default" },
  avatar: { src: "https://placehold.co/40x40/6366f1/fff?text=A", alt: "avatar" },
  link: { text: "Link", href: "#" },
};

// Auto-save key
const STORAGE_KEY = "ui-creator-layout";

function autoSave(state: TrackedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks: state.blocks, rootIds: state.rootIds }));
  } catch {}
}

function autoLoad(): Partial<TrackedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.blocks && data.rootIds) return data;
    }
  } catch {}
  return null;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      blocks: {},
      rootIds: [],
      selectedId: null,
      agentConfig: {
        type: "langchain",
        apiKey: "",
        model: "gpt-4o",
        systemPrompt: "You are a helpful AI assistant that can generate UI layouts. When asked to create UI, respond with a JSON block describing the layout using this format: ```json\n[{\"type\":\"card\",\"props\":{\"padding\":\"16px\"},\"children\":[{\"type\":\"heading\",\"props\":{\"text\":\"Title\"}}]}]\n``` Valid types: container, text, heading, button, image, input, card, flex-row, grid, divider, spacer, badge, avatar, link.",
        tools: [],
      },
      agentMessages: [],
      agentLoading: false,
      activePanel: "blocks",

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
          let rootIds = [...state.rootIds];

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

          // Deep clone a block and all its children
          const cloneMap = new Map<string, string>();
          const cloneBlock = (srcId: string, newParentId: string | null): string => {
            const src = blocks[srcId];
            if (!src) return "";
            const newId = uuid();
            cloneMap.set(srcId, newId);
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
    }),
    {
      // Only track block-related state for undo/redo
      partialize: (state) => ({
        blocks: state.blocks,
        rootIds: state.rootIds,
        selectedId: state.selectedId,
      }),
      limit: 50,
    }
  )
);

// Initialize from localStorage on client
if (typeof window !== "undefined") {
  const saved = autoLoad();
  if (saved && saved.blocks && saved.rootIds) {
    useEditorStore.setState({ blocks: saved.blocks, rootIds: saved.rootIds });
  }
}

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
        const cssProp = k === "bgColor" ? "backgroundColor" : k === "textColor" ? "color" : k === "borderRadius" ? "borderRadius" : k === "fontSize" ? "fontSize" : k === "fontWeight" ? "fontWeight" : k;
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
        return `<input placeholder="${p.placeholder}" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"${style} />`;
      }
      case "divider":
        return `<hr className="border-gray-700 my-4" />`;
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
        const cls = block.type === "card" ? "bg-gray-900 border border-gray-800 rounded-xl p-4" : "p-4";
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

  if (agentConfig.apiKey) {
    switch (agentConfig.type) {
      case "langchain":
        agentImport = `import { ChatOpenAI } from "@langchain/openai";\nimport { HumanMessage } from "@langchain/core/messages";`;
        agentSetup = `\n  // LangChain agent setup\n  const model = new ChatOpenAI({ modelName: "${agentConfig.model}", openAIApiKey: process.env.OPENAI_API_KEY });\n`;
        break;
      case "langgraph":
        agentImport = `import { StateGraph, START, END } from "@langchain/langgraph";\nimport { ChatOpenAI } from "@langchain/openai";`;
        agentSetup = `\n  // LangGraph agent setup\n  const model = new ChatOpenAI({ modelName: "${agentConfig.model}" });\n  // Define your graph nodes and edges here\n`;
        break;
      case "deepagents":
        agentImport = `import { createDeepAgent } from "deepagents";`;
        agentSetup = `\n  // DeepAgents setup\n  const agent = createDeepAgent({\n    model: "${agentConfig.model}",\n    systemPrompt: "${agentConfig.systemPrompt.replace(/"/g, '\\"')}",\n  });\n`;
        break;
    }
  }

  return `"use client";
${agentImport ? "\n" + agentImport : ""}
import { useState } from "react";

export default function GeneratedPage() {${agentSetup}
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
${indent(jsx, 3)}
    </main>
  );
}
`;
}
