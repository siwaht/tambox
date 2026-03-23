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
  // Enhanced config options
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: "auto" | "json" | "text";
  timeout?: number; // ms, default 30000
}

interface Message { role: "user" | "assistant"; content: string; }

interface AgentResponse {
  response?: string;
  error?: string;
  errorCode?: "NO_API_KEY" | "INVALID_CONFIG" | "PROVIDER_ERROR" | "TIMEOUT" | "PARSE_ERROR" | "UNKNOWN";
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  model?: string;
  latencyMs?: number;
}

// ── Fetch with timeout ──
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Parse custom headers safely ──
function parseHeaders(raw: string): Record<string, string> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch { /* ignore */ }
  return {};
}

// Build the effective system prompt: always use DEFAULT_SYSTEM_PROMPT, append user's custom prompt if provided
function buildSystemPrompt(userPrompt?: string): string {
  if (!userPrompt || userPrompt.trim() === "") return DEFAULT_SYSTEM_PROMPT;
  // If user provided a custom prompt, append it after the core instructions
  return `${DEFAULT_SYSTEM_PROMPT}\n\nAdditional instructions:\n${userPrompt.trim()}`;
}

// ── Shared helpers ──
function detectProvider(model: string): "anthropic" | "openai" {
  return model?.toLowerCase().includes("claude") ? "anthropic" : "openai";
}

function buildMessages(systemPrompt: string, history: Message[], message: string) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];
}

async function callAnthropic(
  messages: ReturnType<typeof buildMessages>,
  systemPrompt: string,
  config: AgentConfig,
  extraBody: Record<string, unknown> = {},
): Promise<{ text: string; usage?: AgentResponse["usage"] }> {
  const timeout = config.timeout || 30000;
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-6",
      max_tokens: config.maxTokens || 4096,
      ...(config.temperature != null ? { temperature: config.temperature } : {}),
      ...(config.topP != null ? { top_p: config.topP } : {}),
      system: systemPrompt,
      messages: messages.filter((m) => m.role !== "system"),
      ...extraBody,
    }),
  }, timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    if (res.status === 401) throw new Error("Invalid Anthropic API key. Check your key in the Agent panel.");
    if (res.status === 429) throw new Error("Rate limited by Anthropic. Wait a moment and try again.");
    if (res.status === 529) throw new Error("Anthropic is overloaded. Try again shortly.");
    throw new Error(`Anthropic error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const textContent = data.content?.find((c: { type: string }) => c.type === "text");
  return {
    text: textContent?.text || data.content?.[0]?.text || "No response from model.",
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
    } : undefined,
  };
}

async function callOpenAI(
  messages: ReturnType<typeof buildMessages>,
  config: AgentConfig,
  extraBody: Record<string, unknown> = {},
): Promise<{ text: string; usage?: AgentResponse["usage"] }> {
  const timeout = config.timeout || 30000;
  const isReasoningModel = config.model?.startsWith("o1") || config.model?.startsWith("o3");
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model || "gpt-4o",
      messages: isReasoningModel ? messages.filter((m) => m.role !== "system") : messages,
      max_tokens: config.maxTokens || 4096,
      ...(config.temperature != null && !isReasoningModel ? { temperature: config.temperature } : {}),
      ...(config.topP != null && !isReasoningModel ? { top_p: config.topP } : {}),
      ...extraBody,
    }),
  }, timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    if (res.status === 401) throw new Error("Invalid OpenAI API key. Check your key in the Agent panel.");
    if (res.status === 429) throw new Error("Rate limited by OpenAI. Wait a moment and try again.");
    if (res.status === 503) throw new Error("OpenAI is temporarily unavailable. Try again shortly.");
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "No response from model.",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// ── LangChain built-in handler ──
async function handleLangChain(message: string, config: AgentConfig, history: Message[]): Promise<{ text: string; usage?: AgentResponse["usage"] }> {
  const systemPrompt = buildSystemPrompt(config.systemPrompt);
  const messages = buildMessages(systemPrompt, history, message);

  if (detectProvider(config.model) === "anthropic") {
    return callAnthropic(messages, systemPrompt, config);
  }
  return callOpenAI(messages, config);
}

// ── LangGraph built-in handler ──
async function handleLangGraph(message: string, config: AgentConfig, history: Message[]): Promise<{ text: string; usage?: AgentResponse["usage"] }> {
  const graphSystemPrompt = `${buildSystemPrompt(config.systemPrompt)}

You are operating as a LangGraph stateful agent. You can reason in multiple steps:
1. PLAN: Analyze the request and plan the UI structure
2. GENERATE: Create the JSON block definitions
3. VALIDATE: Ensure all block types are valid

Always output your final JSON in a \`\`\`json code block.`;

  const messages = buildMessages(graphSystemPrompt, history, message);

  if (detectProvider(config.model) === "anthropic") {
    return callAnthropic(messages, graphSystemPrompt, config);
  }
  return callOpenAI(messages, config);
}

