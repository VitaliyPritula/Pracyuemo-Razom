import { createId } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

async function getCurrentUser() {
  const cookiesList = await cookies();
  const sessionToken = cookiesList.get("chat_session")?.value;
  if (!sessionToken) return null;

  const db = await readDb();
  const session = db.sessions.find((item) => item.token === sessionToken);
  if (!session || new Date(session.expires_at) < new Date()) return null;

  return db.users.find((user) => user.id === session.user_id) ?? null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const db = await readDb();
  let globalConversation = db.conversations.find((item) => item.id === GLOBAL_CONVERSATION_ID);
  if (!globalConversation) {
    globalConversation = {
      id: GLOBAL_CONVERSATION_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.conversations.push(globalConversation);
  }

  const globalParticipantExists = db.conversation_participants.some(
    (item) => item.conversation_id === GLOBAL_CONVERSATION_ID && item.user_id === user.id
  );

  if (!globalParticipantExists) {
    db.conversation_participants.push({
      id: createId(),
      conversation_id: GLOBAL_CONVERSATION_ID,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
  }

  await writeDb(db);

  const participantRows = db.conversation_participants.filter((item) => item.user_id === user.id);
  const formatted = participantRows.map((participant) => {
    const messages = db.messages
      .filter((message) => message.conversation_id === participant.conversation_id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const lastMessage = messages[messages.length - 1];

    return {
      id: participant.conversation_id,
      last_message: lastMessage?.original_text ?? "Без повідомлень",
      updated_at: lastMessage?.created_at,
    };
  });

  return NextResponse.json({ conversations: formatted });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const body = await request.json();
  const { createInvite = false } = body as { createInvite?: boolean };

  const db = await readDb();
  const conversationId = createId();
  const inviteToken = createInvite ? createId() : undefined;

  db.conversations.push({
    id: conversationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  db.conversation_participants.push({
    id: createId(),
    conversation_id: conversationId,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  });

  if (createInvite) {
    db.conversation_invites.push({
      id: createId(),
      conversation_id: conversationId,
      token: inviteToken!,
      created_by: user.id,
      created_at: new Date().toISOString(),
    });
  }

  await writeDb(db);

  return NextResponse.json(
    createInvite
      ? { token: inviteToken, conversationId }
      : { conversationId }
  );
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId не вказано" }, { status: 400 });
  }

  if (conversationId === GLOBAL_CONVERSATION_ID) {
    return NextResponse.json({ error: "Глобальний чат видаляти заборонено" }, { status: 403 });
  }

  const db = await readDb();
  const participant = db.conversation_participants.find(
    (item) => item.conversation_id === conversationId && item.user_id === user.id
  );

  if (!participant) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  db.conversations = db.conversations.filter((item) => item.id !== conversationId);
  db.conversation_participants = db.conversation_participants.filter(
    (item) => item.conversation_id !== conversationId
  );
  db.messages = db.messages.filter((item) => item.conversation_id !== conversationId);
  db.conversation_invites = db.conversation_invites.filter(
    (item) => item.conversation_id !== conversationId
  );

  await writeDb(db);

  return NextResponse.json({ success: true });
}
