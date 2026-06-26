import fs from "fs/promises";
import path from "path";

const dbDirectory = path.join(process.cwd(), "data");
const dbPath = path.join(dbDirectory, "db.json");

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

export type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  original_text: string;
  created_at: string;
};

export type ConversationInviteRecord = {
  id: string;
  conversation_id: string;
  token: string;
  created_by: string;
  created_at: string;
};

export type Database = {
  users: UserRecord[];
  sessions: SessionRecord[];
  conversations: ConversationRecord[];
  conversation_participants: ConversationParticipantRecord[];
  messages: MessageRecord[];
  conversation_invites: ConversationInviteRecord[];
};

const defaultDatabase: Database = {
  users: [],
  sessions: [],
  conversations: [],
  conversation_participants: [],
  messages: [],
  conversation_invites: [],
};

export async function ensureDbFile() {
  try {
    await fs.access(dbPath);
  } catch {
    await fs.mkdir(dbDirectory, { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(defaultDatabase, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Database> {
  await ensureDbFile();
  const raw = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(raw) as Database;
}

export async function writeDb(db: Database): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf-8");
}
