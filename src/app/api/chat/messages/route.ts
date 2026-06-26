import { createId } from "@/lib/auth";
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

  const db = await readDb();
  const isParticipant = db.conversation_participants.some(
    (item) => item.conversation_id === conversationId && item.user_id === user.id
  );

  if (!isParticipant) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  const messages = db.messages
    .filter((message) => message.conversation_id === conversationId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

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

  const db = await readDb();
  const isParticipant = db.conversation_participants.some(
    (item) => item.conversation_id === conversationId && item.user_id === user.id
  );

  if (!isParticipant) {
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

  db.messages.push(message);
  await writeDb(db);

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

  const db = await readDb();
  const message = db.messages.find((item) => item.id === id);
  if (!message) {
    return NextResponse.json({ error: "Повідомлення не знайдено" }, { status: 404 });
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: "Немає права видаляти" }, { status: 403 });
  }

  db.messages = db.messages.filter((item) => item.id !== id);
  await writeDb(db);

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

  const db = await readDb();
  const message = db.messages.find((item) => item.id === id);
  if (!message) {
    return NextResponse.json({ error: "Повідомлення не знайдено" }, { status: 404 });
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: "Немає права редагувати" }, { status: 403 });
  }

  message.original_text = text;
  await writeDb(db);

  return NextResponse.json({ message });
}
