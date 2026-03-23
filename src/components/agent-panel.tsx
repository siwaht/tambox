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
    const RESERVED_KEYS = new Set(["type", "props", "children"]);
    function validate(desc: unknown): AgentBlockDescription | null {
      if (!desc || typeof desc !== "object") return null;
      const d = desc as Record<string, unknown>;
      if (!VALID_TYPES.has(d.type as string)) return null;
      const result: AgentBlockDescription = { type: d.type as BlockType };
      // Support both { props: {...} } and flat props like { text: "Hello", type: "heading" }
      if (d.props && typeof d.props === "object") {
        result.props = d.props as AgentBlockDescription["props"];
      } else {
        // Extract any non-reserved keys as props (handles LLM returning flat format)
        const flatProps: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(d)) {
          if (!RESERVED_KEYS.has(k) && v !== undefined) flatProps[k] = v;
        }
        if (Object.keys(flatProps).length > 0) result.props = flatProps as AgentBlockDescription["props"];
      }
      if (Array.isArray(d.children)) result.children = d.children.map(validate).filter(Boolean) as AgentBlockDescription[];
      return result;
    }
    const validated = arr.map(validate).filter(Boolean) as AgentBlockDescription[];
    return validated.length > 0 ? validated : null;
  } catch { return null; }
}

const FRAMEWORKS = [
  { value: "langchain", label: "LangChain", color: "#22d3a0", desc: "Chain-based LLM workflows" },
  { value: "langgraph", label: "LangGraph", color: "var(--accent)", desc: "Stateful multi-step graphs" },
  { value: "deepagents", label: "DeepAgents", color: "var(--accent-2)", desc: "Extended reasoning agents" },
  { value: "custom", label: "Custom", color: "var(--text-muted)", desc: "Your own agent framework" },
];

