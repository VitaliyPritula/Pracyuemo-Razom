import { readDb, writeDb } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getCurrentUser() {
  const cookiesList = await cookies();
  const sessionToken = cookiesList.get("chat_session")?.value;
  if (!sessionToken) return null;

  const db = await readDb();
  const session = db.sessions.find((item) => item.token === sessionToken);
  if (!session || new Date(session.expires_at) < new Date()) return null;

  return db.users.find((user) => user.id === session.user_id) ?? null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body as { token?: string };
  if (!token) {
    return NextResponse.json({ error: "token не вказано" }, { status: 400 });
  }

  const db = await readDb();
  const invite = db.conversation_invites.find((item) => item.token === token);
  if (!invite) {
    return NextResponse.json({ error: "Посилання недійсне" }, { status: 404 });
  }

  const participantExists = db.conversation_participants.some(
    (item) => item.conversation_id === invite.conversation_id && item.user_id === user.id
  );

  if (!participantExists) {
    db.conversation_participants.push({
      id: crypto.randomUUID(),
      conversation_id: invite.conversation_id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
    await writeDb(db);
  }

  return NextResponse.json({ conversationId: invite.conversation_id });
}
