import { createId } from "@/lib/auth";
import {
  getSessionByToken,
  getUserById,
  getConversationById,
  createConversation,
  getConversationsByUserId,
  getParticipantsByConversation,
  addParticipant,
  getMessagesByConversation,
  createInvite,
  supabase,
} from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

async function getCurrentUser() {
  const cookiesList = await cookies();
  const sessionToken = cookiesList.get("chat_session")?.value;
  if (!sessionToken) return null;

  const session = await getSessionByToken(sessionToken);
  if (!session || new Date(session.expires_at) < new Date()) return null;

  return getUserById(session.user_id);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  // Забезпечуємо існування глобального чату
  const globalConversation = await getConversationById(GLOBAL_CONVERSATION_ID);
  if (!globalConversation) {
    await createConversation({
      id: GLOBAL_CONVERSATION_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Додаємо юзера до глобального чату якщо ще не учасник
  const globalParticipants = await getParticipantsByConversation(GLOBAL_CONVERSATION_ID);
  const isGlobalParticipant = globalParticipants.some((p) => p.user_id === user.id);
  if (!isGlobalParticipant) {
    await addParticipant({
      id: createId(),
      conversation_id: GLOBAL_CONVERSATION_ID,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
  }

  const participantRows = await getConversationsByUserId(user.id);

  const formatted = await Promise.all(
    participantRows.map(async (participant) => {
      const messages = await getMessagesByConversation(participant.conversation_id);
      const lastMessage = messages[messages.length - 1];
      return {
        id: participant.conversation_id,
        last_message: lastMessage?.original_text ?? "Без повідомлень",
        updated_at: lastMessage?.created_at,
      };
    })
  );

  return NextResponse.json({ conversations: formatted });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const body = await request.json();
  const { createInvite: shouldCreateInvite = false } = body as { createInvite?: boolean };

  const conversationId = createId();
  const inviteToken = shouldCreateInvite ? createId() : undefined;

  await createConversation({
    id: conversationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await addParticipant({
    id: createId(),
    conversation_id: conversationId,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  });

  if (shouldCreateInvite && inviteToken) {
    await createInvite({
      id: createId(),
      conversation_id: conversationId,
      token: inviteToken,
      created_by: user.id,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    shouldCreateInvite ? { token: inviteToken, conversationId } : { conversationId }
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

  const participants = await getParticipantsByConversation(conversationId);
  const isParticipant = participants.some((p) => p.user_id === user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  // Каскадне видалення через ON DELETE CASCADE в БД, але явно чистимо все
  await supabase.from("messages").delete().eq("conversation_id", conversationId);
  await supabase.from("conversation_participants").delete().eq("conversation_id", conversationId);
  await supabase.from("conversation_invites").delete().eq("conversation_id", conversationId);
  await supabase.from("conversations").delete().eq("id", conversationId);

  return NextResponse.json({ success: true });
}