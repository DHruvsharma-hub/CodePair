"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/socket-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Code2, 
  Clock, 
  User, 
  HelpCircle, 
  ArrowLeft, 
  Play, 
  X, 
  Loader2, 
  AlertCircle, 
  Globe, 
  AlertTriangle 
} from "lucide-react";
import RoomEditor from "./room-editor";
import RoomCompiler from "./room-compiler";
import RoomChat from "./room-chat";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface Problem {
  title: string;
  difficulty: string;
  description: string;
  constraints: string;
  examples: Example[];
}

interface RoomClientLayoutProps {
  sessionId: string;
  currentUserId: string;
  currentUsername: string;
  partnerUsername: string;
  partnerElo: number;
  startedAt: string;
  initialLanguage: string;
  initialTopic: string;
  initialProblemTitle: string | null;
  initialProblemText: string | null;
  initialProblemUrl: string | null;
  initialDifficulty: string | null;
}

export default function RoomClientLayout({
  sessionId,
  currentUserId,
  currentUsername,
  partnerUsername,
  partnerElo,
  startedAt,
  initialLanguage,
  initialTopic,
  initialProblemTitle,
  initialProblemText,
  initialProblemUrl,
  initialDifficulty,
}: RoomClientLayoutProps) {
  const router = useRouter();
  const { socket } = useSocket();

  // Active Code content reference passed to compiler
  const [code, setCode] = useState("");

  // Problem details state
  const [problem, setProblem] = useState<Problem | null>(
    initialProblemTitle 
      ? {
          title: initialProblemTitle,
          difficulty: initialDifficulty || "Medium",
          description: initialProblemText || "",
          constraints: "Check pasted link description.",
          examples: [],
        }
      : null
  );

  const [problemUrl, setProblemUrl] = useState(initialProblemUrl || "");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Time tracking
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);

  // Modal controls
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipping, setSkipping] = useState(false);
  
  // Partner connectivity tracking
  const [partnerOnline, setPartnerOnline] = useState(true);

  // Socket room join on mount
  useEffect(() => {
    if (!socket) return;

    // Join Socket Room
    socket.emit("join_room", {
      sessionId,
      userId: currentUserId,
      username: currentUsername,
    });

    // Listen to problem updates from partner
    socket.on("problem_update_broadcast", (updatedProblem: Problem) => {
      setProblem(updatedProblem);
    });

    // Listen to partner skips
    socket.on("session_skip_broadcast", () => {
      alert("Your partner has skipped the session. Redirecting to dashboard...");
      router.push("/dashboard");
    });

    // Listen to partner status changes (online/offline)
    socket.on("partner_status_change", (data: { username: string; status: "online" | "offline" }) => {
      if (data.username === partnerUsername) {
        setPartnerOnline(data.status === "online");
      }
    });

    return () => {
      socket.off("problem_update_broadcast");
      socket.off("session_skip_broadcast");
      socket.off("partner_status_change");
    };
  }, [socket, sessionId, currentUserId, currentUsername, partnerUsername, router]);

  // Session clock timer (decrements every 1 second)
  useEffect(() => {
    const startMs = new Date(startedAt).getTime();
    
    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      const remaining = Math.max(0, 3600 - elapsedSeconds);
      setTimeRemaining(remaining);

      // Warning when exactly 5 minutes left
      if (remaining <= 300 && remaining > 0) {
        setShowFiveMinWarning(true);
      }

      // Auto end session when timer runs out
      if (remaining <= 0) {
        handleAutoEndSession();
      }
    };

    updateTimer(); // run once immediately
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [startedAt]);

  const handleAutoEndSession = async () => {
    try {
      await fetch(`/api/room/${sessionId}/end`, { method: "POST" });
      alert("Session time limit reached (1 hour). Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (e) {
      router.push("/dashboard");
    }
  };

  const handleScrapeProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemUrl.trim() || scraping) return;

    setScraping(true);
    setScrapeError(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: problemUrl.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse problem from URL");
      }

      const data: Problem = await res.json();
      setProblem(data);

      // Save problem details inside database
      await fetch(`/api/room/${sessionId}/problem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemUrl: problemUrl.trim(),
          problemTitle: data.title,
          problemText: data.description,
          difficulty: data.difficulty,
        }),
      });

      // Broadcast update to partner socket room
      if (socket) {
        socket.emit("problem_update_send", {
          sessionId,
          problem: data,
        });
      }

    } catch (err: any) {
      setScrapeError(err.message || "Something went wrong.");
    } finally {
      setScraping(false);
    }
  };

  const handleSkipSession = async () => {
    setSkipping(true);
    try {
      await fetch(`/api/room/${sessionId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: skipReason.trim() || "User skipped session" }),
      });

      // Emit skip broadcast
      if (socket) {
        socket.emit("session_skip_send", { sessionId });
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setSkipping(false);
    }
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Partner Offline Warning Banner */}
      {!partnerOnline && (
        <div className="bg-rose-600 text-white px-4 py-2 flex items-center text-xs font-bold animate-pulse shrink-0">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Partner @{partnerUsername} disconnected. Waiting for them to reconnect...</span>
        </div>
      )}

      {/* 5 Minute Warning Notification Banner */}
      {showFiveMinWarning && (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-pulse shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>5 Minutes Remaining! Complete your answers and review peer codes.</span>
          </div>
          <button onClick={() => setShowFiveMinWarning(false)} className="hover:text-amber-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Column Dashboard Body */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left Column: Problem Description Form (20% width) */}
        <div className="w-[20%] border-r border-slate-900 flex flex-col min-h-0 bg-slate-950/20 shrink-0">
          {/* URL Input Form */}
          <div className="p-4 border-b border-slate-900 shrink-0">
            <form onSubmit={handleScrapeProblem} className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Paste Problem URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={problemUrl}
                  onChange={(e) => setProblemUrl(e.target.value)}
                  placeholder="LeetCode URL..."
                  className="flex-1 min-w-0 px-2.5 h-8 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-600 font-medium"
                />
                <button
                  type="submit"
                  disabled={scraping}
                  className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold text-white transition shrink-0"
                >
                  {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
                </button>
              </div>
            </form>
            {scrapeError && (
              <p className="text-[10px] text-rose-400 mt-2 font-medium">{scrapeError}</p>
            )}
          </div>

          {/* Description details */}
          <div className="flex-1 overflow-y-auto p-4 select-text selection:bg-indigo-500/30 selection:text-indigo-200">
            {!problem ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 space-y-2 py-10">
                <Globe className="h-6 w-6 text-slate-700" />
                <p className="text-xs font-semibold leading-relaxed max-w-[150px]">
                  Paste a LeetCode problem URL above to scrape details.
                </p>
                <div className="text-[10px] text-slate-700 font-medium italic mt-2">
                  Try pasting: <br/>
                  <code className="text-indigo-500/80">leetcode.com/problems/two-sum</code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white leading-snug">{problem.title}</h2>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 border ${
                    problem.difficulty === "Easy"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/10"
                      : problem.difficulty === "Hard"
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/10"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/10"
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>

                {/* Problem text description */}
                <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-900/60">
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Examples</h3>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-xl space-y-1.5 font-mono text-[10px]">
                        <div><strong className="text-indigo-400">Input:</strong> <span className="text-slate-300">{ex.input}</span></div>
                        <div><strong className="text-purple-400">Output:</strong> <span className="text-slate-350">{ex.output}</span></div>
                        {ex.explanation && (
                          <div className="text-slate-500 mt-1 leading-normal italic">{ex.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="pt-2 border-t border-slate-900/60">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Constraints</h3>
                    <pre className="text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                      {problem.constraints}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Monaco Editor & Compiler Panel (55% width) */}
        <div className="w-[55%] flex flex-col min-h-0 shrink-0">
          <RoomEditor
            sessionId={sessionId}
            username={currentUsername}
            language={initialLanguage}
            onCodeChange={(newCode) => setCode(newCode)}
          />
          <RoomCompiler
            language={initialLanguage}
            currentCode={code}
            sessionId={sessionId}
          />
        </div>

        {/* Right Column: Chat & Voice panel (25% width) */}
        <div className="w-[25%] border-l border-slate-900 shrink-0 h-full">
          <RoomChat sessionId={sessionId} />
        </div>
      </div>

      {/* Bottom Footer Timer Controls Status bar */}
      <footer className="h-14 bg-slate-950 border-t border-slate-900 px-6 flex items-center justify-between shrink-0">
        
        {/* Left side: Clock */}
        <div className="flex items-center space-x-3.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Clock className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Time Remaining</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{formatTimer(timeRemaining)}</div>
          </div>
        </div>

        {/* Center Status details */}
        <div className="hidden md:flex items-center space-x-8 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-semibold text-[10px] uppercase">Partner:</span>
            <div className="flex items-center space-x-2 font-bold">
              <span className={`h-2.5 w-2.5 rounded-full block shrink-0 ${partnerOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className={partnerOnline ? "text-indigo-300" : "text-slate-500 line-through"}>
                @{partnerUsername} ({partnerElo} ELO)
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wide uppercase ${partnerOnline ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>
                {partnerOnline ? "online" : "offline"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-semibold text-[10px] uppercase">Topic focus:</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-purple-300">
              {initialTopic}
            </span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div>
          <button
            onClick={() => setShowSkipConfirm(true)}
            className="inline-flex items-center justify-center h-9 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-rose-400 hover:text-rose-300 rounded-xl transition duration-200"
          >
            Skip Session
          </button>
        </div>
      </footer>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-6 relative shadow-2xl">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-bold text-white">Skip Coding Session?</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Skipping this session requires confirmation. Doing so will immediately close this room for both you and your partner. 
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reason for Skipping</label>
                <input
                  type="text"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Need to leave / mismatched topic / off-topic"
                  className="w-full px-3 h-10 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSkipConfirm(false);
                    setSkipReason("");
                  }}
                  disabled={skipping}
                  className="px-4 h-9 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSkipSession}
                  disabled={skipping}
                  className="px-4 h-9 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center"
                >
                  {skipping ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : "Yes, Skip Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
