import { supabase } from "@/hooks/client";

let initialized = false;

export const initAuthListener = () => {
  if (initialized) return;
  initialized = true;
if (!supabase) return;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      console.log("✅ Signed in", session.user.email);
    }

    if (event === "TOKEN_REFRESHED") {
      console.log("🔄 Token refreshed");
    }

    if (event === "SIGNED_OUT") {
      console.log("🚪 Signed out");
    }
  });
};
