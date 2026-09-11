"use client";

import { useEffect, useState, useRef } from "react";
import {
  Compass,
  Plus,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Loader2,
  Check,
  Copy,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  RoadmapSession,
  RoadmapSessionListItem,
  RoadmapMessage,
  createRoadmapSession,
  getRoadmapSessions,
  getRoadmapSession,
  sendRoadmapMessage,
  deleteRoadmapSession,
} from "@/lib/api/roadmap";
import { useModel } from "@/context/ModelContext";
import { useAuth } from "@/context/AuthContext";
import { stripAsterisks, formatDate } from "@/lib/utils";

const SAMPLE_JDS = [
  {
    title: "Senior AI Systems Engineer",
    company: "Scale AI / Anthropic",
    text: `Job Title: Senior AI Systems Engineer
Location: Remote / San Francisco
About the Role:
We are looking for a Senior AI Systems Engineer to architect and build our high-throughput LLM serving and retrieval infrastructure.

Responsibilities:
- Design distributed RAG pipelines capable of sub-150ms semantic search over 10M+ enterprise documents.
- Implement robust vector databases with hybrid BM25 lexical reranking.
- Optimize multi-tenant isolation, caching tiers with Redis, and asynchronous queue processing with Celery/Kafka.
- Build resilient agentic workflows with self-correction and guardrails.
- Ensure 99.9% uptime with telemetry tracing, structured logging, and automated eval benchmarks.

Qualifications:
- 3+ years experience building production software with Python, FastAPI, and TypeScript/Next.js.
- Strong knowledge of embedding models, chunking strategies, and token budget management.
- Hands-on experience with relational databases, Docker, and cloud deployments.`,
  },
  {
    title: "Backend Platform Engineer",
    company: "Stripe / Datadog",
    text: `Job Title: Backend Platform Engineer (Distributed Systems)
Location: Remote / New York
About the Role:
Our Core Infrastructure team powers payment and telemetry pipelines processing millions of events per minute.

Responsibilities:
- Build high-concurrency microservices with strict SLAs and fault tolerance.
- Implement idempotency keys, distributed locks, and event-driven architecture using Apache Kafka.
- Design database schemas with partitioning, connection pooling, and zero-downtime migrations.
- Develop rate-limiting algorithms (token bucket / sliding window) protecting core APIs from traffic spikes.

Qualifications:
- Strong CS fundamentals in concurrency, distributed systems, and ACID guarantees.
- Hands-on proficiency with relational databases, caching, Docker, and microservice architectures.`,
  },
  {
    title: "Staff Full-Stack Engineer",
    company: "Vercel / Linear",
    text: `Job Title: Staff Full-Stack Engineer
Location: Remote
About the Role:
We are seeking a Staff Engineer to lead the architecture of our real-time collaborative workspace.

Responsibilities:
- Architect snappy, offline-first web experiences with Next.js App Router, React Server Components, and Tailwind CSS.
- Build real-time streaming servers for responsive generative AI interactions.
- Implement end-to-end security, authentication, and high-performance API proxies.
- Drive engineering excellence, automated CI/CD pipelines, and high-performance frontend state management.`,
  },
];

const QUICK_FOLLOWUPS = [
  "How should I design the database schema for Project 1?",
  "What production failure edge cases must I handle?",
  "Give me a starter docker-compose setup for this stack",
  "How do I explain the architectural trade-offs in an interview?",
  "Write 3 ATS resume bullet points for this project",
];

