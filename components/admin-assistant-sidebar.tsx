'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  AlertTriangle,
  Package,
  Clock,
  TrendingUp,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  BookOpen,
  BookmarkCheck,
} from 'lucide-react';

export interface ToolExecutionStep {
  toolName: string;
  arguments: Record<string, unknown>;
  output: unknown;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolSteps?: ToolExecutionStep[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  {
    label: 'Return Policy (RAG)',
    icon: BookOpen,
    prompt: 'What is our 30-day return policy and return shipping fee?',
  },
  {
    label: 'Shipping Rates (RAG)',
    icon: BookOpen,
    prompt: 'What are our domestic shipping options, transit times, and rates?',
  },
  {
    label: 'Linen Care (RAG)',
    icon: Package,
    prompt: 'How should a customer wash and care for the AirBreeze Linen Shirt?',
  },
  {
    label: 'Low Stock Alert',
    icon: AlertTriangle,
    prompt: 'How many items are low in stock or out of stock right now?',
  },
  {
    label: 'Store KPIs',
    icon: TrendingUp,
    prompt: 'Give me a summary of total revenue and order status breakdown.',
  },
];

interface AdminAssistantSidebarProps {
  onDataMutated?: () => void;
}

export function AdminAssistantSidebar({ onDataMutated }: AdminAssistantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm **Roco**, your operations and knowledge assistant. I am connected to our live PostgreSQL database (products & orders) and the official **RAG Knowledge Base** (shipping, returns, warranty, and policies). Ask me anything about stock, orders, or store policies!",
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const handleSend = async (userPrompt?: string) => {
    const promptToSend = (userPrompt || input).trim();
    if (!promptToSend || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI assistant response.');
      }

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        toolSteps: data.toolSteps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onDataMutated?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Connection Error:** ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "Chat cleared. What operational metrics can I check for you in PostgreSQL?",
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <>
      {/* FLOATING TOGGLE BUTTON (Docked bottom-right) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-[#173c32] px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:bg-[#235345] hover:scale-105 active:scale-95 ${
          isOpen ? 'hidden' : 'flex'
        }`}
        aria-label="Open Roco AI Assistant"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dfff62] text-[#173c32]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span>Ask Roco</span>
      </button>

      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* SLIDE-OVER DRAWER */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#dcdcd5] bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[480px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* DRAWER HEADER */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7e3] bg-[#f8f9f6] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173c32] text-white shadow-sm">
              <Sparkles className="h-4 w-4 text-[#dfff62]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1f312b]">Roco Admin Copilot</h2>
                <span className="inline-flex items-center rounded-full bg-[#e5f5e9] px-2 py-0.5 text-[10px] font-semibold text-[#287245] border border-[#c4e9cc]">
                  Postgres Live
                </span>
              </div>
              <p className="text-[11px] text-[#718079]">Autonomous E-Commerce Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Reset conversation"
              className="rounded-lg p-1.5 text-[#718079] hover:bg-[#eaece8] hover:text-[#1f312b] transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-[#718079] hover:bg-[#eaece8] hover:text-[#1f312b] transition"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MESSAGE HISTORY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#fbfbf9]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#173c32] text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-[#2a3832] rounded-tl-none border border-[#dfe3dd] shadow-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-2 text-[#2a3832]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h3 className="text-sm font-bold text-[#1f312b] mt-3 mb-1.5 first:mt-0">
                              {children}
                            </h3>
                          ),
                          h2: ({ children }) => (
                            <h3 className="text-sm font-bold text-[#1f312b] mt-3 mb-1.5 first:mt-0">
                              {children}
                            </h3>
                          ),
                          h3: ({ children }) => (
                            <h4 className="text-xs font-bold text-[#1f312b] mt-2.5 mb-1 first:mt-0">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1 mb-2.5 text-xs">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 space-y-1.5 mb-2.5 text-xs">{children}</ol>
                          ),
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-[#1f312b]">{children}</strong>
                          ),
                          a: ({ href, children }) => {
                            const isProductLink = href && href.startsWith('/products/');
                            if (isProductLink) {
                              return (
                                <Link
                                  href={href}
                                  onClick={() => setIsOpen(false)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef4f0] px-2 py-0.5 font-bold text-[#173c32] hover:bg-[#dfebe3] hover:text-[#287245] shadow-2xs border border-[#cde0d5] transition my-0.5"
                                >
                                  <span>{children}</span>
                                  <span className="text-[11px] text-[#287245]">↗</span>
                                </Link>
                              );
                            }
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#173c32] underline hover:text-[#287245]"
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* LIVE DATABASE AUDIT CARDS */}
                  {msg.toolSteps && msg.toolSteps.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-[#e8ece6] pt-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#63756d] flex items-center gap-1.5">
                        <Database className="h-3 w-3 text-[#3d594f]" /> Live Query Executed:
                      </p>
                      {msg.toolSteps.map((step, idx) => {
                        const stepKey = `${msg.id}-step-${idx}`;
                        const isExpanded = !!expandedSteps[stepKey];
                        const isRAG = step.toolName === 'search_knowledge_base';

                        return (
                          <div
                            key={stepKey}
                            className={`rounded-lg border p-2 text-xs transition ${
                              isRAG
                                ? 'border-[#b6d8c6] bg-[#f2f8f4]'
                                : 'border-[#d6ded8] bg-[#f8faf8]'
                            }`}
                          >
                            <button
                              onClick={() => toggleStep(stepKey)}
                              className="flex w-full items-center justify-between font-mono text-[11px] font-semibold text-[#173c32] hover:text-[#287245]"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                {isRAG ? (
                                  <BookOpen className="h-3.5 w-3.5 text-[#216d4e] shrink-0" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#287245] shrink-0" />
                                )}
                                <span>{step.toolName}()</span>
                                {isRAG && (
                                  <span className="rounded bg-[#dcf1e4] px-1.5 py-0.2 text-[9px] font-bold text-[#1a5d40]">
                                    RAG Semantic Retrieval
                                  </span>
                                )}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-[#73877e]" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-[#73877e]" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-1 rounded-md bg-[#132822] p-2.5 font-mono text-[10px] text-[#e0eade] overflow-x-auto">
                                <p className="text-[#a4bcaf] font-semibold">// Parameters:</p>
                                <pre>{JSON.stringify(step.arguments, null, 2)}</pre>
                                <p className="text-[#a4bcaf] font-semibold mt-1">
                                  {isRAG ? '// Retrieved Knowledge Excerpts & Citations:' : '// Database Output:'}
                                </p>
                                <pre>{JSON.stringify(step.output, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="mt-1 px-1 text-[10px] text-[#8e9a94]">{msg.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 rounded-xl bg-white border border-[#dfe3dd] p-3 text-xs text-[#536b61] shadow-xs w-fit">
              <Loader2 className="h-4 w-4 animate-spin text-[#173c32]" />
              <span>Querying PostgreSQL database & reasoning...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK PROMPTS */}
        <div className="border-t border-[#e5e7e3] bg-[#f8f9f6] px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#82928a] mb-1.5">
            Operational Quick Prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleSend(item.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-full border border-[#d6ded8] bg-white px-2.5 py-1 text-xs font-medium text-[#2d4138] shadow-2xs hover:border-[#b8c5bc] hover:bg-[#f1f4f0] disabled:opacity-50 transition"
                >
                  <Icon className="h-3 w-3 text-[#536b61]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* INPUT COMPOSER */}
        <div className="border-t border-[#e5e7e3] p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Roco about orders, inventory, or stock..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-[#d6ded8] bg-[#fbfbf9] px-3.5 py-2.5 text-xs sm:text-sm text-[#1f312b] outline-none placeholder:text-[#96a39d] focus:border-[#173c32] focus:bg-white focus:ring-2 focus:ring-[#173c32]/20 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173c32] text-white hover:bg-[#235345] disabled:cursor-not-allowed disabled:bg-[#d5ded7] transition"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-[#8e9a94]">
            <span>Enter to send · Shift+Enter for newline</span>
            <span>OpenAI + PostgreSQL</span>
          </div>
        </div>
      </aside>
    </>
  );
}
