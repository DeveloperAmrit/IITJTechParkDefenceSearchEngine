"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, Plus, Shield, Loader2, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  searchQuery,
  searchStream,
  SearchResult,
  ChatMessage,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import SourceCard from "@/components/SourceCard";
import SuggestedQueries from "@/components/SuggestedQueries";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  results?: SearchResult[];
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const messages = activeConversation?.messages || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Search",
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setInput("");
    inputRef.current?.focus();
  };

  const handleSubmit = async (queryText?: string) => {
    const query = queryText || input.trim();
    if (!query || isLoading) return;

    let convId = activeConversationId;

    // Create new conversation if none active
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: query.slice(0, 50),
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConversationId(convId);
    }

    // Add user message
    const userMessage: ConversationMessage = { role: "user", content: query };
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const updated = { ...c, messages: [...c.messages, userMessage] };
          // Update title if first message
          if (c.messages.length === 0) {
            updated.title = query.slice(0, 50) + (query.length > 50 ? "..." : "");
          }
          return updated;
        }
        return c;
      })
    );

    setInput("");
    setIsLoading(true);

    // Add placeholder assistant message
    const assistantMessage: ConversationMessage = {
      role: "assistant",
      content: "",
      results: [],
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, userMessage, assistantMessage].filter((m, i, arr) => 
              // Remove duplicate user messages
              i === arr.length - 1 || i === arr.length - 2 || m !== userMessage
            )}
          : c
      )
    );

    // Build chat history for context
    const chatHistory: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      // Try streaming first
      let streamedContent = "";
      let streamResults: SearchResult[] = [];
      let useStreaming = true;

      try {
        for await (const event of searchStream(query, chatHistory)) {
          if (event.type === "results") {
            streamResults = event.data;
          } else if (event.type === "chunk") {
            streamedContent += event.data;
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m, i) =>
                        i === c.messages.length - 1
                          ? {
                              ...m,
                              content: streamedContent,
                              results: streamResults as any,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : c
              )
            );
          } else if (event.type === "done") {
            break;
          }
        }
      } catch {
        // Fallback to non-streaming
        useStreaming = false;
      }

      if (!useStreaming) {
        const response = await searchQuery(query, chatHistory);
        streamedContent = response.answer;
        streamResults = response.results;
      }

      // Finalize the message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m, i) =>
                  i === c.messages.length - 1
                    ? {
                        ...m,
                        content: streamedContent,
                        results: streamResults as any,
                        isStreaming: false,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m, i) =>
                  i === c.messages.length - 1
                    ? {
                        ...m,
                        content: `⚠️ Error: ${errorMessage}\n\nMake sure the backend server is running on http://localhost:8000`,
                        isStreaming: false,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelect={setActiveConversationId}
        onNew={createNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="flex items-center gap-3 p-3 border-b border-chat-border/30">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-chat-hover rounded-lg transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          )}
          <button
            onClick={createNewConversation}
            className="p-2 hover:bg-chat-hover rounded-lg transition-colors"
            title="New search"
          >
            <Plus size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Shield size={18} className="text-chat-accent" />
            <h1 className="text-sm font-medium">
              Defence Research Search Engine
            </h1>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto"
        >
          {isEmptyState ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="max-w-2xl w-full text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-chat-accent/10 mb-6">
                  <Shield size={32} className="text-chat-accent" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  IIT Jodhpur Tech Park
                </h2>
                <h3 className="text-lg text-chat-text-secondary mb-6">
                  Defence Research Search Engine
                </h3>
                <p className="text-chat-text-secondary text-sm mb-8">
                  Search through professor research work, publications, and
                  defence projects. Ask in natural language — I&apos;ll find the
                  most relevant results.
                </p>
              </div>

              <SuggestedQueries onSelect={(q) => handleSubmit(q)} />

              {/* Input in empty state */}
              <div className="w-full max-w-3xl mt-6">
                <div className="relative bg-chat-input rounded-2xl border border-chat-border/50 focus-within:border-chat-border transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for professor research, publications, defence projects..."
                    className="w-full bg-transparent text-chat-text placeholder-chat-text-secondary px-4 py-3 pr-12 resize-none outline-none max-h-[200px] text-sm"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-chat-accent text-white disabled:opacity-30 disabled:bg-chat-text-secondary hover:bg-chat-accent/90 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-6 message-appear ${
                    message.role === "user" ? "flex justify-end" : ""
                  }`}
                >
                  {message.role === "user" ? (
                    <div className="bg-chat-user-bg rounded-2xl px-4 py-3 max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full">
                      {/* Source cards */}
                      {message.results && message.results.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Search size={14} className="text-chat-text-secondary" />
                            <span className="text-xs text-chat-text-secondary font-medium">
                              Sources
                            </span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {message.results.slice(0, 4).map((result, i) => (
                              <SourceCard key={i} result={result} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Answer */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-chat-accent/20 flex items-center justify-center mt-1">
                          <Shield size={14} className="text-chat-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`prose prose-sm max-w-none ${
                              message.isStreaming ? "typing-cursor" : ""
                            }`}
                          >
                            {message.content ? (
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            ) : (
                              <div className="flex items-center gap-2 text-chat-text-secondary">
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                                <span className="text-sm">Searching...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 rounded-full bg-chat-input border border-chat-border shadow-lg hover:bg-chat-hover transition-all"
          >
            <ChevronDown size={18} />
          </button>
        )}

        {/* Input bar (when not empty state) */}
        {!isEmptyState && (
          <div className="p-4 pt-2">
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-chat-input rounded-2xl border border-chat-border/50 focus-within:border-chat-border transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  className="w-full bg-transparent text-chat-text placeholder-chat-text-secondary px-4 py-3 pr-12 resize-none outline-none max-h-[200px] text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-chat-accent text-white disabled:opacity-30 disabled:bg-chat-text-secondary hover:bg-chat-accent/90 transition-all"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-chat-text-secondary mt-2">
                Searching through IIT Jodhpur Tech Park defence research database
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
