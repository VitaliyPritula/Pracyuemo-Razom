import { readDb } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split("; ")
      .find((item) => item.startsWith("chat_session="));
    const cookiesList = await cookies();
    const sessionToken = sessionCookie?.split("=")[1] ?? cookiesList.get("chat_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const db = await readDb();
    const session = db.sessions.find((item) => item.token === sessionToken);

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ user: null });
    }

    const user = db.users.find((item) => item.id === session.user_id);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
