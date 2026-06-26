import { createId, createSessionToken, hashPassword } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 днів

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Вкажіть email і пароль" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await readDb();

  if (db.users.some((user) => user.email === normalizedEmail)) {
    return NextResponse.json(
      { error: "Користувач уже існує" },
      { status: 409 }
    );
  }

  const user = {
    id: createId(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  };

  db.users.push(user);

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  db.sessions.push({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  });

  await writeDb(db);

  const response = NextResponse.json({ user: { id: user.id, email: user.email } });
  response.cookies.set("chat_session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
