# Studio Assistant

A responsive, real-time chat interface built with Next.js App Router, TypeScript,
Tailwind CSS, and the Vercel AI SDK. Messages are streamed from Groq Cloud's
`qwen/qwen3.6-27b` model and rendered incrementally as each text chunk arrives.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and add a Groq API key:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Never expose `GROQ_API_KEY` in browser code or commit `.env.local`; the key is
read only by the server-side API route.

## How streaming works

```text
page.tsx / useChat
       │  POST UIMessage[]
       ▼
app/api/chat/route.ts
       │  convertToModelMessages → streamText
       ▼
Groq Cloud / qwen/qwen3.6-27b
       │  incremental stream parts
       ▼
UI message SSE stream → useChat → live message rendering
```

`useChat` owns the client conversation state and lifecycle (`submitted`,
`streaming`, `ready`, or `error`). `DefaultChatTransport` posts the current UI
messages to `/api/chat`, where the route converts them to model messages and
starts `streamText`. The response is returned as an SSE-compatible UI message
stream, so each text delta updates the final assistant message immediately.

The interface also keeps focus in the composer, auto-grows the text area,
auto-scrolls during streaming, supports Enter-to-send, exposes a stop control,
and shows retry/error states.

## Switching models or providers

Change the model in `app/api/chat/route.ts`:

```ts
model: groq("qwen/qwen3.6-27b")
```

To use another provider, install its AI SDK package, import its provider
function, and replace only the `model` value passed to `streamText`; the route's
streaming code and the client UI can remain unchanged.
