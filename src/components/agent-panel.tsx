"use client";

import { useEditorStore, AgentBlockDescription, BlockType } from "@/store/editor-store";
import { useState, useRef, useEffect } from "react";

const VALID_TYPES = new Set<string>([
  "container", "text", "heading", "button", "image", "input",
  "card", "flex-row", "grid", "divider", "spacer", "badge", "avatar", "link",
]);

function parseAgentBlocks(text: string): AgentBlockDescription[] | null {
  // Try to extract JSON from markdown code blocks or raw JSON
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\])/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const arr = Array.isArray(parsed) ? parsed : [parsed];

    function validate(desc: unknown): AgentBlockDescription | null {
      if (!desc || typeof desc !== "object") return null;
      const d = desc as Record<string, unknown>;
      if (!VALID_TYPES.has(d.type as string)) return null;
      const result: AgentBlockDescription = { type: d.type as BlockType };
      if (d.props && typeof d.props === "object") {
        result.props = d.props as AgentBlockDescription["props"];
      }
      if (Array.isArray(d.children)) {
        result.children = d.children.map(validate).filter(Boolean) as AgentBlockDescription[];
      }
      return result;
    }

    const validated = arr.map(validate).filter(Boolean) as AgentBlockDescription[];
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

export default function AgentPanel() {
  const agentConfig = useEditorStore((s) => s.agentConfig);
  const setAgentConfig = useEditorStore((s) => s.setAgentConfig);
  const agentMessages = useEditorStore((s) => s.agentMessages);
  const addAgentMessage = useEditorStore((s) => s.addAgentMessage);
  const agentLoading = useEditorStore((s) => s.agentLoading);
  const setAgentLoading = useEditorStore((s) => s.setAgentLoading);
  const addBlocksFromAgent = useEditorStore((s) => s.addBlocksFromAgent);
  const [input, setInput] = useState("");
  const [showConfig, setShowConfig] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  const sendMessage = async () => {
    if (!input.trim() || agentLoading) return;
    const userMsg = input.trim();
    setInput("");
    addAgentMessage({ role: "user", content: userMsg });
    setAgentLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          config: agentConfig,
          history: agentMessages,
        }),
      });
      const data = await res.json();
      const responseText = data.response || data.error || "No response";
      addAgentMessage({ role: "assistant", content: responseText });

      // Try to parse blocks from the response and add to canvas
      const blocks = parseAgentBlocks(responseText);
      if (blocks) {
        addBlocksFromAgent(blocks);
      }
    } catch (err) {
      addAgentMessage({ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` });
    } finally {
      setAgentLoading(false);
    }
  };

  function handleAddBlocks(content: string) {
    const blocks = parseAgentBlocks(content);
    if (blocks) {
      addBlocksFromAgent(blocks);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Config toggle */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center justify-between p-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Agent Config
        </h3>
        <span className="text-[var(--text-secondary)] text-xs">{showConfig ? "▲" : "▼"}</span>
      </button>

      {showConfig && (
        <div className="p-3 border-b border-[var(--border-color)] space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Framework</span>
            <select
              value={agentConfig.type}
              onChange={(e) => setAgentConfig({ type: e.target.value as "langchain" | "langgraph" | "deepagents" })}
              className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
            >
              <option value="langchain">LangChain</option>
              <option value="langgraph">LangGraph</option>
              <option value="deepagents">DeepAgents</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">API Key</span>
            <input
              type="password"
              value={agentConfig.apiKey}
              onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Model</span>
            <input
              value={agentConfig.model}
              onChange={(e) => setAgentConfig({ model: e.target.value })}
              placeholder="gpt-4o / claude-sonnet-4-6"
              className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)]"
            />
          </label>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agentConfig.apiKey ? "bg-[var(--success)]" : "bg-[var(--text-secondary)]"}`} />
            <span className="text-[10px] text-[var(--text-secondary)]">
              {agentConfig.apiKey ? `Connected — ${agentConfig.type}` : "No API key set"}
            </span>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agentMessages.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] text-xs mt-4">
            <p className="mb-2">💬 Chat with your AI agent</p>
            <p>Ask it to generate UI blocks.</p>
            <p className="mt-2 text-[10px] italic">
              e.g. "Create a card with a heading, text, and a button"
            </p>
          </div>
        )}
        {agentMessages.map((msg, i) => (
          <div key={i}>
            <div
              className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
                msg.role === "user"
                  ? "ml-auto bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-xs">{msg.content}</pre>
            </div>
            {msg.role === "assistant" && parseAgentBlocks(msg.content) && (
              <button
                onClick={() => handleAddBlocks(msg.content)}
                className="mt-1 text-[10px] px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent-hover)] rounded hover:bg-[var(--accent)]/30 transition"
              >
                + Add blocks to canvas again
              </button>
            )}
          </div>
        ))}
        {agentLoading && (
          <div className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] animate-pulse">
            Agent is thinking...
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask your agent..."
            className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)]"
          />
          <button
            onClick={sendMessage}
            disabled={agentLoading || !input.trim()}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-lg text-sm transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
