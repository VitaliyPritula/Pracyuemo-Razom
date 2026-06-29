import { createId } from "@/lib/auth";
import {
  getSessionByToken,
  getUserById,
  getParticipantsByConversation,
  getMessagesByConversation,
  createMessage,
  supabase,
} from "@/lib/db";
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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId не вказано" }, { status: 400 });
  }

  const participants = await getParticipantsByConversation(conversationId);
  if (!participants.some((p) => p.user_id === user.id)) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  const messages = await getMessagesByConversation(conversationId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId, text, attachments } = body as {
    conversationId?: string;
    text?: string;
    attachments?: { name: string; type: string; size: number; data: string }[];
  };

  if (!conversationId || (!text && (!attachments || attachments.length === 0))) {
    return NextResponse.json({ error: "conversationId або text/attachments відсутні" }, { status: 400 });
  }

  const participants = await getParticipantsByConversation(conversationId);
  if (!participants.some((p) => p.user_id === user.id)) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  const message = {
    id: createId(),
    conversation_id: conversationId,
    sender_id: user.id,
    original_text: text ?? "",
    attachments: attachments?.length ? attachments : undefined,
    created_at: new Date().toISOString(),
  };

  await createMessage(message);
  return NextResponse.json({ message });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id не вказано" }, { status: 400 });
  }

  const { data: message } = await supabase.from("messages").select("*").eq("id", id).single();
  if (!message) {
    return NextResponse.json({ error: "Повідомлення не знайдено" }, { status: 404 });
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: "Немає права видаляти" }, { status: 403 });
  }

  await supabase.from("messages").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Неавторизований користувач" }, { status: 401 });
  }

  const body = await request.json();
  const { id, text } = body as { id?: string; text?: string };
  if (!id || !text) {
    return NextResponse.json({ error: "id або text відсутні" }, { status: 400 });
  }

  const { data: message } = await supabase.from("messages").select("*").eq("id", id).single();
  if (!message) {
    return NextResponse.json({ error: "Повідомлення не знайдено" }, { status: 404 });
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: "Немає права редагувати" }, { status: 403 });
  }

  const { data: updated } = await supabase
    .from("messages")
    .update({ original_text: text })
    .eq("id", id)
    .select()
    .single();

  return NextResponse.json({
    message: {
      id: updated.id,
      conversation_id: updated.conversation_id,
      sender_id: updated.sender_id,
      original_text: updated.original_text,
      attachments: updated.attachments ?? [],
      created_at: updated.created_at,
    },
  });
}