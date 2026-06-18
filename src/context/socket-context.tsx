"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface MatchResult {
  sessionId: string;
  partnerName: string;
  language: string;
  topic: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  inQueue: boolean;
  queueTime: number;
  eloSearchRadius: number;
  matchResult: MatchResult | null;
  joinMatchmaking: (languages: string[], topics: string[], skillLevel: string, role: string, elo: number) => void;
  leaveMatchmaking: () => void;
  resetMatch: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [eloSearchRadius, setEloSearchRadius] = useState(200);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socketInstance = io(socketUrl, {
      autoConnect: true,
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to matchmaking server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from matchmaking server");
      setIsConnected(false);
      setInQueue(false);
    });

    socketInstance.on("queue_status", (data: { inQueue: boolean }) => {
      setInQueue(data.inQueue);
      if (!data.inQueue) {
        setQueueTime(0);
        setEloSearchRadius(200);
      }
    });

    socketInstance.on("match_found", (data: MatchResult) => {
      console.log("Match found!", data);
      setMatchResult(data);
      setInQueue(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Timer loop for queue status
  useEffect(() => {
    if (inQueue) {
      timerRef.current = setInterval(() => {
        setQueueTime((prev) => {
          const nextTime = prev + 1;
          // Every 60s, widen search radius by 100 ELO
          const minutes = Math.floor(nextTime / 60);
          setEloSearchRadius(200 + minutes * 100);
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setQueueTime(0);
      setEloSearchRadius(200);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inQueue]);

  const joinMatchmaking = (
    languages: string[],
    topics: string[],
    skillLevel: string,
    role: string,
    elo: number
  ) => {
    if (!socket || !session?.user) return;

    socket.emit("join_queue", {
      userId: (session.user as any).id,
      username: (session.user as any).username || session.user.name,
      elo: elo || 1000,
      languages,
      topics,
      role,
    });
  };

  const leaveMatchmaking = () => {
    if (!socket || !session?.user) return;

    socket.emit("leave_queue", {
      userId: (session.user as any).id,
    });
  };

  const resetMatch = () => {
    setMatchResult(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        inQueue,
        queueTime,
        eloSearchRadius,
        matchResult,
        joinMatchmaking,
        leaveMatchmaking,
        resetMatch,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
