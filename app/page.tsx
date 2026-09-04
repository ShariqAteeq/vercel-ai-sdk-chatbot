"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isDynamicToolUIPart,
  type DynamicToolUIPart,
} from "ai";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MarkdownMessage } from "./components/markdown-message";

const suggestions = [
  {
    label: "Monthly overview",
    prompt: "How much have we raised across all campaigns this month?",
  },
  {
    label: "Campaign performance",
    prompt: "Show me Clean Water Fund donations for this year.",
  },
  {
    label: "Today's giving",
    prompt: "What is today's average donation across all campaigns?",
  },
];

const chatApiUrl =
  process.env.NEXT_PUBLIC_CHAT_API_URL?.trim() || "http://localhost:3001/chat";

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-[#dfff62] text-[#152c26] ${small ? "h-8 w-8" : "h-10 w-10"}`}
    >
      <svg
        aria-hidden="true"
        className={small ? "h-4 w-4" : "h-5 w-5"}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M7.2 5.25c2.14 0 3.88 1.7 3.88 3.8 0 4.3-5.08 6.58-5.08 9.7-2.64-1.77-4.5-4.4-4.5-7.37 0-3.38 2.55-6.13 5.7-6.13Z"
          fill="currentColor"
        />
        <path
          d="M16.8 5.25c-2.14 0-3.88 1.7-3.88 3.8 0 4.3 5.08 6.58 5.08 9.7 2.64-1.77 4.5-4.4 4.5-7.37 0-3.38-2.55-6.13-5.7-6.13Z"
          fill="currentColor"
          opacity=".72"
        />
      </svg>
    </div>
  );
}

function DatabaseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5.5" rx="7.25" ry="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.75 5.5v6.5c0 1.8 3.25 3.25 7.25 3.25s7.25-1.45 7.25-3.25V5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.75 12v6.5c0 1.8 3.25 3.25 7.25 3.25s7.25-1.45 7.25-3.25V12" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h13M13 7l5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function humanize(value: unknown): string {
  if (typeof value !== "string") return "—";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value: unknown): string {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function DonationToolCard({ part }: { part: DynamicToolUIPart }) {
  const input = isRecord(part.input) ? part.input : {};
  const hasOutput = part.state === "output-available";
  const hasError = part.state === "output-error";
  const output = hasOutput && isRecord(part.output) ? part.output : undefined;
  const data = output && isRecord(output.data) ? output.data : undefined;
  const totals = data && isRecord(data.totals) ? data.totals : undefined;
  const trend = data && isRecord(data.trend) ? data.trend : undefined;

  return (
    <div className="my-3 overflow-hidden rounded-[1.2rem] border border-[#d9ded9] bg-white shadow-[0_12px_40px_rgba(31,49,43,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e9e5] bg-[#f7f8f5] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e7eee9] text-[#315a4d]">
            <span className="h-4 w-4"><DatabaseIcon /></span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[0.72rem] font-semibold text-[#263b35]">
              {part.toolName}
            </p>
            <p className="mt-0.5 font-mono text-[0.62rem] text-[#849089]">
              GET /api/donations/totals
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] ${
            hasError
              ? "bg-[#fff0ec] text-[#b4523c]"
              : hasOutput
                ? "bg-[#e5f5e9] text-[#287245]"
                : "bg-[#fff4d7] text-[#90681d]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasError
                ? "bg-[#d36950]"
                : hasOutput
                  ? "bg-[#3c9e60]"
                  : "animate-pulse bg-[#d6a640]"
            }`}
          />
          {hasError ? "Failed" : hasOutput ? "200 OK" : "Calling API"}
        </div>
      </div>

      <div className="px-4 py-3.5">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.72rem]">
          <p className="text-[#89908c]">
            Campaign <span className="ml-1 font-semibold text-[#34463f]">{humanize(input.campaign)}</span>
          </p>
          <p className="text-[#89908c]">
            Period <span className="ml-1 font-semibold text-[#34463f]">{humanize(input.period)}</span>
          </p>
        </div>

        {hasError && (
          <p className="mt-3 rounded-xl bg-[#fff5f2] px-3 py-2.5 text-xs text-[#984c3a]">
            {part.errorText}
          </p>
        )}

        {!hasOutput && !hasError && (
          <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Loading donation totals">
            <span className="h-11 animate-pulse rounded-lg bg-[#edf0ec]" />
            <span className="h-11 animate-pulse rounded-lg bg-[#edf0ec] [animation-delay:120ms]" />
            <span className="h-11 animate-pulse rounded-lg bg-[#edf0ec] [animation-delay:240ms]" />
          </div>
        )}

        {hasOutput && totals && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="col-span-2 rounded-xl bg-[#173c32] px-3.5 py-3 text-white sm:col-span-1">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.11em] text-[#a8c3ba]">Raised</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{formatCurrency(totals.amount)}</p>
            </div>
            <div className="rounded-xl bg-[#f1f3ef] px-3.5 py-3">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.11em] text-[#8a928d]">Gifts</p>
              <p className="mt-1 text-base font-semibold text-[#243a33]">{typeof totals.donationCount === "number" ? totals.donationCount.toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-xl bg-[#f1f3ef] px-3.5 py-3">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.11em] text-[#8a928d]">Average</p>
              <p className="mt-1 text-base font-semibold text-[#243a33]">{formatCurrency(totals.averageDonation)}</p>
            </div>
            <div className="rounded-xl bg-[#eff7d7] px-3.5 py-3">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.11em] text-[#718044]">Trend</p>
              <p className="mt-1 text-base font-semibold text-[#35522d]">{typeof trend?.percentage === "number" ? `+${trend.percentage}%` : "—"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: chatApiUrl }),
    [],
  );
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    setMessages,
  } = useChat({ transport });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const submissionLockRef = useRef(false);

  const isBusy = status === "submitted" || status === "streaming";
  const lastMessageSignal =
    messages
      .at(-1)
      ?.parts.map((part) =>
        part.type === "text"
          ? part.text
          : isDynamicToolUIPart(part)
            ? `${part.toolCallId}:${part.state}`
            : part.type,
      )
      .join("") ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
      block: "end",
    });
  }, [lastMessageSignal, messages.length, status]);

  useEffect(() => {
    if (status === "ready" || status === "error") {
      submissionLockRef.current = false;
      inputRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [input]);

  function submitMessage(text: string) {
    const content = text.trim();
    if (!content || isBusy || submissionLockRef.current) return;

    submissionLockRef.current = true;
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
    void sendMessage({ text: content }).catch(() => {
      submissionLockRef.current = false;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  function startNewChat() {
    if (isBusy) stop();
    setMessages([]);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <main className="app-grid min-h-dvh bg-[#eeeee8] p-2.5 text-[#1d2925] sm:p-4 lg:h-dvh lg:overflow-hidden">
      <section className="mx-auto grid min-h-[calc(100dvh-1.25rem)] w-full max-w-[1440px] overflow-hidden rounded-[1.5rem] border border-black/[0.08] bg-[#fbfbf7] shadow-[0_24px_80px_rgba(28,43,37,0.12)] lg:h-[calc(100dvh-2rem)] lg:min-h-[42rem] lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden bg-[#173c32] px-6 py-6 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-24 top-36 h-56 w-56 rounded-full border-[44px] border-[#dfff62]/[0.07]" />
          <div className="relative flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-[0.95rem] font-semibold tracking-[-0.01em]">CommonGood</p>
              <p className="mt-0.5 text-[0.66rem] uppercase tracking-[0.16em] text-[#9fb6ae]">Giving intelligence</p>
            </div>
          </div>

          <div className="relative mt-12">
            <span className="rounded-full border border-[#dfff62]/30 bg-[#dfff62]/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#dfff62]">Agent workflow</span>
            <h1 className="mt-4 text-[1.72rem] font-semibold leading-[1.12] tracking-[-0.045em]">Ask your data.<br />Get the answer.</h1>
            <p className="mt-3 text-[0.78rem] leading-5 text-[#abc0b9]">The model decides when it needs live data, calls your backend, then explains the result.</p>
          </div>

          <ol className="relative mt-9 space-y-1">
            {[
              ["01", "Question received"],
              ["02", "Tool selected by model"],
              ["03", "Backend API called"],
              ["04", "Grounded answer streamed"],
            ].map(([number, label], index) => (
              <li className="group flex items-center gap-3" key={number}>
                <div className="flex flex-col items-center">
                  <span className={`grid h-7 w-7 place-items-center rounded-full border text-[0.58rem] font-bold ${index === 2 ? "border-[#dfff62] bg-[#dfff62] text-[#173c32]" : "border-white/20 text-[#94aaa2]"}`}>{number}</span>
                  {index < 3 && <span className="h-5 w-px bg-white/12" />}
                </div>
                <span className={`-mt-5 text-[0.72rem] ${index === 2 ? "font-semibold text-white" : "text-[#a8bbb4]"}`}>{label}</span>
              </li>
            ))}
          </ol>

          <div className="relative mt-auto rounded-[1.1rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#91aaa1]">Available tool</span>
              <span className="flex items-center gap-1.5 text-[0.62rem] text-[#dfff62]"><span className="h-1.5 w-1.5 rounded-full bg-[#dfff62]" />Ready</span>
            </div>
            <p className="mt-3 font-mono text-[0.68rem] text-white">get_donation_totals</p>
            <p className="mt-1.5 break-all font-mono text-[0.58rem] leading-4 text-[#8fa79f]">GET /api/donations/totals</p>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          <header className="flex h-[4.7rem] shrink-0 items-center justify-between border-b border-[#e5e6e0] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden"><BrandMark small /></div>
              <div>
                <p className="text-sm font-semibold tracking-[-0.015em] text-[#1f312b]">Giving Assistant</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[0.66rem] text-[#87918c]">
                  <span className={`h-1.5 w-1.5 rounded-full ${status === "error" ? "bg-[#d66d55]" : "bg-[#4da66b]"}`} />
                  {status === "submitted" ? "Planning" : status === "streaming" ? "Working" : status === "error" ? "Connection issue" : "Connected to donation API"}
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded-full border border-[#dfe2dc] bg-white px-3 py-2 text-[0.7rem] font-semibold text-[#53605b] shadow-sm transition hover:border-[#cbd1ca] hover:text-[#20352e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f50] disabled:opacity-50"
              disabled={messages.length === 0 && !isBusy}
              onClick={startNewChat}
              type="button"
            >
              <span className="h-3.5 w-3.5"><PlusIcon /></span>
              New chat
            </button>
          </header>

          <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto flex min-h-full w-full max-w-[850px] flex-col px-4 py-7 sm:px-8 sm:py-10">
              {messages.length === 0 ? (
                <div className="my-auto py-4 sm:py-8">
                  <div className="max-w-2xl">
                    <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#587165]">
                      <span className="h-px w-6 bg-[#759084]" />
                      Ask your donation ledger
                    </p>
                    <h2 className="mt-5 max-w-[660px] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#19362d] sm:text-[3.45rem]">
                      Fundraising answers,
                      <span className="block text-[#779166]">without the digging.</span>
                    </h2>
                    <p className="mt-5 max-w-xl text-[0.88rem] leading-6 text-[#718079] sm:text-[0.94rem]">
                      Ask in plain English. The agent will call your backend when it needs exact figures, then turn the response into a clear answer.
                    </p>
                  </div>

                  <div className="mt-9 grid gap-2.5 sm:grid-cols-3">
                    {suggestions.map((suggestion, index) => (
                      <button
                        className="group flex min-h-[7.25rem] flex-col justify-between rounded-[1.05rem] border border-[#dfe2dc] bg-white p-4 text-left shadow-[0_5px_20px_rgba(32,52,45,0.045)] transition hover:-translate-y-0.5 hover:border-[#bac8bc] hover:shadow-[0_10px_28px_rgba(32,52,45,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f50] disabled:pointer-events-none disabled:opacity-50"
                        disabled={isBusy}
                        key={suggestion.label}
                        onClick={() => submitMessage(suggestion.prompt)}
                        type="button"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#8a958f]">0{index + 1}</span>
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f0f2ed] text-[#557064] transition group-hover:bg-[#dfff62] group-hover:text-[#173c32]"><span className="h-3 w-3"><ArrowIcon /></span></span>
                        </div>
                        <span className="mt-4 text-[0.76rem] font-medium leading-5 text-[#354840]">{suggestion.prompt}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.64rem] text-[#929a96]">
                    <span><b className="mr-1 text-[#4d6259]">1</b> server tool</span>
                    <span><b className="mr-1 text-[#4d6259]">3</b> campaigns</span>
                    <span><b className="mr-1 text-[#4d6259]">5</b> reporting periods</span>
                    <span className="rounded-full bg-[#edf0e9] px-2 py-1 font-semibold text-[#64746d]">Simulated ledger data</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {messages.map((message, messageIndex) => {
                    const isUser = message.role === "user";
                    const isLastAssistant = !isUser && messageIndex === messages.length - 1;

                    return (
                      <article className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`} key={message.id}>
                        {!isUser && (
                          <div className="mt-0.5"><BrandMark small /></div>
                        )}
                        <div className={isUser ? "max-w-[85%] rounded-[1.15rem] rounded-br-[0.35rem] bg-[#173c32] px-4 py-3 text-[0.88rem] leading-6 text-white shadow-sm sm:max-w-[72%]" : "min-w-0 max-w-[92%] flex-1 sm:max-w-[86%]"}>
                          {!isUser && (
                            <div className="mb-2 flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.11em] text-[#73837b]">
                              Giving Assistant
                              {isLastAssistant && status === "streaming" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4da66b]" />}
                            </div>
                          )}
                          {message.parts.map((part, partIndex) => {
                            if (part.type === "text") {
                              if (!part.text) return null;
                              return isUser ? (
                                <p className="whitespace-pre-wrap break-words" key={partIndex}>{part.text}</p>
                              ) : (
                                <div className="break-words text-[0.9rem] leading-7 text-[#35443e]" key={partIndex}>
                                  <MarkdownMessage>{part.text}</MarkdownMessage>
                                </div>
                              );
                            }

                            if (isDynamicToolUIPart(part)) {
                              return <DonationToolCard key={part.toolCallId} part={part} />;
                            }

                            return null;
                          })}
                        </div>
                      </article>
                    );
                  })}

                  {status === "submitted" && (
                    <div className="flex items-center gap-3.5 text-sm text-[#75827c]">
                      <BrandMark small />
                      <div className="flex items-center gap-3 rounded-xl border border-[#e1e4df] bg-white px-3.5 py-2.5 shadow-sm">
                        <span className="flex gap-1" aria-label="Agent is deciding whether to call a tool">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6d8b7f] [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6d8b7f] [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6d8b7f]" />
                        </span>
                        <span className="text-xs font-medium">Deciding whether a tool is needed…</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-7 flex items-start justify-between gap-4 rounded-2xl border border-[#efcfc6] bg-[#fff6f2] px-4 py-3 text-sm text-[#884c3e]" role="alert">
                  <div>
                    <p className="font-semibold">The agent could not finish that request.</p>
                    <p className="mt-1 text-xs leading-5 text-[#a26859]">Make sure the NestJS API is running and OPENAI_API_KEY is configured.</p>
                  </div>
                  <button className="shrink-0 rounded-lg border border-[#e7c4ba] px-2.5 py-1 text-xs font-semibold transition hover:bg-[#f9e8e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c604e]" onClick={() => void regenerate()} type="button">Retry</button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-[#e8e9e4] bg-[#f7f7f2]/95 px-4 pb-3 pt-3 backdrop-blur sm:px-6 sm:pb-5 lg:px-8">
            <form className="mx-auto w-full max-w-[850px]" onSubmit={handleSubmit}>
              <div className="flex items-end gap-2 rounded-[1.2rem] border border-[#d6dad4] bg-white p-2 shadow-[0_8px_28px_rgba(32,49,43,0.07)] transition focus-within:border-[#7e9a8e] focus-within:ring-4 focus-within:ring-[#dfe8df]/70">
                <label className="sr-only" htmlFor="chat-input">Ask about donation data</label>
                <textarea
                  autoFocus
                  className="max-h-[132px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.9rem] leading-6 text-[#263730] outline-none placeholder:text-[#9aa29e]"
                  id="chat-input"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about totals, campaigns, or giving trends…"
                  ref={inputRef}
                  rows={1}
                  value={input}
                />
                {isBusy ? (
                  <button aria-label="Stop generating" className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.8rem] bg-[#edf0ec] text-[#36544a] transition hover:bg-[#e2e7e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f50]" onClick={stop} type="button"><span className="h-4 w-4"><StopIcon /></span></button>
                ) : (
                  <button aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.8rem] bg-[#173c32] text-white shadow-sm transition hover:bg-[#225344] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f50] disabled:cursor-not-allowed disabled:bg-[#d9ddd8]" disabled={!input.trim()} type="submit"><span className="h-4.5 w-4.5"><ArrowIcon /></span></button>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between px-1 text-[0.62rem] text-[#969e9a]">
                <span>Enter to send · Shift + Enter for a new line</span>
                <span className="hidden items-center gap-1.5 sm:flex"><span aria-hidden="true">●</span> API key stays server-side</span>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
