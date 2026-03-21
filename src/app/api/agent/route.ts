import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, config, history } = await req.json();

    if (!config.apiKey) {
      return NextResponse.json({ error: "No API key configured. Set your API key in the Agent panel." });
    }

    // Build messages array from history
    const messages = [
      { role: "system" as const, content: config.systemPrompt || "You are a helpful assistant." },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    let response: string;

    switch (config.type) {
      case "langchain":
      case "langgraph": {
        // Use OpenAI-compatible API (works for OpenAI, Azure, etc.)
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
          return NextResponse.json({ error: `API error: ${err}` });
        }

        const data = await apiRes.json();
        response = data.choices?.[0]?.message?.content || "No response from model.";
        break;
      }

      case "deepagents": {
        // DeepAgents uses Anthropic by default
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
                .map((m: { role: string; content: string }) => ({
                  role: m.role,
                  content: m.content,
                })),
            }),
          });

          if (!apiRes.ok) {
            const err = await apiRes.text();
            return NextResponse.json({ error: `Anthropic API error: ${err}` });
          }

          const data = await apiRes.json();
          response = data.content?.[0]?.text || "No response from model.";
        } else {
          // Fallback to OpenAI-compatible
          const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({ model: config.model || "gpt-4o", messages, max_tokens: 2048 }),
          });

          if (!apiRes.ok) {
            const err = await apiRes.text();
            return NextResponse.json({ error: `API error: ${err}` });
          }

          const data = await apiRes.json();
          response = data.choices?.[0]?.message?.content || "No response from model.";
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown agent type: ${config.type}` });
    }

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({
      error: `Server error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}
