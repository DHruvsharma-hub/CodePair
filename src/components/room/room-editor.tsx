"use client";

import React, { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { MessageSquarePlus, X, User, ChevronRight, CornerDownRight } from "lucide-react";

interface RoomEditorProps {
  sessionId: string;
  username: string;
  language: string;
  onCodeChange: (code: string) => void;
}

const USER_COLORS = [
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
];

interface Comment {
  author: string;
  text: string;
  lineNumber: number;
  timestamp: number;
}

export default function RoomEditor({
  sessionId,
  username,
  language,
  onCodeChange,
}: RoomEditorProps) {
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [commentsMapState, setCommentsMapState] = useState<Record<string, Comment>>({});
  const [newComment, setNewComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Pick a random user cursor color
  const userColorRef = useRef(USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)] || "#6366f1");

  // Clean language name to monaco identifier
  const getMonacoLanguage = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === "c++") return "cpp";
    return l;
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Initialize Yjs doc and websocket connection
    const doc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_YJS_URL || "ws://localhost:3001/yjs";
    const provider = new WebsocketProvider(wsUrl, sessionId, doc);
    providerRef.current = provider;

    const textType = doc.getText("monaco");

    // Bind Yjs text type to Monaco Editor model
    const binding = new MonacoBinding(
      textType,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Configure user name and cursor color for other peers
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColorRef.current,
    });

    // Track active user awareness lists
    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values()) as any[];
      const names = states
        .map((s) => s.user?.name)
        .filter(Boolean);
      setActiveUsers(Array.from(new Set(names)));
    });

    // Track inline annotations via Yjs Shared Map
    const commentsMap = doc.getMap("comments");
    commentsMap.observe(() => {
      const data = commentsMap.toJSON() as Record<string, Comment>;
      setCommentsMapState(data);
    });

    // Handle cursor selection changes to capture active line numbers
    editor.onDidChangeCursorPosition((e: any) => {
      setSelectedLine(e.position.lineNumber);
    });

    // Trigger parent callback when code changes
    editor.onDidChangeModelContent(() => {
      onCodeChange(editor.getValue());
    });
  };

  useEffect(() => {
    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.disconnect();
    };
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedLine || !providerRef.current) return;

    const doc = providerRef.current.doc;
    const commentsMap = doc.getMap("comments");

    const commentKey = `${selectedLine}-${Date.now()}`;
    const commentData: Comment = {
      author: username,
      text: newComment.trim(),
      lineNumber: selectedLine,
      timestamp: Date.now(),
    };

    commentsMap.set(commentKey, commentData);
    setNewComment("");
    setShowCommentInput(false);
  };

  const handleDeleteComment = (key: string) => {
    if (!providerRef.current) return;
    const doc = providerRef.current.doc;
    const commentsMap = doc.getMap("comments");
    commentsMap.delete(key);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] border border-slate-900 rounded-2xl overflow-hidden shadow-inner">
      {/* Editor Header */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {language} Mode
          </div>
          <span className="text-xs text-slate-500">•</span>
          <div className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 block animate-pulse" />
            <span className="text-[10px] text-slate-400 font-semibold">Live Sync Active</span>
          </div>
        </div>

        {/* Active Members avatars */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-slate-500 mr-1.5 font-bold uppercase tracking-wider">Users:</span>
          {activeUsers.map((user, idx) => (
            <div
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-slate-800"
              style={{ 
                backgroundColor: user === username 
                  ? userColorRef.current 
                  : USER_COLORS[idx % USER_COLORS.length] + "30",
                borderColor: user === username 
                  ? "transparent" 
                  : USER_COLORS[idx % USER_COLORS.length]
              }}
            >
              @{user}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Main body */}
      <div className="flex-1 relative min-h-0 flex flex-col lg:flex-row">
        {/* Monaco Editor Container */}
        <div className="flex-1 min-h-0 h-full relative">
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-geist-mono), Courier New, monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 3,
            }}
          />

          {/* Add annotation triggers near cursor line */}
          {selectedLine !== null && (
            <button
              onClick={() => setShowCommentInput(true)}
              className="absolute right-6 bottom-6 z-20 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition duration-200"
              title={`Add comment to line ${selectedLine}`}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Comments Sidebar Panel */}
        <div className="w-full lg:w-72 bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-900 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Line Annotations</span>
            <span className="text-[9px] font-semibold text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">
              {Object.keys(commentsMapState).length} Comments
            </span>
          </div>

          {/* Comment inputs */}
          {showCommentInput && selectedLine !== null && (
            <div className="p-4 border-b border-slate-900 bg-slate-900/20 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Line {selectedLine} Annotation</span>
                <button onClick={() => setShowCommentInput(false)} className="text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Drop a debugging hint..."
                className="w-full p-2 h-16 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 resize-none"
              />
              <button
                onClick={handleAddComment}
                className="w-full h-8 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              >
                Post Hint
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.keys(commentsMapState).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-2 py-8">
                <CornerDownRight className="h-5 w-5 text-slate-700" />
                <p className="text-[10px] font-semibold max-w-[160px] leading-relaxed">
                  Select a line in the editor and click the message bubble to leave collaborative notes.
                </p>
              </div>
            ) : (
              Object.entries(commentsMapState)
                .sort((a, b) => a[1].lineNumber - b[1].lineNumber)
                .map(([key, comment]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 relative group"
                  >
                    <button
                      onClick={() => handleDeleteComment(key)}
                      className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                      title="Delete Note"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400">@{comment.author}</span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                        Line {comment.lineNumber}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                      {comment.text}
                    </p>

                    <div className="text-[9px] text-slate-600 text-right">
                      {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
