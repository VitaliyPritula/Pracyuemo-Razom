import { getSessionByToken, getUserById, getInviteByToken, getParticipantsByConversation, addParticipant } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getCurrentUser() {
  const cookiesList = await cookies();
  const sessionToken = cookiesList.get("chat_session")?.value;
  if (!sessionToken) return null;

  const session = await getSessionByToken(sessionToken);
  if (!session || new Date(session.expires_at) < new Date()) return null;

  return getUserById(session.user_id);
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

  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "Посилання недійсне" }, { status: 404 });
  }

  const participants = await getParticipantsByConversation(invite.conversation_id);
  const alreadyJoined = participants.some((p) => p.user_id === user.id);

  if (!alreadyJoined) {
    await addParticipant({
      id: crypto.randomUUID(),
      conversation_id: invite.conversation_id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ conversationId: invite.conversation_id });
}