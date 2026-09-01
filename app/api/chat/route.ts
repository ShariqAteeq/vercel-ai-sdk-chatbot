import { groq, type GroqLanguageModelOptions } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

export const maxDuration = 30;

type ChatRequest = {
  messages?: UIMessage[];
};

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 503 },
    );
  }

  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json(
      { error: "A messages array is required." },
      { status: 400 },
    );
  }

  const result = streamText({
    model: groq("qwen/qwen3.6-27b"),
    system:
      "You are a thoughtful, concise assistant. Give clear, practical answers in a warm, natural tone. Return only the user-facing answer; never include private analysis, chain-of-thought, or <think> tags.",
    messages: await convertToModelMessages(body.messages),
    providerOptions: {
      groq: {
        reasoningFormat: "hidden",
      } satisfies GroqLanguageModelOptions,
    },
  });

  const stream = toUIMessageStream({
    stream: result.stream,
    originalMessages: body.messages,
    onError(error) {
      console.error("Chat stream error:", error);
      return "I could not complete that response. Please try again.";
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
