import express from "express";
import { createServer, IncomingMessage } from "http";
import { Server } from "socket.io";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils";
import { prisma } from "./db";
import { 
  joinQueue, 
  leaveQueue, 
  leaveQueueBySocket, 
  runMatchmaking,
  getQueue
} from "./matcher";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors({
  origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Health status endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    queueSize: getQueue().length,
    activeRooms: 0 // Will track when Yjs/Socket rooms are active
  });
});

const httpServer = createServer(app);

// Initialize y-websocket server
const wss = new WebSocketServer({ noServer: true });
wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  setupWSConnection(ws, req, { gc: true });
});

// Intercept HTTP upgrades to support both socket.io and y-websocket
httpServer.on("upgrade", (request: IncomingMessage, socket: any, head: Buffer) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  
  if (url.pathname.startsWith("/yjs")) {
    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // Only destroy if it is not a socket.io upgrade either
    if (!url.pathname.startsWith("/socket.io")) {
      socket.destroy();
    }
  }
});

// Bind Socket.io to HTTP server
const io = new Server(httpServer, {
  destroyUpgrade: false,
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // When client joins queue
  socket.on("join_queue", async (data: {
    userId: string;
    username: string;
    elo: number;
    languages: string[];
    topics: string[];
    role: string;
  }) => {
    try {
      await joinQueue({
        socketId: socket.id,
        userId: data.userId,
        username: data.username,
        elo: data.elo,
        languages: data.languages,
        topics: data.topics,
        role: data.role
      });
      socket.emit("queue_status", { inQueue: true });
    } catch (err) {
      console.error(`Error handling join_queue for ${data.username}:`, err);
      socket.emit("error", { message: "Failed to join queue" });
    }
  });

  // When client leaves queue
  socket.on("leave_queue", (data: { userId: string }) => {
    try {
      leaveQueue(data.userId);
      socket.emit("queue_status", { inQueue: false });
    } catch (err) {
      console.error(`Error handling leave_queue:`, err);
    }
  });

  // Join specific coding session room
  socket.on("join_room", (data: { sessionId: string; userId: string; username: string }) => {
    socket.join(data.sessionId);
    console.log(`User ${data.username} joined room ${data.sessionId}`);
    
    // Store metadata on socket
    socket.data = {
      sessionId: data.sessionId,
      userId: data.userId,
      username: data.username
    };

    // Broadcast status to room that partner is online
    io.to(data.sessionId).emit("partner_status_change", {
      username: data.username,
      status: "online",
    });
  });

  // Handle collaborative chat messages
  socket.on("chat_message_send", async (data: {
    sessionId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: "text" | "code" | "voice";
  }) => {
    try {
      // Save message in DB
      const message = await prisma.message.create({
        data: {
          sessionId: data.sessionId,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
        },
      });

      // Broadcast message to everyone in the room
      io.to(data.sessionId).emit("chat_message_broadcast", {
        id: message.id,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        type: data.type,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (err) {
      console.error("Failed to save and broadcast chat message:", err);
    }
  });

  // Handle shared code execution results
  socket.on("code_run_execute", (data: {
    sessionId: string;
    result: any;
  }) => {
    socket.to(data.sessionId).emit("code_run_broadcast", data.result);
  });

  // Handle problem changes sync
  socket.on("problem_update_send", (data: {
    sessionId: string;
    problem: any;
  }) => {
    socket.to(data.sessionId).emit("problem_update_broadcast", data.problem);
  });

  // Handle session skip sync
  socket.on("session_skip_send", (data: { sessionId: string }) => {
    socket.to(data.sessionId).emit("session_skip_broadcast");
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    leaveQueueBySocket(socket.id);

    // Notify room if they were in an active session
    const { sessionId, username } = socket.data || {};
    if (sessionId && username) {
      io.to(sessionId).emit("partner_status_change", {
        username,
        status: "offline",
      });
      console.log(`User ${username} disconnected from room ${sessionId}`);
    }
  });
});

// Run matchmaking loop every 3 seconds
setInterval(async () => {
  try {
    await runMatchmaking(io);
  } catch (err) {
    console.error("Error running matchmaking cycle:", err);
  }
}, 3000);

httpServer.listen(PORT, () => {
  console.log(`DSA Debug Room Matchmaking Server listening on port ${PORT} 🚀`);
});
