import { createSessionToken, verifyPassword } from "@/lib/auth";
import { getUserByEmail, createSession, supabase } from "@/lib/db";
import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Вкажіть email і пароль" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Неправильний email або пароль" }, { status: 401 });
  }

  // Видаляємо старі сесії юзера
  await supabase.from("sessions").delete().eq("user_id", user.id);

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await createSession({ token, user_id: user.id, expires_at: expiresAt });

  const response = NextResponse.json({ user: { id: user.id, email: user.email } });
  response.cookies.set("chat_session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}