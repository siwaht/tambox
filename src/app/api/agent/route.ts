import { NextRequest, NextResponse } from "next/server";

// ── Types ──
interface AgentConfig {
  type: "langchain" | "langgraph" | "deepagents" | "custom";
  connectionMode: "built-in" | "external-api" | "webhook";
  apiKey: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  externalEndpoint: string;
  webhookUrl: string;
  customHeaders: string;
}

interface Message { role: "user" | "assistant"; content: string; }

// Build the effective system prompt: always use DEFAULT_SYSTEM_PROMPT, append user's custom prompt if provided
function buildSystemPrompt(userPrompt?: string): string {
  if (!userPrompt || userPrompt.trim() === "") return DEFAULT_SYSTEM_PROMPT;
  // If user provided a custom prompt, append it after the core instructions
  return `${DEFAULT_SYSTEM_PROMPT}\n\nAdditional instructions:\n${userPrompt.trim()}`;
}

// ── LangChain built-in handler ──
async function handleLangChain(message: string, config: AgentConfig, history: Message[]): Promise<string> {
  const isAnthropic = config.model?.toLowerCase().includes("claude");
  const systemPrompt = buildSystemPrompt(config.systemPrompt);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  if (isAnthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.filter((m) => m.role !== "system"),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || "No response from model.";
  }

  // OpenAI-compatible (LangChain uses OpenAI by default)
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model || "gpt-4o", messages, max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response from model.";
}

// ── LangGraph built-in handler ──
// LangGraph adds stateful multi-step reasoning — we simulate the graph flow
async function handleLangGraph(message: string, config: AgentConfig, history: Message[]): Promise<string> {
  const isAnthropic = config.model?.toLowerCase().includes("claude");

  // LangGraph system prompt includes graph-aware reasoning
  const graphSystemPrompt = `${buildSystemPrompt(config.systemPrompt)}

You are operating as a LangGraph stateful agent. You can reason in multiple steps:
1. PLAN: Analyze the request and plan the UI structure
2. GENERATE: Create the JSON block definitions
3. VALIDATE: Ensure all block types are valid

Always output your final JSON in a \`\`\`json code block.`;

  const messages = [
    { role: "system" as const, content: graphSystemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  if (isAnthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-sonnet-4-6",
        max_tokens: 4096,
        system: graphSystemPrompt,
        messages: messages.filter((m) => m.role !== "system"),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || "No response from model.";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model || "gpt-4o", messages, max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response from model.";
}

// ── DeepAgents built-in handler ──
// DeepAgents uses deep reasoning with chain-of-thought
async function handleDeepAgents(message: string, config: AgentConfig, history: Message[]): Promise<string> {
  const isAnthropic = config.model?.toLowerCase().includes("claude");

  const deepSystemPrompt = `${buildSystemPrompt(config.systemPrompt)}

You are a DeepAgent with advanced reasoning capabilities. For UI generation:
- Think deeply about the user's intent and design goals
- Consider visual hierarchy, spacing, and component relationships
- Generate rich, detailed UI structures with proper nesting
- Always wrap your JSON output in \`\`\`json code blocks

Be thorough and create production-quality UI layouts.`;

  const messages = [
    { role: "system" as const, content: deepSystemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  if (isAnthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-sonnet-4-6",
        max_tokens: 8192,
        thinking: { type: "enabled", budget_tokens: 2000 },
        system: deepSystemPrompt,
        messages: messages.filter((m) => m.role !== "system"),
      }),
    });
    if (!res.ok) {
      // Fallback without extended thinking if not supported
      const res2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model || "claude-sonnet-4-6",
          max_tokens: 4096,
          system: deepSystemPrompt,
          messages: messages.filter((m) => m.role !== "system"),
        }),
      });
      if (!res2.ok) throw new Error(`Anthropic error ${res2.status}: ${await res2.text()}`);
      const data2 = await res2.json();
      return data2.content?.[0]?.text || "No response from model.";
    }
    const data = await res.json();
    // Extract text from thinking + text blocks
    const textContent = data.content?.find((c: { type: string }) => c.type === "text");
    return textContent?.text || "No response from model.";
  }

  // OpenAI with o1/o3 reasoning models for DeepAgents
  const isReasoningModel = config.model?.startsWith("o1") || config.model?.startsWith("o3");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model || "gpt-4o",
      messages: isReasoningModel ? messages.filter((m) => m.role !== "system") : messages,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response from model.";
}

