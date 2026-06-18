import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoomClientLayout from "@/components/room/room-client-layout";

export default async function RoomPage(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Retrieve coding session details
  const codingSession = await prisma.codingSession.findUnique({
    where: { id: sessionId },
    include: {
      user1: { select: { id: true, username: true, eloRating: true } },
      user2: { select: { id: true, username: true, eloRating: true } }
    }
  });

  if (!codingSession) {
    redirect("/dashboard");
  }

  // Security checks: only user1 and user2 can join
  const isUser1 = codingSession.user1Id === userId;
  const isUser2 = codingSession.user2Id === userId;

  if (!isUser1 && !isUser2) {
    redirect("/dashboard");
  }

  // Get current user and partner details
  const partner = isUser1 ? codingSession.user2 : codingSession.user1;
  const currentUser = isUser1 ? codingSession.user1 : codingSession.user2;

  return (
    <RoomClientLayout
      sessionId={sessionId}
      currentUserId={userId}
      currentUsername={currentUser.username || "User"}
      partnerUsername={partner.username || "Partner"}
      partnerElo={partner.eloRating}
      startedAt={codingSession.startedAt.toISOString()}
      initialLanguage={codingSession.language || "C++"}
      initialTopic={codingSession.topic || "Arrays"}
      initialProblemTitle={codingSession.problemTitle}
      initialProblemText={codingSession.problemText}
      initialProblemUrl={codingSession.problemUrl}
      initialDifficulty={codingSession.difficulty}
    />
  );
}
