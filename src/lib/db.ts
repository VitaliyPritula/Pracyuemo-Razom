import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types (без змін) ────────────────────────────────────────────────────────

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

export type SessionRecord = {
  token: string;
  user_id: string;
  expires_at: string;
};

export type ConversationRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipantRecord = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
};

export type MessageAttachmentRecord = {
  name: string;
  type: string;
  size: number;
  data: string;
};

export type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  original_text: string;
  attachments?: MessageAttachmentRecord[];
  created_at: string;
};

export type ConversationInviteRecord = {
  id: string;
  conversation_id: string;
  token: string;
  created_by: string;
  created_at: string;
};

// ─── Helpers (маппінг snake_case з БД → camelCase для типів) ─────────────────

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
  };
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    token: row.token as string,
    user_id: row.user_id as string,
    expires_at: row.expires_at as string,
  };
}

function mapConversation(row: Record<string, unknown>): ConversationRecord {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapParticipant(row: Record<string, unknown>): ConversationParticipantRecord {
  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    user_id: row.user_id as string,
    joined_at: row.joined_at as string,
  };
}

function mapMessage(row: Record<string, unknown>): MessageRecord {
  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    sender_id: row.sender_id as string,
    original_text: row.original_text as string,
    attachments: (row.attachments as MessageAttachmentRecord[]) ?? [],
    created_at: row.created_at as string,
  };
}

function mapInvite(row: Record<string, unknown>): ConversationInviteRecord {
  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    token: row.token as string,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UserRecord[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
  if (error) return null;
  return mapUser(data);
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
  if (error) return null;
  return mapUser(data);
}

export async function createUser(user: UserRecord): Promise<void> {
  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
  });
  if (error) throw error;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessionByToken(token: string): Promise<SessionRecord | null> {
  const { data, error } = await supabase.from("sessions").select("*").eq("token", token).single();
  if (error) return null;
  return mapSession(data);
}

export async function createSession(session: SessionRecord): Promise<void> {
  const { error } = await supabase.from("sessions").insert({
    token: session.token,
    user_id: session.user_id,
    expires_at: session.expires_at,
  });
  if (error) throw error;
}

export async function deleteSession(token: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("token", token);
  if (error) throw error;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(): Promise<ConversationRecord[]> {
  const { data, error } = await supabase.from("conversations").select("*");
  if (error) throw error;
  return (data ?? []).map(mapConversation);
}

export async function getConversationById(id: string): Promise<ConversationRecord | null> {
  const { data, error } = await supabase.from("conversations").select("*").eq("id", id).single();
  if (error) return null;
  return mapConversation(data);
}

export async function createConversation(conv: ConversationRecord): Promise<void> {
  const { error } = await supabase.from("conversations").insert({
    id: conv.id,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
  });
  if (error) throw error;
}

export async function updateConversationTimestamp(id: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Conversation Participants ────────────────────────────────────────────────

export async function getParticipantsByConversation(
  conversation_id: string
): Promise<ConversationParticipantRecord[]> {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", conversation_id);
  if (error) throw error;
  return (data ?? []).map(mapParticipant);
}

export async function getConversationsByUserId(
  user_id: string
): Promise<ConversationParticipantRecord[]> {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("user_id", user_id);
  if (error) throw error;
  return (data ?? []).map(mapParticipant);
}

export async function addParticipant(p: ConversationParticipantRecord): Promise<void> {
  const { error } = await supabase.from("conversation_participants").insert({
    id: p.id,
    conversation_id: p.conversation_id,
    user_id: p.user_id,
    joined_at: p.joined_at,
  });
  if (error) throw error;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessagesByConversation(
  conversation_id: string
): Promise<MessageRecord[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function createMessage(msg: MessageRecord): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    original_text: msg.original_text,
    attachments: msg.attachments ?? [],
    created_at: msg.created_at,
  });
  if (error) throw error;
}

// ─── Conversation Invites ─────────────────────────────────────────────────────

export async function getInviteByToken(token: string): Promise<ConversationInviteRecord | null> {
  const { data, error } = await supabase
    .from("conversation_invites")
    .select("*")
    .eq("token", token)
    .single();
  if (error) return null;
  return mapInvite(data);
}

export async function createInvite(invite: ConversationInviteRecord): Promise<void> {
  const { error } = await supabase.from("conversation_invites").insert({
    id: invite.id,
    conversation_id: invite.conversation_id,
    token: invite.token,
    created_by: invite.created_by,
    created_at: invite.created_at,
  });
  if (error) throw error;
}

export async function deleteInvite(token: string): Promise<void> {
  const { error } = await supabase.from("conversation_invites").delete().eq("token", token);
  if (error) throw error;
}