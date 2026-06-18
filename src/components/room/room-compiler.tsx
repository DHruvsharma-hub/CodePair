"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/context/socket-context";
import { Terminal, Play, Loader2, Cpu, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface RoomCompilerProps {
  language: string;
  currentCode: string;
  sessionId: string;
}

interface RunResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  timestamp: string;
  executedBy: string;
  inputUsed: string;
}

export default function RoomCompiler({
  language,
  currentCode,
  sessionId,
}: RoomCompilerProps) {
  const { socket } = useSocket();
  const { data: session } = useSession();

  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);

  // Sync execution runs via Socket.io broadcast
  useEffect(() => {
    if (!socket) return;

    const handleCodeRunBroadcast = (result: RunResult) => {
      setLastResult(result);
      setRunning(false);
    };

    socket.on("code_run_broadcast", handleCodeRunBroadcast);

    return () => {
      socket.off("code_run_broadcast", handleCodeRunBroadcast);
    };
  }, [socket]);

  const handleRunCode = async () => {
    if (running) return;
    setRunning(true);
    setLastResult(null);

    const currentUser = (session?.user as any)?.username || "User";

    try {
      // Trigger API compilation
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: currentCode,
          language,
          stdin,
        }),
      });

      if (!res.ok) {
        throw new Error("Compilation API request failed");
      }

      const data = await res.json();

      const resultPayload: RunResult = {
        stdout: data.stdout,
        stderr: data.stderr,
        compile_output: data.compile_output,
        status: data.status || { id: 3, description: "Accepted" },
        time: data.time,
        memory: data.memory,
        timestamp: new Date().toLocaleTimeString(),
        executedBy: currentUser,
        inputUsed: stdin,
      };

      // Set locally
      setLastResult(resultPayload);
      setRunning(false);

      // Broadcast to partner socket room
      if (socket) {
        socket.emit("code_run_execute", {
          sessionId,
          result: resultPayload,
        });
      }

    } catch (err: any) {
      console.error(err);
      setRunning(false);
      setLastResult({
        stdout: null,
        stderr: "Failed to connect to compilation API. Check connection settings.",
        compile_output: null,
        status: { id: 11, description: "Runtime Error" },
        time: "0",
        memory: 0,
        timestamp: new Date().toLocaleTimeString(),
        executedBy: currentUser,
        inputUsed: stdin,
      });
    }
  };

  const isSuccess = lastResult?.status.id === 3;
  const isCompileError = lastResult?.status.id === 6;

  return (
    <div className="bg-slate-950 border-t border-slate-900 flex flex-col h-[30%] min-h-[160px] shrink-0 font-mono">
      {/* Console toolbar */}
      <div className="bg-slate-950 px-4 h-10 border-b border-slate-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
          <Terminal className="h-4 w-4 text-slate-500" />
          <span>Console & Executions</span>
        </div>
        <div className="flex items-center space-x-2">
          {running ? (
            <button
              disabled
              className="inline-flex items-center justify-center h-7 px-3 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-lg cursor-not-allowed"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Compiling...
            </button>
          ) : (
            <button
              onClick={handleRunCode}
              className="inline-flex items-center justify-center h-7 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-[10px] font-bold text-white rounded-lg transition duration-200 shadow-md shadow-indigo-600/10"
            >
              <Play className="h-3 w-3 fill-current rotate-90 mr-1.5 text-indigo-100" /> Run Code
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Stdin Inputs Panel */}
        <div className="w-1/3 border-r border-slate-900 p-3 flex flex-col min-h-0 bg-slate-950/40">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Custom Input (stdin)</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Provide standard inputs here..."
            className="flex-1 w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-600 resize-none font-mono"
          />
        </div>

        {/* Stdout Console Panel */}
        <div className="w-2/3 p-3 flex flex-col min-h-0 bg-slate-950/20 overflow-y-auto">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>Execution Output</span>
            {lastResult && (
              <span className="text-slate-600">
                Ran by <strong className="text-indigo-400">@{lastResult.executedBy}</strong> at {lastResult.timestamp}
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-lg p-2.5 overflow-auto text-xs relative">
            {!lastResult && !running && (
              <div className="text-slate-700 h-full flex items-center justify-center text-[11px]">
                Click "Run Code" to compile and execute program.
              </div>
            )}

            {running && (
              <div className="text-indigo-400/70 h-full flex items-center justify-center text-[11px] animate-pulse">
                Running program execution queries...
              </div>
            )}

            {lastResult && (
              <div className="space-y-2.5">
                {/* Stats indicators */}
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-900 pb-2">
                  <div className="flex items-center space-x-1">
                    {isSuccess ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                    )}
                    <span className={`font-bold text-[10px] uppercase ${isSuccess ? "text-emerald-400" : "text-rose-400"}`}>
                      {lastResult.status.description}
                    </span>
                  </div>
                  {lastResult.time && (
                    <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{lastResult.time}s</span>
                    </div>
                  )}
                  {lastResult.memory && (
                    <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{Math.round(lastResult.memory / 1024)} MB</span>
                    </div>
                  )}
                </div>

                {/* Stderr / Compile errors console */}
                {isCompileError && lastResult.compile_output && (
                  <pre className="text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg whitespace-pre-wrap leading-normal font-mono select-text">
                    {lastResult.compile_output}
                  </pre>
                )}

                {lastResult.stderr && (
                  <pre className="text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg whitespace-pre-wrap leading-normal font-mono select-text">
                    {lastResult.stderr}
                  </pre>
                )}

                {/* Standard outputs */}
                {lastResult.stdout && (
                  <pre className="text-emerald-400 leading-relaxed font-mono select-text">
                    {lastResult.stdout}
                  </pre>
                )}

                {!lastResult.stdout && !lastResult.stderr && !lastResult.compile_output && (
                  <div className="text-slate-600 text-[10px] italic">
                    (No console output generated by program)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