export default function RoadmapPage() {
  const { selectedModel } = useModel();
  const { user, token, openAuthModal, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<RoadmapSessionListItem[]>([]);
  const [activeSession, setActiveSession] = useState<RoadmapSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingActive, setLoadingActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Analysis form state
  const [jdInput, setJdInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Follow-up chat input
  const [chatInput, setChatInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (token && user) {
        loadSessions();
      } else {
        setLoadingSessions(false);
        setSessions([]);
        setActiveSession(null);
      }
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, generating, sendingMessage]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      setError(null);
      const data = await getRoadmapSessions();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        selectSession(data[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load roadmap sessions:", err);
      setError(err.message || "Failed to load past roadmaps.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    try {
      setLoadingActive(true);
      setError(null);
      const session = await getRoadmapSession(sessionId);
      setActiveSession(session);
    } catch (err: any) {
      console.error("Failed to load session:", err);
      setError(err.message || "Failed to load roadmap details.");
    } finally {
      setLoadingActive(false);
    }
  };

  const handleCreateSession = async () => {
    if (!token || !user) {
      openAuthModal();
      return;
    }
    if (!jdInput.trim() || jdInput.trim().length < 10) {
      setError("Please paste a substantive Job Description (at least 10 characters).");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const newSession = await createRoadmapSession({
        jd_text: jdInput.trim(),
        title: titleInput.trim() || undefined,
      });

      setActiveSession(newSession);
      setJdInput("");
      setTitleInput("");
      const updated = await getRoadmapSessions();
      setSessions(updated);
    } catch (err: any) {
      console.error("Failed to generate roadmap:", err);
      setError(err.message || "Failed to analyze Job Description.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || !activeSession || sendingMessage) return;

    if (!token || !user) {
      openAuthModal();
      return;
    }

    setChatInput("");
    setSendingMessage(true);
    setError(null);

    const tempUserMsg: RoadmapMessage = {
      id: `temp_${Date.now()}`,
      session_id: activeSession.id,
      role: "user",
      content: stripAsterisks(text),
      provider: "user",
      created_at: new Date().toISOString(),
    };

    setActiveSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev
    );

    try {
      const assistantMsg = await sendRoadmapMessage(activeSession.id, text);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg],
            }
          : prev
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to get response from Roadmap Copilot.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this roadmap session and all chat history?")) {
      return;
    }

    try {
      await deleteRoadmapSession(sessionId);
      const filtered = sessions.filter((s) => s.id !== sessionId);
      setSessions(filtered);
      if (activeSession?.id === sessionId) {
        if (filtered.length > 0) {
          selectSession(filtered[0].id);
        } else {
          setActiveSession(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete session.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(stripAsterisks(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderCleanMessage = (content: string) => {
    const sanitized = stripAsterisks(content);
    const lines = sanitized.split("\n");

    return (
      <div className="space-y-3 leading-relaxed text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          const isHeading =
            /^(ROLE AND LEVEL OVERVIEW|VERIFIED MATCHES|CRITICAL SKILL|RECOMMENDED PROJECTS|30-DAY EXECUTION|PROJECT TITLE|PROBLEM STATEMENT|RECOMMENDED TECH STACK|CORE ARCHITECTURE|PRODUCTION REALITIES|ATS RESUME BULLETS|INTERVIEW TALKING POINTS)/i.test(
              trimmed
            ) ||
            trimmed.startsWith("#") ||
            (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.startsWith("-"));

          if (isHeading) {
            const cleanHeader = trimmed.replace(/^#+\s*/, "");
            return (
              <div
                key={idx}
                className="font-bold text-zinc-950 dark:text-white pt-2 pb-0.5 border-b border-zinc-200/60 dark:border-white/10 flex items-center gap-2 text-xs sm:text-sm tracking-tight"
                style={{ color: selectedModel.colors.primary }}
              >
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span>{cleanHeader}</span>
              </div>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const bulletText = trimmed.replace(/^[-•]\s*/, "");
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 text-zinc-700 dark:text-zinc-300">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: selectedModel.colors.primary }}
                />
                <span className="flex-1">{bulletText}</span>
              </div>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 text-zinc-700 dark:text-zinc-300">
                <span
                  className="font-semibold text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0"
                >
                  {numMatch[1]}
                </span>
                <span className="flex-1">{numMatch[2]}</span>
              </div>
            );
          }

          return <p key={idx}>{trimmed}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Left Sessions Sidebar */}
      <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 flex flex-col justify-between hidden lg:flex">
        {/* Top: Header & New Analysis button */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
              }}
            >
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Project Roadmap</h2>
              <p className="text-[10px] text-zinc-500">JD Gap Analysis & Blueprints</p>
            </div>
          </div>

          <button
            onClick={() => setActiveSession(null)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white transition shadow-sm hover:opacity-95 active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
            Saved Roadmaps ({sessions.length})
          </div>

          {loadingSessions ? (
            <div className="py-8 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: selectedModel.colors.primary }} />
              <span>Loading saved roadmaps...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center px-4">
              <Compass className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No saved roadmaps yet</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                Paste a Job Description to analyze your background and get project proposals.
              </p>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = activeSession?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`group relative flex items-start justify-between p-2.5 rounded-xl text-left cursor-pointer transition border ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800/90 border-zinc-300 dark:border-white/20 shadow-sm"
                      : "bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 border-transparent hover:border-zinc-200 dark:hover:border-white/5"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {s.title}
                    </div>
                    {s.target_role && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {s.target_role} {s.company ? `@ ${s.company}` : ""}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
                      <span>{formatDate(s.updated_at)}</span>
                      <span>•</span>
                      <span>{s.message_count} messages</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition shrink-0"
                    title="Delete roadmap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom clean info */}
        <div className="p-3 border-t border-zinc-200 dark:border-white/10 text-[11px] text-zinc-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>Cross-referenced against your profile</span>
        </div>
      </div>

      {/* Main Roadmap Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Error notification banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Navbar */}
        <div className="h-14 shrink-0 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setActiveSession(null)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-zinc-900 dark:text-white truncate flex items-center gap-2">
                {activeSession ? activeSession.title : "Target Role & Gap Analysis"}
                {activeSession?.target_role && (
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                    {activeSession.target_role}
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-zinc-500 truncate">
                {activeSession
                  ? `${activeSession.messages.length} messages in conversation`
                  : "Analyzes target job requirements against your verified profile"}
              </p>
            </div>
          </div>

          {activeSession && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>Tailored Blueprints</span>
              </span>
            </div>
          )}
        </div>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!activeSession ? (
            /* Blank State / New Analysis Input Form */
            <div className="max-w-3xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-2">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
                  }}
                >
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  Target Role Gap Analysis & Project Blueprints
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  Paste any Job Description. The career architect evaluates your verified experience
                  to diagnose skill gaps and generate high-impact project proposals you can build to prove you meet the role requirements.
                </p>
              </div>

              {/* Sample Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Quick-load sample Job Descriptions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_JDS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setJdInput(sample.text);
                        setTitleInput(sample.title);
                      }}
                      className="p-3 text-left rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-white/20 transition group"
                    >
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-orange-500 transition">
                        {sample.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">{sample.company}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Card */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Roadmap Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Machine Learning Platform Engineer"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Target Job Description Text
                  </label>
                  <textarea
                    rows={9}
                    placeholder="Paste the target job description here (role summary, required qualifications, tech stack, responsibilities)..."
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 text-xs sm:text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
                  <span className="text-[11px] text-zinc-400">
                    Tailored to your verified background
                  </span>

                  <button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={generating || !jdInput.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
                    }}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing Background & Designing Projects...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Generate Roadmap</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Chat Thread */
            <div className="max-w-4xl mx-auto space-y-5 pb-6">
              {activeSession.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm mt-1"
                        style={{
                          background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
                        }}
                      >
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-4 sm:p-5 max-w-[88%] shadow-sm ${
                        isUser
                          ? "bg-orange-600 text-white shadow-orange-500/10"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-white/10"
                      }`}
                    >
                      {/* Action Bar */}
                      {!isUser && (
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-white/5 select-none text-[11px] text-zinc-400">
                          <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                            <span>Career Architect</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.content, m.id)}
                            className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Message Content */}
                      {isUser ? (
                        <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {stripAsterisks(m.content)}
                        </div>
                      ) : (
                        renderCleanMessage(m.content)
                      )}

                      <div
                        className={`text-[10px] mt-3 ${
                          isUser ? "text-orange-200 text-right" : "text-zinc-400"
                        }`}
                      >
                        {formatDate(m.created_at)}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {sendingMessage && (
                <div className="flex gap-3.5 items-start">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
                    }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center gap-3">
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: selectedModel.colors.primary }}
                    />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Architecting project guidance & implementation details...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Chat Bar (Active Session) */}
        {activeSession && (
          <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 backdrop-blur-md shrink-0">
            <div className="max-w-4xl mx-auto space-y-2.5">
              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <span className="text-zinc-400 font-semibold uppercase text-[10px] shrink-0 mr-1">
                  Ask Follow-up:
                </span>
                {QUICK_FOLLOWUPS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={sendingMessage}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition whitespace-nowrap shrink-0 border border-zinc-200/50 dark:border-white/5"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>

              {/* Text Input Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask any question about architecture, schemas, tech stack, or interview talking points..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-zinc-400"
                />

                <button
                  type="submit"
                  disabled={sendingMessage || !chatInput.trim()}
                  className="px-4 py-3 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-95 shrink-0 flex items-center gap-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${selectedModel.colors.primary}, ${selectedModel.colors.secondary})`,
                  }}
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
