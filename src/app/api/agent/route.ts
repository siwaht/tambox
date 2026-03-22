import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, config, history } = await req.json();

    // External API mode — proxy to user's endpoint
    if (config.connectionMode === "external-api" && config.externalEndpoint) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.customHeaders) {
        try {
          Object.assign(headers, JSON.parse(config.customHeaders));
        } catch { /* ignore bad headers */ }
      }
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const apiRes = await fetch(config.externalEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ message, history, config: { model: config.model, type: config.type } }),
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        return NextResponse.json({ error: `External API error (${apiRes.status}): ${err}` });
      }

      const data = await apiRes.json();
      // Support both { response: "..." } and { message: "..." } and { content: "..." }
      const response = data.response || data.message || data.content || data.text || JSON.stringify(data);
      return NextResponse.json({ response });
    }

    // Webhook mode — fire and forget with response
    if (config.connectionMode === "webhook" && config.webhookUrl) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.customHeaders) {
        try {
          Object.assign(headers, JSON.parse(config.customHeaders));
        } catch { /* ignore */ }
      }

      const apiRes = await fetch(config.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event: "chat_message",
          message,
          history,
          agent: { type: config.type, model: config.model },
        }),
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        return NextResponse.json({ error: `Webhook error (${apiRes.status}): ${err}` });
      }

      try {
        const data = await apiRes.json();
        const response = data.response || data.message || data.content || data.text || JSON.stringify(data);
        return NextResponse.json({ response });
      } catch {
        return NextResponse.json({ response: "Webhook received successfully (no response body)." });
      }
    }

    // Built-in mode
    if (!config.apiKey) {
      return NextResponse.json({ error: "No API key configured. Set your API key in the Agent panel." });
    }

    const messages = [
      { role: "system" as const, content: config.systemPrompt || "You are a helpful assistant." },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    let response: string;

    const isAnthropic = config.model?.includes("claude");

    if (isAnthropic) {
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model || "claude-sonnet-4-6",
          max_tokens: 2048,
          system: config.systemPrompt || "You are a helpful assistant.",
          messages: (history || [])
            .concat([{ role: "user", content: message }])
            .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        return NextResponse.json({ error: `Anthropic API error: ${err}` });
      }

      const data = await apiRes.json();
      response = data.content?.[0]?.text || "No response from model.";
    } else {
      const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || "gpt-4o",
          messages,
          max_tokens: 2048,
        }),
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        return NextResponse.json({ error: `OpenAI API error: ${err}` });
      }

      const data = await apiRes.json();
      response = data.choices?.[0]?.message?.content || "No response from model.";
    }

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({
      error: `Server error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}
