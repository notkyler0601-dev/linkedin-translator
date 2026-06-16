import { buildSystem } from "./prompts.js";

const DEFAULT_MODEL = "@cf/openai/gpt-oss-120b";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/translate") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleTranslate(request, env);
    }

    // Everything else: serve the static UI from ./public
    return env.ASSETS.fetch(request);
  },
};

async function handleTranslate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { text, direction, buzzword, exaggeration, hashtags, emoji, nuclear } = body || {};
  if (!text || !String(text).trim()) {
    return json({ error: "No text provided" }, 400);
  }

  const model = env.MODEL || DEFAULT_MODEL;
  const isReasoner = /gpt-oss|qwen3|deepseek-r1|glm-4/i.test(model);

  let system = buildSystem({ direction, buzzword, exaggeration, hashtags, emoji, nuclear });
  // gpt-oss / harmony models read the reasoning level from the system prompt. Keep it
  // low: this is a quick creative rewrite, not an analytical task.
  if (isReasoner) system = `Reasoning: low\n\n${system}`;

  try {
    const upstream = await env.AI.run(model, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: String(text) },
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 1.0,
      seed: Math.floor(Math.random() * 1e9), // fresh result every Regenerate
    });

    // Normalize whatever streaming shape the model emits (plain Workers AI {response},
    // Responses-API typed deltas, or OpenAI chat chunks) into a single simple SSE the UI
    // understands, dropping any reasoning/analysis tokens along the way.
    const normalized = upstream.pipeThrough(normalizeStream());

    return new Response(normalized, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "x-accel-buffering": "no",
      },
    });
  } catch (err) {
    return json({ error: `Model error: ${err && err.message ? err.message : String(err)}` }, 500);
  }
}

// Pull the next answer-text fragment out of one parsed SSE event, or null to skip it
// (reasoning deltas, lifecycle events, usage rows, etc.).
function extractToken(obj) {
  const type = typeof obj.type === "string" ? obj.type : "";
  if (type.includes("reasoning")) return null; // drop chain-of-thought

  // Plain Workers AI text-generation stream.
  if (typeof obj.response === "string") return obj.response;

  // Responses API: response.output_text.delta { delta: "..." }
  if (type.includes("output_text") && typeof obj.delta === "string") return obj.delta;
  if (type.endsWith(".delta") && typeof obj.delta === "string") return obj.delta;

  // OpenAI chat-completion chunk: choices[0].delta.content
  const choice = Array.isArray(obj.choices) ? obj.choices[0] : null;
  if (choice) {
    if (choice.delta && typeof choice.delta.content === "string") return choice.delta.content;
    if (typeof choice.text === "string") return choice.text;
  }
  return null;
}

function normalizeStream() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const emit = (controller, token) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: token })}\n\n`));
  };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith("data:")) continue; // ignore SSE "event:" lines, comments, blanks
        const payload = l.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let obj;
        try {
          obj = JSON.parse(payload);
        } catch {
          continue;
        }
        const token = extractToken(obj);
        if (token) emit(controller, token);
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
