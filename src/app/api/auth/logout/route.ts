import { readDb, writeDb } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookiesList = await cookies();
  const sessionToken = cookiesList.get("chat_session")?.value;
  if (sessionToken) {
    const db = await readDb();
    db.sessions = db.sessions.filter((session) => session.token !== sessionToken);
    await writeDb(db);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("chat_session", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });

  return response;
}
