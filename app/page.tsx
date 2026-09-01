"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
  "Explain streaming responses simply",
  "Draft a launch announcement",
  "Plan a focused work session",
];

function SparkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2.75c.57 4.92 3.33 7.68 8.25 8.25-4.92.57-7.68 3.33-8.25 8.25C11.43 14.33 8.67 11.57 3.75 11 8.67 10.43 11.43 7.67 12 2.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m7 11 5-5 5 5M12 6v12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
  } = useChat({ transport });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const submissionLockRef = useRef(false);

  const isBusy = status === "submitted" || status === "streaming";
  const lastMessageText =
    messages
      .at(-1)
      ?.parts.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
      block: "end",
    });
  }, [lastMessageText, messages.length, status]);

  useEffect(() => {
    if (status === "ready") {
      submissionLockRef.current = false;
      inputRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    if (status === "error") {
      submissionLockRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
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
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  return (
    <main className="relative flex h-dvh min-h-[36rem] overflow-hidden bg-[#f5f5f2] px-3 py-3 text-[#20201f] sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-[#dfede4] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-[#e8e0d6] blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-black/[0.07] bg-white/90 shadow-[0_24px_80px_rgba(35,42,37,0.12)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-[#e8e8e3] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f3d2f] text-[#d8f3df] shadow-sm">
              <SparkIcon />
            </div>
            <div>
              <h1 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#20201f]">
                Studio Assistant
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#74746d]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === "error" ? "bg-[#c96b56]" : "bg-[#58a876]"
                  }`}
                />
                {status === "submitted"
                  ? "Connecting"
                  : status === "streaming"
                    ? "Responding"
                    : status === "error"
                      ? "Needs attention"
                      : "Ready to help"}
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#e5e5df] bg-[#fafaf8] px-3 py-1.5 text-xs font-medium text-[#6d6d66] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#82ad8e]" />
            Groq · Qwen 3.6
          </div>
        </header>

        <div
          aria-live="polite"
          className="chat-scrollbar flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-7 sm:px-8 sm:py-10">
            {messages.length === 0 ? (
              <div className="m-auto flex w-full max-w-xl flex-col items-center py-8 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-[#dbe6de] bg-[#eff6f1] text-[#2f5e45] shadow-[0_8px_24px_rgba(48,83,61,0.08)]">
                  <SparkIcon className="h-7 w-7" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8a78]">
                  A fresh conversation
                </p>
                <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-[#252523] sm:text-4xl">
                  What can we think through together?
                </h2>
                <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-[#777770] sm:text-[0.95rem]">
                  Ask a question, shape an idea, or turn a rough thought into a
                  clear next step.
                </p>

                <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="rounded-2xl border border-[#e5e5df] bg-[#fbfbf9] px-4 py-3.5 text-left text-[0.8rem] leading-5 text-[#55554f] transition hover:-translate-y-0.5 hover:border-[#cfdcd2] hover:bg-[#f4f8f5] hover:text-[#2f5e45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e7252] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => submitMessage(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {messages.map((message, messageIndex) => {
                  const isUser = message.role === "user";
                  const textParts = message.parts.filter(
                    (part) => part.type === "text",
                  );
                  const messageText = textParts
                    .map((part) => part.text)
                    .join("");
                  const isLastAssistant =
                    !isUser && messageIndex === messages.length - 1;

                  return (
                    <article
                      key={message.id}
                      className={`flex gap-3 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f1eb] text-[#356249]">
                          <SparkIcon className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] text-[0.94rem] leading-7 sm:max-w-[80%] ${
                          isUser
                            ? "rounded-[1.25rem] rounded-br-md bg-[#233c30] px-4 py-2.5 text-[#f7faf8] shadow-sm"
                            : "rounded-[1.25rem] rounded-tl-md border border-[#dfe7e1] bg-[#f7faf8] px-4 py-3.5 text-[#303c34] shadow-[0_6px_20px_rgba(35,60,48,0.06)]"
                        }`}
                      >
                        {!isUser && (
                          <div className="mb-2.5 flex items-center justify-between gap-4 border-b border-[#e3eae5] pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#66806e]">
                            <span>Assistant response</span>
                            {isLastAssistant && status === "streaming" && (
                              <span className="flex items-center gap-1.5 normal-case tracking-normal text-[#779080]">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#58a876]" />
                                Streaming
                              </span>
                            )}
                          </div>
                        )}
                        {isUser ? (
                          <p className="whitespace-pre-wrap break-words">
                            {messageText}
                          </p>
                        ) : (
                          <div className="break-words">
                            <MarkdownMessage>{messageText}</MarkdownMessage>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}

                {status === "submitted" && (
                  <div className="flex items-center gap-3 text-sm text-[#76766f]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f1eb] text-[#356249]">
                      <SparkIcon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-[#dfe7e1] bg-[#f7faf8] px-4 py-3 shadow-[0_6px_20px_rgba(35,60,48,0.05)]">
                      <span
                        className="flex gap-1"
                        aria-label="Assistant is thinking"
                      >
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#789281] [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#789281] [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#789281]" />
                      </span>
                      <span className="font-medium text-[#617568]">
                        Thinking… preparing a response
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                className="mt-7 flex items-start justify-between gap-4 rounded-2xl border border-[#efd6cf] bg-[#fff7f4] px-4 py-3 text-sm text-[#875444]"
                role="alert"
              >
                <div>
                  <p className="font-medium">The response was interrupted.</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#a36c5b]">
                    Check your Groq API key and connection, then try again.
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-lg border border-[#e6c8bf] px-2.5 py-1 text-xs font-medium transition hover:bg-[#f9e9e3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c604e]"
                  onClick={() => void regenerate()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-[#ecece7] bg-[#fbfbf9]/90 px-4 pb-3 pt-4 sm:px-7 sm:pb-5">
          <form
            className="mx-auto w-full max-w-3xl"
            onSubmit={handleSubmit}
          >
            <div className="flex items-end gap-2 rounded-[1.35rem] border border-[#dcdcd5] bg-white p-2 shadow-[0_8px_28px_rgba(35,42,37,0.07)] transition focus-within:border-[#91aa99] focus-within:ring-4 focus-within:ring-[#dce9df]/70">
              <label className="sr-only" htmlFor="chat-input">
                Message Studio Assistant
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                autoFocus
                className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.95rem] leading-6 text-[#2e2e2b] outline-none placeholder:text-[#9a9a93]"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Studio Assistant..."
                rows={1}
                value={input}
              />

              {isBusy ? (
                <button
                  aria-label="Stop generating"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e9eee9] text-[#355441] transition hover:bg-[#dfe8e1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e7252]"
                  onClick={stop}
                  type="button"
                >
                  <span className="h-5 w-5">
                    <StopIcon />
                  </span>
                </button>
              ) : (
                <button
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#233c30] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#2e4d3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e7252] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#d7d9d5] disabled:shadow-none"
                  disabled={!input.trim()}
                  type="submit"
                >
                  <span className="h-5 w-5">
                    <ArrowIcon />
                  </span>
                </button>
              )}
            </div>
            <p className="mt-2.5 text-center text-[0.68rem] text-[#999991]">
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
