"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Wand2,
} from "lucide-react";
import { Message } from "@/lib/types";
import { getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";

interface ChatRefinementDrawerProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onLatexUpdated: (newLatex: string) => void;
}

const QUICK_PROMPTS = [
  "Trim and condense to strictly fit on one page",
  "Make all bullet points start with high-impact power verbs",
  "Emphasize RAG and agentic workflows in the project section",
  "Add more quantifiable metrics and business impact",
];

export default function ChatRefinementDrawer({
  applicationId,
  isOpen,
  onClose,
  onLatexUpdated,
}: ChatRefinementDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { requireGroqKey } = useAuth();

  useEffect(() => {
    if (isOpen && applicationId) {
      loadMessages();
    }
  }, [isOpen, applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const msgs = await getChatMessages(applicationId);
      setMessages(msgs);
    } catch (err) {
      console.warn("Failed to load chat messages:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    if (!requireGroqKey()) return;
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    setInput("");
    const userTempMsg: Message = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userTempMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage(applicationId, textToSend.trim());
      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: res.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.latex) {
        onLatexUpdated(res.latex);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `Error: ${err.message || "Failed to refine resume. Please check your Groq API key."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${
        isExpanded
          ? "w-[480px] h-[680px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
          : "w-[380px] h-[520px] max-w-[calc(100vw-2rem)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-white/10 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              Resume Refinement Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                Live
              </span>
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Iteratively tweak & rephrase your resume LaTeX
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span>Connecting to Resume Editor...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
              <Wand2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">
              Ask AI to refine your resume
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-[240px] mb-3">
              Directly request phrasing updates, length reductions, or skill reorganizations.
            </p>

            <div className="w-full space-y-1.5 text-left">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Suggested instructions
              </span>
              {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full p-2 text-left text-[11px] rounded-lg bg-zinc-50 hover:bg-orange-500/5 dark:bg-zinc-800/50 dark:hover:bg-orange-500/10 border border-zinc-200 dark:border-white/10 hover:border-orange-500/30 text-zinc-700 dark:text-zinc-300 transition"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role !== "user" && (
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[82%] text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/5"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center text-zinc-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span className="text-[11px]">Updating resume LaTeX...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="e.g. Shorten education, emphasize PyTorch..."
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition disabled:opacity-40 shrink-0 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
