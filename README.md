# Studio Assistant frontend

A responsive streaming chat interface built with Next.js App Router, TypeScript,
Tailwind CSS, and the Vercel AI SDK React package. The browser now talks directly
to the separate NestJS service in `../ai-chat-api`; OpenAI is never called from
the browser or from a Next.js route.

## Run locally

1. Start the NestJS backend first. Follow
   [`../ai-chat-api/README.md`](../ai-chat-api/README.md) and leave it running on
   `http://localhost:3001`.

2. Install frontend dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env.local`. The default is:

   ```dotenv
   NEXT_PUBLIC_CHAT_API_URL=http://localhost:3001/chat
   ```

4. Start Next.js:

   ```powershell
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_CHAT_API_URL` is intentionally visible in the browser. The secret
`OPENAI_API_KEY` belongs only in `ai-chat-api/.env`, never in this project.

## How streaming works

```text
page.tsx / useChat
       |  POST { id, messages, trigger, messageId }
       v
NestJS POST http://localhost:3001/chat
       |  OpenAI Chat Completions with stream: true
       v
OpenAI / gpt-4o-mini
       |  provider chunks -> UI-message SSE events
       v
DefaultChatTransport -> useChat -> live message rendering
```

`useChat` owns the browser conversation state and lifecycle (`submitted`,
`streaming`, `ready`, or `error`). `DefaultChatTransport` posts UI messages to
NestJS and parses the returned AI SDK UI-message stream. Each `text-delta` event
updates the assistant card immediately.

The interface keeps focus in the composer, auto-grows the text area,
auto-scrolls while streaming, supports Enter-to-send, exposes a stop control,
and shows retry/error states.
