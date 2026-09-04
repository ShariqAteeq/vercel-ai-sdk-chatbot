# Giving Assistant frontend

A polished tool-calling chat built with Next.js App Router, React, Tailwind CSS,
and the Vercel AI SDK UI primitives. The browser talks to the separate NestJS
service in `../ai-chat-api`; OpenAI and the donation data endpoint are both
called server-side.

## Run locally

1. Start the backend by following [`../ai-chat-api/README.md`](../ai-chat-api/README.md).
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Start the app with `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

The frontend environment contains only the public chat URL:

```dotenv
NEXT_PUBLIC_CHAT_API_URL=http://localhost:3001/chat
```

Never put `OPENAI_API_KEY` in this project or in a `NEXT_PUBLIC_` variable.

## What the UI demonstrates

```text
User question
    |
    v
useChat + DefaultChatTransport
    |
    v
POST http://localhost:3001/chat
    |
    +-- tool-input-available  -> renders "Calling API"
    +-- tool-output-available -> renders returned donation metrics
    +-- text-delta            -> streams the grounded answer
```

Server-executed tools arrive as dynamic tool parts. `DonationToolCard` renders
the tool name, actual endpoint, validated arguments, execution state, and a
compact result summary. The UI also covers cancellation, retry, empty, loading,
streaming, and error states, with responsive desktop and mobile layouts.

The displayed ledger is intentionally simulated so the full agent workflow can
be tested without a database or third-party account.

## Verify

```powershell
npm run lint
npm run build
```