// ── External API proxy ──
async function handleExternalApi(message: string, config: AgentConfig, history: Message[]): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.customHeaders) {
    try { Object.assign(headers, JSON.parse(config.customHeaders)); } catch { /* ignore */ }
  }
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  const res = await fetch(config.externalEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history, config: { model: config.model, type: config.type } }),
  });
  if (!res.ok) throw new Error(`External API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.response || data.message || data.content || data.text || JSON.stringify(data);
}

// ── Webhook proxy ──
async function handleWebhook(message: string, config: AgentConfig, history: Message[]): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.customHeaders) {
    try { Object.assign(headers, JSON.parse(config.customHeaders)); } catch { /* ignore */ }
  }

  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ event: "chat_message", message, history, agent: { type: config.type, model: config.model } }),
  });
  if (!res.ok) throw new Error(`Webhook error ${res.status}: ${await res.text()}`);
  try {
    const data = await res.json();
    return data.response || data.message || data.content || data.text || JSON.stringify(data);
  } catch {
    return "Webhook received successfully.";
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are a UI layout assistant for a visual drag-and-drop builder. When asked to create UI, respond ONLY with a JSON array inside a \`\`\`json code block. No other text before or after.

STRICT FORMAT — every block MUST use this exact structure:
{ "type": "...", "props": { ... }, "children": [ ... ] }

Props MUST be inside a "props" object. NEVER put props at the top level.

Valid block types: container, text, heading, button, image, input, card, flex-row, grid, divider, spacer, badge, avatar, link
Container types (can have children): container, card, flex-row, grid

Available props:
- text: string content (for heading, text, button, badge, link)
- level: 1|2|3|4 (for heading)
- placeholder: string (for input)
- src, alt: string (for image, avatar)
- href: string (for link)
- variant: "primary"|"ghost"|"default" (for button)
- padding, bgColor, textColor, borderRadius, width, height, fontSize: CSS values
- cols: number (for grid), gap: number (for flex-row, grid)
- justify: "start"|"center"|"end"|"between", align: "left"|"center"|"right"

Example:
\`\`\`json
[{"type":"card","props":{"padding":"24px","borderRadius":"16px"},"children":[{"type":"heading","props":{"text":"Welcome","level":2}},{"type":"text","props":{"text":"Get started today"}},{"type":"button","props":{"text":"Get Started","variant":"primary"}}]}]
\`\`\`

CRITICAL: Always nest props inside "props": {}. Always wrap output in \`\`\`json blocks.`;

export async function POST(req: NextRequest) {
  try {
    const { message, config, history = [] } = await req.json() as {
      message: string;
      config: AgentConfig;
      history: Message[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." });
    }

    let response: string;

    // Route to appropriate handler
    if (config.connectionMode === "external-api" && config.externalEndpoint) {
      response = await handleExternalApi(message, config, history);
    } else if (config.connectionMode === "webhook" && config.webhookUrl) {
      response = await handleWebhook(message, config, history);
    } else {
      // Built-in mode — requires API key
      if (!config.apiKey) {
        return NextResponse.json({
          error: "No API key configured. Add your OpenAI or Anthropic API key in the Agent panel to get started.",
        });
      }

      switch (config.type) {
        case "langchain":
          response = await handleLangChain(message, config, history);
          break;
        case "langgraph":
          response = await handleLangGraph(message, config, history);
          break;
        case "deepagents":
          response = await handleDeepAgents(message, config, history);
          break;
        default:
          response = await handleLangChain(message, config, history);
      }
    }

    return NextResponse.json({ response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: `Agent error: ${message}` });
  }
}