// ── DeepAgents built-in handler ──
async function handleDeepAgents(message: string, config: AgentConfig, history: Message[]): Promise<{ text: string; usage?: AgentResponse["usage"] }> {
  const deepSystemPrompt = `${buildSystemPrompt(config.systemPrompt)}

You are a DeepAgent with advanced reasoning capabilities. For UI generation:
- Think deeply about the user's intent and design goals
- Consider visual hierarchy, spacing, and component relationships
- Generate rich, detailed UI structures with proper nesting
- Always wrap your JSON output in \`\`\`json code blocks

Be thorough and create production-quality UI layouts.`;

  const messages = buildMessages(deepSystemPrompt, history, message);

  if (detectProvider(config.model) === "anthropic") {
    // Try extended thinking first, fall back gracefully
    try {
      return await callAnthropic(messages, deepSystemPrompt, {
        ...config,
        maxTokens: config.maxTokens || 8192,
      }, { thinking: { type: "enabled", budget_tokens: 2000 } });
    } catch {
      return callAnthropic(messages, deepSystemPrompt, config);
    }
  }

  return callOpenAI(messages, config);
}

// ── External API proxy ──
async function handleExternalApi(message: string, config: AgentConfig, history: Message[]): Promise<{ text: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...parseHeaders(config.customHeaders) };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  const timeout = config.timeout || 30000;
  const res = await fetchWithTimeout(config.externalEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history, config: { model: config.model, type: config.type } }),
  }, timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`External API returned ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return { text: data.response || data.message || data.content || data.text || JSON.stringify(data) };
}

// ── Webhook proxy ──
async function handleWebhook(message: string, config: AgentConfig, history: Message[]): Promise<{ text: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...parseHeaders(config.customHeaders) };

  const timeout = config.timeout || 30000;
  const res = await fetchWithTimeout(config.webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ event: "chat_message", message, history, agent: { type: config.type, model: config.model } }),
  }, timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Webhook returned ${res.status}: ${errText}`);
  }
  try {
    const data = await res.json();
    return { text: data.response || data.message || data.content || data.text || JSON.stringify(data) };
  } catch {
    return { text: "Webhook received successfully." };
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
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body.", errorCode: "PARSE_ERROR" } satisfies AgentResponse, { status: 400 });
    }

    const { message, config, history = [] } = body as {
      message: string;
      config: AgentConfig;
      history: Message[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required.", errorCode: "INVALID_CONFIG" } satisfies AgentResponse, { status: 400 });
    }

    if (!config?.type || !config?.connectionMode) {
      return NextResponse.json({ error: "Agent config with type and connectionMode is required.", errorCode: "INVALID_CONFIG" } satisfies AgentResponse, { status: 400 });
    }

    console.log(`[Agent] type=${config.type} mode=${config.connectionMode} model=${config.model} msg="${message.substring(0, 60)}..."`);

    let result: { text: string; usage?: AgentResponse["usage"] };

    // Route to appropriate handler
    if (config.connectionMode === "external-api") {
      if (!config.externalEndpoint) {
        return NextResponse.json({ error: "External API endpoint URL is required.", errorCode: "INVALID_CONFIG" } satisfies AgentResponse, { status: 400 });
      }
      result = await handleExternalApi(message, config, history);
    } else if (config.connectionMode === "webhook") {
      if (!config.webhookUrl) {
        return NextResponse.json({ error: "Webhook URL is required.", errorCode: "INVALID_CONFIG" } satisfies AgentResponse, { status: 400 });
      }
      result = await handleWebhook(message, config, history);
    } else {
      // Built-in mode — requires API key
      if (!config.apiKey) {
        return NextResponse.json({
          error: "No API key configured. Add your OpenAI or Anthropic API key in the Agent panel.",
          errorCode: "NO_API_KEY",
        } satisfies AgentResponse, { status: 400 });
      }

      switch (config.type) {
        case "langgraph":
          result = await handleLangGraph(message, config, history);
          break;
        case "deepagents":
          result = await handleDeepAgents(message, config, history);
          break;
        case "langchain":
        default:
          result = await handleLangChain(message, config, history);
      }
    }

    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      response: result.text,
      usage: result.usage,
      model: config.model,
      latencyMs,
    } satisfies AgentResponse);
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown server error";
    const isTimeout = message.includes("timed out");
    console.error("[Agent] Error:", message);
    return NextResponse.json({
      error: `Agent error: ${message}`,
      errorCode: isTimeout ? "TIMEOUT" : "PROVIDER_ERROR",
      latencyMs,
    } satisfies AgentResponse, { status: isTimeout ? 504 : 502 });
  }
}
