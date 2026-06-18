import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  props: { params: Promise<{ sessionId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = params;

  try {
    const updatedSession = await prisma.codingSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        isCompleted: true,
      },
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
