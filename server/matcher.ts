import { prisma } from "./db";
import { Server } from "socket.io";

export interface QueueMember {
  socketId: string;
  userId: string;
  username: string;
  elo: number;
  languages: string[];
  topics: string[];
  role: string; // "helper" | "helpee" | "both"
  joinedAt: number;
  eloRange: number; // starts at 200, widens by 100 every 60s
  hasSkipPenalty: boolean;
}

// Memory queue storage
let queue: QueueMember[] = [];

// Get current queue state
export function getQueue() {
  return queue;
}

// Add user to matchmaking queue
export async function joinQueue(
  member: Omit<QueueMember, "joinedAt" | "eloRange" | "hasSkipPenalty">
) {
  // Check if already in queue
  if (queue.some((m) => m.userId === member.userId)) {
    console.log(`User ${member.username} is already in the queue.`);
    return;
  }

  // Check skip penalty
  const hasSkipPenalty = await checkSkipPenalty(member.userId);

  const newMember: QueueMember = {
    ...member,
    joinedAt: Date.now(),
    eloRange: 200,
    hasSkipPenalty,
  };

  queue.push(newMember);
  console.log(`User ${member.username} joined the queue. Current size: ${queue.length}. (Skip Penalty: ${hasSkipPenalty})`);
}

// Remove user from queue
export function leaveQueue(userId: string) {
  const initialLength = queue.length;
  queue = queue.filter((m) => m.userId !== userId);
  if (queue.length < initialLength) {
    console.log(`User with ID ${userId} left the queue. Current size: ${queue.length}.`);
  }
}

// Remove user by socket ID
export function leaveQueueBySocket(socketId: string) {
  const member = queue.find((m) => m.socketId === socketId);
  if (member) {
    leaveQueue(member.userId);
  }
}

// Matchmaking Loop
export async function runMatchmaking(io: Server) {
  if (queue.length < 2) return;

  // Copy queue to iterate safely
  const pool = [...queue];
  const matchedUserIds = new Set<string>();

  for (let i = 0; i < pool.length; i++) {
    const member1 = pool[i];
    if (matchedUserIds.has(member1.userId)) continue;

    // Check penalty constraints: if penalized, must wait in queue for at least 30 seconds
    if (member1.hasSkipPenalty && Date.now() - member1.joinedAt < 30000) {
      continue;
    }

    // Update ELO range based on elapsed time in queue (widen by 100 ELO range per 60s)
    const elapsedSeconds = (Date.now() - member1.joinedAt) / 1000;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    member1.eloRange = 200 + elapsedMinutes * 100;

    let bestPartner: QueueMember | null = null;
    let bestScore = -1; // Higher score is better matching compatibility

    for (let j = i + 1; j < pool.length; j++) {
      const member2 = pool[j];
      if (matchedUserIds.has(member2.userId) || member1.userId === member2.userId) {
        continue;
      }

      // Check penalty constraints for partner
      if (member2.hasSkipPenalty && Date.now() - member2.joinedAt < 30000) {
        continue;
      }

      // 1. Language overlap
      const commonLanguages = member1.languages.filter((l) =>
        member2.languages.includes(l)
      );
      if (commonLanguages.length === 0) continue;

      // 2. Topic overlap
      const commonTopics = member1.topics.filter((t) =>
        member2.topics.includes(t)
      );
      if (commonTopics.length === 0) continue;

      // 3. ELO Compatibility
      const eloDiff = Math.abs(member1.elo - member2.elo);
      // Determine ELO range based on each user's waiting time
      const member2ElapsedMinutes = Math.floor((Date.now() - member2.joinedAt) / 60000);
      member2.eloRange = 200 + member2ElapsedMinutes * 100;

      const maxAllowedEloDiff = Math.max(member1.eloRange, member2.eloRange);
      if (eloDiff > maxAllowedEloDiff) continue;

      // 4. Role Compatibility
      if (!isRoleCompatible(member1.role, member2.role)) continue;

      // Calculate compatibility score (favor similar ELO, more overlaps, and helper/helpee pairing)
      const eloScore = Math.max(0, 1000 - eloDiff); // closer ELO = higher score
      const languageScore = commonLanguages.length * 100;
      const topicScore = commonTopics.length * 100;
      const roleScore = (member1.role !== "both" && member2.role !== "both") ? 300 : 100; // direct helper-helpee matches get bonus

      const matchScore = eloScore + languageScore + topicScore + roleScore;

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestPartner = member2;
      }
    }

    if (bestPartner) {
      // Create session in DB
      const partner = bestPartner;
      matchedUserIds.add(member1.userId);
      matchedUserIds.add(partner.userId);

      // Select common parameters for the room
      const chosenLanguage = member1.languages.filter(l => partner.languages.includes(l))[0] || "C++";
      const chosenTopic = member1.topics.filter(t => partner.topics.includes(t))[0] || "Arrays";

      try {
        console.log(`Match found: ${member1.username} ELO:${member1.elo} paired with ${partner.username} ELO:${partner.elo}`);

        const codingSession = await prisma.codingSession.create({
          data: {
            user1Id: member1.userId,
            user2Id: partner.userId,
            language: chosenLanguage,
            topic: chosenTopic,
            difficulty: "Medium", // Default difficulty
          },
        });

        // Notify client sockets
        io.to(member1.socketId).emit("match_found", {
          sessionId: codingSession.id,
          partnerName: partner.username,
          language: chosenLanguage,
          topic: chosenTopic,
        });

        io.to(partner.socketId).emit("match_found", {
          sessionId: codingSession.id,
          partnerName: member1.username,
          language: chosenLanguage,
          topic: chosenTopic,
        });

        // Clean up from queue
        leaveQueue(member1.userId);
        leaveQueue(partner.userId);

      } catch (err) {
        console.error("Failed to create match coding session in DB:", err);
        // Put back in queue if db creation fails
        matchedUserIds.delete(member1.userId);
        matchedUserIds.delete(partner.userId);
      }
    }
  }
}

// Helper: Check if roles can match
function isRoleCompatible(role1: string, role2: string): boolean {
  if (role1 === "both" || role2 === "both") return true;
  if (role1 === "helper" && role2 === "helpee") return true;
  if (role1 === "helpee" && role2 === "helper") return true;
  return false;
}

// Helper: Count skips in 24 hours
async function checkSkipPenalty(userId: string): Promise<boolean> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const skipsCount = await prisma.codingSession.count({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
        startedAt: { gte: last24Hours },
        skipReason: { not: null },
      },
    });
    return skipsCount >= 3;
  } catch (error) {
    console.error("Failed to check skip penalty counts:", error);
    return false;
  }
}
