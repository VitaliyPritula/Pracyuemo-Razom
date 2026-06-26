import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "crypto";

const SALT_LENGTH = 16;
const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";
export const SESSION_COOKIE_NAME = "chat_session";

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split("$");
  if (!salt || !hash) {
    return false;
  }

  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return timingSafeEqual(Buffer.from(hash, "hex"), derived);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function createId() {
  return randomUUID();
}
