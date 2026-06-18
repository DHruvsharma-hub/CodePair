"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "@/context/socket-context";
import { useSession } from "next-auth/react";
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Square, 
  Code, 
  Play, 
  Volume2, 
  Loader2 
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "code" | "voice";
  createdAt: string;
}

interface RoomChatProps {
  sessionId: string;
}

export default function RoomChat({ sessionId }: RoomChatProps) {
  const { socket } = useSocket();
  const { data: session } = useSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isCodeSnippet, setIsCodeSnippet] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentUserId = (session?.user as any)?.id;
  const currentUsername = (session?.user as any)?.username || "User";

  // Fetch chat history from DB on room load
  useEffect(() => {
    fetchHistory();
  }, [sessionId]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/room/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load message history", err);
    }
  };

  // Listen to socket chat events
  useEffect(() => {
    if (!socket) return;

    const handleMessageBroadcast = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat_message_broadcast", handleMessageBroadcast);

    return () => {
      socket.off("chat_message_broadcast", handleMessageBroadcast);
    };
  }, [socket]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Text/Code message submit
  const handleSendText = () => {
    if (!text.trim() || !socket) return;

    const payload = {
      sessionId,
      senderId: currentUserId,
      senderName: currentUsername,
      content: text,
      type: isCodeSnippet ? "code" : "text",
    };

    // Emit message to Socket Room
    socket.emit("chat_message_send", payload);

    setText("");
    setIsCodeSnippet(false);
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        sendVoiceNote(audioBlob);
        
        // Stop audio streams
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Countdown limit to 30s
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            // Force stop
            if (recorder.state === "recording") {
              recorder.stop();
            }
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Access microphone denied or media recorder failed", err);
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  // Convert blob to Base64 and emit
  const sendVoiceNote = (blob: Blob) => {
    if (!socket) return;

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Audio = reader.result as string;

      socket.emit("chat_message_send", {
        sessionId,
        senderId: currentUserId,
        senderName: currentUsername,
        content: base64Audio,
        type: "voice",
      });
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-lg select-none">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <span>Interactive Chat</span>
        </div>
        <div className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/10">
          History Persisted (24h)
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-950/40">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-[9px] font-bold text-slate-500 mb-1">
                @{msg.senderName}
              </span>

              {/* Message Content render */}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/40"
                }`}
              >
                {msg.type === "text" && <p className="break-words">{msg.content}</p>}

                {msg.type === "code" && (
                  <pre className="font-mono bg-slate-950/50 p-2.5 rounded-xl text-[11px] overflow-x-auto border border-slate-800/30 whitespace-pre text-indigo-200">
                    {msg.content}
                  </pre>
                )}

                {msg.type === "voice" && (
                  <div className="flex items-center space-x-2.5 min-w-[140px]">
                    <Volume2 className="h-4 w-4 shrink-0 text-indigo-100" />
                    <audio src={msg.content} controls className="h-7 w-full max-w-[180px] custom-audio-player filter invert opacity-90" />
                  </div>
                )}
              </div>

              <span className="text-[8px] text-slate-600 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls bar */}
      <div className="border-t border-slate-900 p-3 bg-slate-950 flex flex-col gap-2 shrink-0">
        {isRecording ? (
          <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 block animate-pulse" />
              <span>Voice Note: {recordingSeconds}/30s</span>
            </div>
            <button
              onClick={stopRecording}
              className="h-8 px-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg flex items-center transition"
            >
              <Square className="h-3 w-3 mr-1.5 fill-current" /> Stop & Send
            </button>
          </div>
        ) : (
          <>
            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder={isCodeSnippet ? "Paste snippet..." : "Type message..."}
                className="flex-1 px-3.5 h-10 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-600 font-medium"
              />
              
              {/* Send Text */}
              <button
                onClick={handleSendText}
                className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10 active:scale-95 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Sub toolbar */}
            <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[10px]">
              <button
                onClick={() => setIsCodeSnippet((prev) => !prev)}
                className={`inline-flex items-center h-6 px-2 rounded-md font-bold transition border ${
                  isCodeSnippet
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400"
                }`}
              >
                <Code className="h-3 w-3 mr-1" /> Code Snippet
              </button>

              <button
                onClick={startRecording}
                className="inline-flex items-center h-6 px-2 rounded-md bg-slate-900 border border-slate-850 font-bold text-slate-500 hover:text-slate-400 hover:border-slate-800 transition"
              >
                <Mic className="h-3 w-3 mr-1 text-slate-500" /> Record Audio (max 30s)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