const CONNECTION_MODES: { key: AgentConnectionMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: "built-in",
    label: "Built-in",
    desc: "Use OpenAI or Anthropic directly",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  },
  {
    key: "external-api",
    label: "External API",
    desc: "Connect your own REST endpoint",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  },
  {
    key: "webhook",
    label: "Webhook",
    desc: "Receive responses via webhook",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
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
  const [showApiKey, setShowApiKey] = useState(false);
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
    "Create a hero section with heading and CTA",
    "Build a pricing card with features list",
    "Make a user profile card with avatar",
    "Design a dashboard stats grid",
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Connection status bar ── */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center justify-between px-3 py-2.5 w-full transition-colors hover:bg-[var(--bg-hover)] shrink-0"
        style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`} />
          <span className="text-[11.5px] font-medium" style={{ color: isConnected ? "var(--success)" : "var(--text-muted)" }}>
            {isConnected
              ? <>{activeFramework?.label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {agentConfig.connectionMode}</span></>
              : "Not connected — click to configure"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="pill pill-success text-[9px]">Ready</span>
          )}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{
              color: "var(--text-muted)",
              transform: showConfig ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* ── Config panel ── */}
      {showConfig && (
        <div className="overflow-y-auto shrink-0 animate-in" style={{ borderBottom: "1px solid var(--border-color)", maxHeight: "70%" }}>
          <div className="p-3 space-y-4">

            {/* Framework */}
            <div>
              <p className="sidebar-section-title mb-2">Framework</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FRAMEWORKS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setAgentConfig({ type: f.value as AgentConfigType["type"] })}
                    className="flex flex-col gap-0.5 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={{
                      border: `1px solid ${agentConfig.type === f.value ? f.color : "var(--border-color)"}`,
                      background: agentConfig.type === f.value ? `${f.color}18` : "var(--bg-primary)",
                    }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: agentConfig.type === f.value ? f.color : "var(--text-secondary)" }}>
                        {f.label}
                      </span>
                    </div>
                    <span className="text-[9.5px] leading-tight pl-3" style={{ color: "var(--text-muted)" }}>{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection mode */}
            <div>
              <p className="sidebar-section-title mb-2">Connection Mode</p>
              <div className="space-y-1.5">
                {CONNECTION_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setAgentConfig({ connectionMode: mode.key })}
                    className={`connection-card ${agentConfig.connectionMode === mode.key ? "active" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div style={{ color: agentConfig.connectionMode === mode.key ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }}>
                        {mode.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold" style={{ color: agentConfig.connectionMode === mode.key ? "var(--accent)" : "var(--text-primary)" }}>
                          {mode.label}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{mode.desc}</div>
                      </div>
                      {agentConfig.connectionMode === mode.key && (
                        <div className="ml-auto shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--accent)" }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Built-in fields */}
            {agentConfig.connectionMode === "built-in" && (
              <div className="space-y-2.5">
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">API Key</span>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={agentConfig.apiKey}
                      onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                      placeholder="sk-... or sk-ant-..."
                      className="input-base text-[12px] pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                      {showApiKey
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  <p className="text-[9.5px] mt-1" style={{ color: "var(--text-muted)" }}>
                    OpenAI (sk-...) or Anthropic (sk-ant-...) key
                  </p>
                </label>
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">Model</span>
                  <input
                    value={agentConfig.model}
                    onChange={(e) => setAgentConfig({ model: e.target.value })}
                    placeholder="gpt-4o or claude-sonnet-4-6"
                    className="input-base text-[12px]"
                  />
                </label>
              </div>
            )}

            {/* External API fields */}
            {agentConfig.connectionMode === "external-api" && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg text-[10.5px] leading-relaxed" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", color: "var(--text-secondary)" }}>
                  Your endpoint should accept <code className="font-mono" style={{ color: "var(--accent-hover)" }}>POST</code> with <code className="font-mono" style={{ color: "var(--accent-hover)" }}>{"{ message, history }"}</code> and return <code className="font-mono" style={{ color: "var(--accent-hover)" }}>{"{ response }"}</code>.
                </div>
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">Endpoint URL</span>
                  <input
                    value={agentConfig.externalEndpoint}
                    onChange={(e) => setAgentConfig({ externalEndpoint: e.target.value })}
                    placeholder="https://your-server.com/api/chat"
                    className="input-base text-[12px]"
                  />
                </label>
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">Auth Token <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></span>
                  <input
                    type="password"
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig({ apiKey: e.target.value })}
                    placeholder="Bearer token..."
                    className="input-base text-[12px]"
                  />
                </label>
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">Custom Headers <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(JSON, optional)</span></span>
                  <textarea
                    value={agentConfig.customHeaders}
                    onChange={(e) => setAgentConfig({ customHeaders: e.target.value })}
                    placeholder={'{"X-My-Header": "value"}'}
                    rows={2}
                    className="input-base text-[11px] font-mono resize-none"
                  />
                </label>
              </div>
            )}

            {/* Webhook fields */}
            {agentConfig.connectionMode === "webhook" && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg text-[10.5px] leading-relaxed" style={{ background: "var(--warning-subtle)", border: "1px solid rgba(251,191,36,0.2)", color: "var(--text-secondary)" }}>
                  The app will POST to your webhook URL. Your service should return <code className="font-mono" style={{ color: "var(--warning)" }}>{"{ response: string }"}</code>.
                </div>
                <label className="block">
                  <span className="sidebar-section-title block mb-1.5">Webhook URL</span>
                  <input
                    value={agentConfig.webhookUrl}
                    onChange={(e) => setAgentConfig({ webhookUrl: e.target.value })}
                    placeholder="https://hooks.your-service.com/..."
                    className="input-base text-[12px]"
                  />
                </label>
              </div>
            )}

            {/* System prompt (shared) */}
            <label className="block">
              <span className="sidebar-section-title block mb-1.5">System Prompt <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></span>
              <textarea
                value={agentConfig.systemPrompt}
                onChange={(e) => setAgentConfig({ systemPrompt: e.target.value })}
                placeholder="You are a helpful UI design assistant..."
                rows={2}
                className="input-base text-[11.5px] resize-none"
              />
            </label>

            {/* Test connection */}
            <button
              onClick={testConnection}
              disabled={!isConnected || testStatus === "testing"}
              className={`w-full btn text-[11.5px] font-medium ${
                testStatus === "success"
                  ? "bg-[var(--success-subtle)] border border-[var(--success)]"
                  : testStatus === "error"
                  ? "bg-[var(--danger-subtle)] border border-[var(--danger)]"
                  : "btn-ghost"
              }`}
              style={{
                color: testStatus === "success" ? "var(--success)" : testStatus === "error" ? "var(--danger)" : undefined,
              }}>
              {testStatus === "testing" ? (
                <span className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Testing...
                </span>
              ) : testStatus === "success" ? (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Connection successful
                </span>
              ) : testStatus === "error" ? (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Connection failed
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Test Connection
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Chat messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {agentMessages.length === 0 && (
          <div className="space-y-3 mt-2 animate-in">
            <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
              Ask the AI to build UI components
            </p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all group"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
                  }}>
                  <span style={{ color: "var(--accent)" }}>→</span> {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {agentMessages.map((msg, i) => (
          <div key={i} className={`animate-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[92%]">
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--gradient-accent)" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" fill="white"/>
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="white" strokeWidth="2" fill="none"/>
                    </svg>
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
                <button
                  onClick={() => { const blocks = parseAgentBlocks(msg.content); if (blocks) addBlocksFromAgent(blocks); }}
                  className="mt-1.5 flex items-center gap-1.5 text-[10.5px] px-2.5 py-1.5 rounded-lg font-medium transition-all"
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

      {/* ── Input ── */}
      <div className="p-2.5 shrink-0" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isConnected ? "Describe a UI component..." : "Configure connection above ↑"}
            disabled={!isConnected}
            rows={2}
            className="input-base flex-1 text-[12px] resize-none"
            style={{ minHeight: "52px", maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={agentLoading || !input.trim() || !isConnected}
            className="btn btn-primary shrink-0 h-[52px] w-[40px] p-0"
            style={{ borderRadius: "var(--radius-md)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-[9.5px] mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
