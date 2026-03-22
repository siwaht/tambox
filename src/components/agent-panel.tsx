"use client";

import { useEditorStore, AgentBlockDescription, BlockType, AgentConnectionMode } from "@/store/editor-store";
import { useState, useRef, useEffect } from "react";

const VALID_TYPES = new Set<string>([
  "container", "text", "heading", "button", "image", "input",
  "card", "flex-row", "grid", "divider", "spacer", "badge", "avatar", "link",
]);

function parseAgentBlocks(text: string): AgentBlockDescription[] | null {
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

const CONNECTION_MODES: { key: AgentConnectionMode; label: string; desc: string }[] = [
  { key: "built-in", label: "Built-in", desc: "Direct API calls to OpenAI/Anthropic" },
  { key: "external-api", label: "External API", desc: "Connect your own LangChain/LangGraph server" },
  { key: "webhook", label: "Webhook", desc: "Send events to any webhook endpoint" },
];

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
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
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
        body: JSON.stringify({ message: userMsg, config: agentConfig, history: agentMessages }),
      });
      const data = await res.json();
      const responseText = data.response || data.error || "No response";
      addAgentMessage({ role: "assistant", content: responseText });

      const blocks = parseAgentBlocks(responseText);
      if (blocks) addBlocksFromAgent(blocks);
    } catch (err) {
      addAgentMessage({ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` });
    } finally {
      setAgentLoading(false);
    }
  };

  const testConnection = async () => {
    setTestStatus("testing");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Say hello in one sentence.",
          config: agentConfig,
          history: [],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setTestStatus("error");
      } else {
        setTestStatus("success");
      }
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  function handleAddBlocks(content: string) {
    const blocks = parseAgentBlocks(content);
    if (blocks) addBlocksFromAgent(blocks);
  }

  const isConnected = agentConfig.connectionMode === "built-in"
    ? !!agentConfig.apiKey
    : agentConfig.connectionMode === "external-api"
    ? !!agentConfig.externalEndpoint
    : !!agentConfig.webhookUrl;

  return (
    <div className="h-full flex flex-col">
      {/* Config toggle */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition"
      >
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--success)] pulse-dot" : "bg-[var(--text-muted)]"}`} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {isConnected ? `${agentConfig.type} · ${agentConfig.connectionMode}` : "Not connected"}
          </span>
        </div>
        <span className="text-[var(--text-muted)] text-[10px]">{showConfig ? "▲" : "▼"}</span>
      </button>

      {showConfig && (
        <div className="p-3 border-b border-[var(--border-color)] space-y-3 animate-in">
          {/* Connection mode tabs */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Connection</span>
            <div className="flex gap-1 p-0.5 bg-[var(--bg-primary)] rounded-md">
              {CONNECTION_MODES.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setAgentConfig({ connectionMode: mode.key })}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded transition
                    ${agentConfig.connectionMode === mode.key
                      ? "bg-[var(--accent-muted)] text-[var(--accent-hover)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              {CONNECTION_MODES.find((m) => m.key === agentConfig.connectionMode)?.desc}
            </p>
          </div>

          {/* Framework selector */}
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Framework</span>
            <select
              value={agentConfig.type}
              onChange={(e) => setAgentConfig({ type: e.target.value as AgentConfig["type"] })}
              className="input-base"
            >
              <option value="langchain">LangChain</option>
              <option value="langgraph">LangGraph</option>
              <option value="deepagents">DeepAgents</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {/* Built-in fields */}
          {agentConfig.connectionMode === "built-in" && (
            <>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">API Key</span>
                <input
                  type="password"
                  value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Model</span>
                <input
                  value={agentConfig.model}
                  onChange={(e) => setAgentConfig({ model: e.target.value })}
                  placeholder="gpt-4o / claude-sonnet-4-6"
                  className="input-base"
                />
              </label>
            </>
          )}

          {/* External API fields */}
          {agentConfig.connectionMode === "external-api" && (
            <>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Endpoint URL</span>
                <input
                  value={agentConfig.externalEndpoint}
                  onChange={(e) => setAgentConfig({ externalEndpoint: e.target.value })}
                  placeholder="https://your-server.com/api/chat"
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Auth Token (optional)</span>
                <input
                  type="password"
                  value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                  placeholder="Bearer token..."
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Custom Headers (JSON)</span>
                <input
                  value={agentConfig.customHeaders}
                  onChange={(e) => setAgentConfig({ customHeaders: e.target.value })}
                  placeholder='{"X-Custom": "value"}'
                  className="input-base"
                />
              </label>
            </>
          )}

          {/* Webhook fields */}
          {agentConfig.connectionMode === "webhook" && (
            <>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Webhook URL</span>
                <input
                  value={agentConfig.webhookUrl}
                  onChange={(e) => setAgentConfig({ webhookUrl: e.target.value })}
                  placeholder="https://hooks.your-service.com/..."
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block font-medium">Custom Headers (JSON)</span>
                <input
                  value={agentConfig.customHeaders}
                  onChange={(e) => setAgentConfig({ customHeaders: e.target.value })}
                  placeholder='{"Authorization": "Bearer ..."}'
                  className="input-base"
                />
              </label>
            </>
          )}

          {/* Test connection */}
          <button
            onClick={testConnection}
            disabled={!isConnected || testStatus === "testing"}
            className={`w-full btn text-[11px] ${
              testStatus === "success" ? "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]"
              : testStatus === "error" ? "bg-[var(--danger-subtle)] text-[var(--danger)] border border-[var(--danger)]"
              : "btn-ghost"
            }`}
          >
            {testStatus === "testing" ? "Testing..." : testStatus === "success" ? "Connected ✓" : testStatus === "error" ? "Failed ✕" : "Test Connection"}
          </button>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agentMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
            <p className="text-xs mb-1">Chat with your AI agent</p>
            <p className="text-[10px] italic text-center leading-relaxed px-4">
              &quot;Create a card with a heading, description, and a CTA button&quot;
            </p>
          </div>
        )}
        {agentMessages.map((msg, i) => (
          <div key={i} className="animate-in">
            <div
              className={`text-[12px] rounded-lg px-3 py-2 max-w-[92%] leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-[12px]">{msg.content}</pre>
            </div>
            {msg.role === "assistant" && parseAgentBlocks(msg.content) && (
              <button
                onClick={() => handleAddBlocks(msg.content)}
                className="mt-1.5 text-[10px] px-2.5 py-1 bg-[var(--accent-muted)] text-[var(--accent-hover)] rounded-md hover:bg-[var(--accent-subtle)] transition font-medium"
              >
                + Add blocks to canvas
              </button>
            )}
          </div>
        ))}
        {agentLoading && (
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-muted)] animate-pulse">
            Thinking...
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
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={isConnected ? "Ask your agent..." : "Configure connection first..."}
            disabled={!isConnected}
            className="input-base flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={agentLoading || !input.trim() || !isConnected}
            className="btn btn-primary px-4"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

type AgentConfig = typeof import("@/store/editor-store").useEditorStore extends { getState: () => { agentConfig: infer T } } ? T : never;
