import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    return NextResponse.json({
      username: user?.username || "",
      preferences: preferences || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { username, languages, topics, skillLevel, rolePreference } = body;

    if (!username || !languages || !topics || !skillLevel || !rolePreference) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
        id: {
          not: userId,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Update user record with username
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    // Upsert preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        languages,
        topics,
        skillLevel,
        rolePreference,
      },
      create: {
        userId,
        languages,
        topics,
        skillLevel,
        rolePreference,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save profile preferences" },
      { status: 500 }
    );
  }
}
