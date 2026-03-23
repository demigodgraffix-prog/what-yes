export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Simplified auth - in production you'd use NextAuth.js or similar
export async function POST(req: NextRequest) {
  const { action, email, username } = await req.json();

  if (action === "register") {
    if (!email || !username) {
      return NextResponse.json({ error: "Email and username required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
      },
    });

    // Set a simple userId cookie
    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  }

  if (action === "login") {
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    }
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  return NextResponse.json({ success: true });
}
