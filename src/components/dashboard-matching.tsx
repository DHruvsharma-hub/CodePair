"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/socket-context";
import { 
  Search, 
  ChevronRight, 
  X, 
  Loader2, 
  Sparkles, 
  Users, 
  Code,
  AlertCircle
} from "lucide-react";

interface DashboardMatchingProps {
  languages: string[];
  topics: string[];
  skillLevel: string;
  rolePreference: string;
  elo: number;
}

export default function DashboardMatching({
  languages,
  topics,
  skillLevel,
  rolePreference,
  elo,
}: DashboardMatchingProps) {
  const router = useRouter();
  const { 
    isConnected, 
    inQueue, 
    queueTime, 
    eloSearchRadius, 
    matchResult, 
    joinMatchmaking, 
    leaveMatchmaking,
    resetMatch
  } = useSocket();

  const [countdown, setCountdown] = useState(3);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Trigger match redirection countdown
  useEffect(() => {
    if (matchResult) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Navigate to room page
            router.push(`/room/${matchResult.sessionId}`);
            // Reset match result in context so state is clean
            setTimeout(() => {
              resetMatch();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(3);
    }
  }, [matchResult, router, resetMatch]);

  const handleStartSearch = () => {
    joinMatchmaking(languages, topics, skillLevel, rolePreference, elo);
  };

  const handleCancelSearch = () => {
    leaveMatchmaking();
  };

  return (
    <>
      {!isConnected && (
        <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex items-start space-x-2 animate-pulse">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Matchmaking Server Offline:</strong> Cannot connect to the matchmaking socket service. Please open a new terminal window, navigate to the <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] text-amber-200">server/</code> directory, and run <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] text-amber-200">npm run dev</code> to start it.
          </span>
        </div>
      )}

      <div className="mt-8 border border-slate-900 bg-slate-950/65 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${
            inQueue 
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 animate-spin" 
              : "bg-indigo-600/10 border-indigo-500/20 text-indigo-400"
          }`}>
            {inQueue ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">
              {inQueue ? "Searching for Peer..." : "Smart P2P Queue"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {inQueue 
                ? `Search Range: ELO ±${eloSearchRadius}` 
                : isConnected 
                  ? "Ready to search for partners" 
                  : "Start the backend server to join the queue"
              }
            </div>
          </div>
        </div>

        {/* Action Button */}
        {inQueue ? (
          <button
            type="button"
            onClick={handleCancelSearch}
            className="w-full md:w-auto inline-flex items-center justify-center px-8 h-12 text-sm font-bold text-slate-300 border border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-xl transition hover:text-white"
          >
            Cancel Search <X className="ml-1.5 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartSearch}
            disabled={!isConnected}
            className={`w-full md:w-auto inline-flex items-center justify-center px-8 h-12 text-sm font-bold text-white rounded-xl transition duration-200 shadow-lg ${
              !isConnected 
                ? "bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-900" 
                : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/20"
            }`}
          >
            {isConnected ? "Find Partner" : "Server Offline"} <ChevronRight className="ml-1.5 h-4 w-4" />
          </button>
        )}
      </div>

      {/* Queue Modal Overlay */}
      {inQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900/60 border border-slate-900 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center">
              {/* Spinning Radar */}
              <div className="relative h-24 w-24 flex items-center justify-center mb-6">
                <span className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" />
                <span className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse" />
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Search className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>

              <h3 className="text-xl font-black text-white">Finding a Peer...</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Looking for coders working in <span className="text-indigo-300 font-semibold">{languages.join(", ")}</span> for <span className="text-purple-300 font-semibold">{topics.slice(0, 3).join("/")}</span> matching.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 w-full border-y border-slate-800/60 py-4 my-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Elapsed Time</div>
                  <div className="text-lg font-mono font-bold text-indigo-400 mt-1">{formatTime(queueTime)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Limit</div>
                  <div className="text-lg font-mono font-bold text-purple-400 mt-1">±{eloSearchRadius} ELO</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelSearch}
                className="w-full inline-flex items-center justify-center h-11 border border-slate-850 hover:border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Cancel Matching
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Found Modal Overlay */}
      {matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/10">
            {/* Confetti decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
                <Sparkles className="h-8 w-8" />
              </div>

              <h3 className="text-3xl font-black text-white tracking-tight">Match Found!</h3>
              <p className="text-sm text-indigo-300 mt-1.5 font-medium">Get ready to code collaboratively</p>

              {/* Match Card details */}
              <div className="w-full bg-slate-950/70 border border-slate-900 rounded-2xl p-6 my-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Partner Handle</div>
                    <div className="text-sm font-bold text-white mt-0.5">@{matchResult.partnerName}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Code className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Room Language & Topic</div>
                    <div className="text-sm font-bold text-white mt-0.5">{matchResult.language} • {matchResult.topic}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Redirecting to debug room in{" "}
                <span className="text-indigo-400 font-bold text-lg font-mono ml-0.5">{countdown}</span>...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
