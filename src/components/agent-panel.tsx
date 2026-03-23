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
      if (d.props && typeof d.props === "object") result.props = d.props as AgentBlockDescription["props"];
      if (Array.isArray(d.children)) result.children = d.children.map(validate).filter(Boolean) as AgentBlockDescription[];
      return result;
    }
    const validated = arr.map(validate).filter(Boolean) as AgentBlockDescription[];
    return validated.length > 0 ? validated : null;
  } catch { return null; }
}

const FRAMEWORKS = [
  { value: "langchain", label: "LangChain", color: "#22d3a0" },
  { value: "langgraph", label: "LangGraph", color: "var(--accent)" },
  { value: "deepagents", label: "DeepAgents", color: "var(--accent-2)" },
  { value: "custom", label: "Custom", color: "var(--text-muted)" },
];

const CONNECTION_MODES: { key: AgentConnectionMode; label: string }[] = [
  { key: "built-in", label: "Built-in" },
  { key: "external-api", label: "External API" },
  { key: "webhook", label: "Webhook" },
];

type AgentConfigType = ReturnType<typeof useEditorStore.getState>["agentConfig"];

export default function AgentPanel() {
  const agentConfig = useEditorStore((s) => s.agentConfig);
  const setAgentConfig = useEditorStore((s) => s.setAgentConfig);
  const agentMessages = useEditorStore((s) => s.agentMessages);
  const addAgentMessage = useEditorStore((s) => s.addAgentMessage);
  const agentLoading = useEditorStore((s) => s.agentLoading);
  const setAgentLoading = useEditorStore((s) => s.setAgentLoading);
  const addBlocksFromAgent = useEditorStore((s) => s.addBlocksFromAgent);

  const [input, setInput] = useState("");
  const [showConfig, setShowConfig] = useState(agentMessages.length === 0);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages, agentLoading]);

  const isConnected = agentConfig.connectionMode === "built-in"
    ? !!agentConfig.apiKey
    : agentConfig.connectionMode === "external-api"
    ? !!agentConfig.externalEndpoint
    : !!agentConfig.webhookUrl;

  const activeFramework = FRAMEWORKS.find((f) => f.value === agentConfig.type);

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
        body: JSON.stringify({ message: "Say hello in one sentence.", config: agentConfig, history: [] }),
      });
      const data = await res.json();
      setTestStatus(data.error ? "error" : "success");
    } catch { setTestStatus("error"); }
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  const QUICK_PROMPTS = [
    "Create a hero section with a heading and CTA button",
    "Build a pricing card with features list",
    "Make a user profile card with avatar",
    "Design a dashboard stats grid",
  ];

  return (
    <div className="h-full flex flex-col">

      {/* Status bar */}
      <button onClick={() => setShowConfig(!showConfig)}
        className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
        style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`} />
          <span className="text-[11px] font-medium" style={{ color: isConnected ? "var(--success)" : "var(--text-muted)" }}>
            {isConnected
              ? <span>{activeFramework?.label} <span style={{ color: "var(--text-muted)" }}>· {agentConfig.connectionMode}</span></span>
              : "Not connected"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--success-subtle)", color: "var(--success)" }}>
              Ready
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--text-muted)", transform: showConfig ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Config panel */}
      {showConfig && (
        <div className="p-3 space-y-3 animate-in" style={{ borderBottom: "1px solid var(--border-color)" }}>

          {/* Framework selector */}
          <div>
            <p className="sidebar-section-title mb-2">Framework</p>
            <div className="grid grid-cols-2 gap-1">
              {FRAMEWORKS.map((f) => (
                <button key={f.value} onClick={() => setAgentConfig({ type: f.value as AgentConfigType["type"] })}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    border: `1px solid ${agentConfig.type === f.value ? f.color : "var(--border-color)"}`,
                    background: agentConfig.type === f.value ? `${f.color}15` : "var(--bg-primary)",
                    color: agentConfig.type === f.value ? f.color : "var(--text-muted)",
                  }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connection mode */}
          <div>
            <p className="sidebar-section-title mb-2">Connection</p>
            <div className="toolbar-group">
              {CONNECTION_MODES.map((mode) => (
                <button key={mode.key} onClick={() => setAgentConfig({ connectionMode: mode.key })}
                  className={`toolbar-btn flex-1 text-[10px] font-medium ${agentConfig.connectionMode === mode.key ? "active" : ""}`}>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Built-in fields */}
          {agentConfig.connectionMode === "built-in" && (
            <>
              <label className="block">
                <span className="sidebar-section-title block mb-1.5">API Key</span>
                <input type="password" value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                  placeholder="sk-... or sk-ant-..." className="input-base text-[12px]" />
              </label>
              <label className="block">
                <span className="sidebar-section-title block mb-1.5">Model</span>
                <input value={agentConfig.model}
                  onChange={(e) => setAgentConfig({ model: e.target.value })}
                  placeholder="gpt-4o / claude-sonnet-4-6" className="input-base text-[12px]" />
              </label>
            </>
          )}

          {/* External API fields */}
          {agentConfig.connectionMode === "external-api" && (
            <>
              <label className="block">
                <span className="sidebar-section-title block mb-1.5">Endpoint URL</span>
                <input value={agentConfig.externalEndpoint}
                  onChange={(e) => setAgentConfig({ externalEndpoint: e.target.value })}
                  placeholder="https://your-server.com/api/chat" className="input-base text-[12px]" />
              </label>
              <label className="block">
                <span className="sidebar-section-title block mb-1.5">Auth Token</span>
                <input type="password" value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                  placeholder="Bearer token..." className="input-base text-[12px]" />
              </label>
            </>
          )}

          {/* Webhook fields */}
          {agentConfig.connectionMode === "webhook" && (
            <label className="block">
              <span className="sidebar-section-title block mb-1.5">Webhook URL</span>
              <input value={agentConfig.webhookUrl}
                onChange={(e) => setAgentConfig({ webhookUrl: e.target.value })}
                placeholder="https://hooks.your-service.com/..." className="input-base text-[12px]" />
            </label>
          )}

          <button onClick={testConnection} disabled={!isConnected || testStatus === "testing"}
            className={`w-full btn text-[11px] ${
              testStatus === "success" ? "bg-[var(--success-subtle)] border border-[var(--success)]"
              : testStatus === "error" ? "bg-[var(--danger-subtle)] border border-[var(--danger)]"
              : "btn-ghost"
            }`}
            style={{
              color: testStatus === "success" ? "var(--success)" : testStatus === "error" ? "var(--danger)" : undefined
            }}>
            {testStatus === "testing" ? "Testing connection..." : testStatus === "success" ? "✓ Connected" : testStatus === "error" ? "✕ Connection failed" : "Test Connection"}
          </button>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agentMessages.length === 0 && (
          <div className="space-y-3 mt-2">
            <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
              Ask the AI to build UI components
            </p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }}>
                  <span style={{ color: "var(--accent)" }}>→</span> {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {agentMessages.map((msg, i) => (
          <div key={i} className={`animate-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[90%]">
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "var(--gradient-accent)" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="white" strokeWidth="2" fill="none"/></svg>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {activeFramework?.label}
                  </span>
                </div>
              )}
              <div className={`px-3 py-2.5 text-[12px] leading-relaxed ${msg.role === "user" ? "msg-user" : "msg-assistant"}`}>
                <pre className="whitespace-pre-wrap font-sans text-[12px]">{msg.content}</pre>
              </div>
              {msg.role === "assistant" && parseAgentBlocks(msg.content) && (
                <button onClick={() => { const blocks = parseAgentBlocks(msg.content); if (blocks) addBlocksFromAgent(blocks); }}
                  className="mt-1.5 flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: "var(--accent-muted)", color: "var(--accent-hover)", border: "1px solid var(--accent-subtle)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add blocks to canvas
                </button>
              )}
            </div>
          </div>
        ))}

        {agentLoading && (
          <div className="flex justify-start animate-in">
            <div className="msg-assistant px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="p-2.5" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isConnected ? "Describe a UI component..." : "Configure connection above..."}
            disabled={!isConnected}
            rows={2}
            className="input-base flex-1 text-[12px] resize-none"
            style={{ minHeight: "52px", maxHeight: "120px" }}
          />
          <button onClick={sendMessage} disabled={agentLoading || !input.trim() || !isConnected}
            className="btn btn-primary shrink-0 h-[52px] w-[40px] p-0"
            style={{ borderRadius: "var(--radius-md)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
