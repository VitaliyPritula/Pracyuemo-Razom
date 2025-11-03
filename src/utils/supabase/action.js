"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/utils/supabase/server";

export const signInWithGoogle = async () => {
  // 🟢 await тут обовʼязковий
  const supabase = await createClientForServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Після успішного входу користувача перекине на /messaging
      redirectTo: `${process.env.SITE_URL}/auth/callback?next=/messaging`,
    },
  });

  if (error) {
    console.error("Auth error:", error.message);
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
};
