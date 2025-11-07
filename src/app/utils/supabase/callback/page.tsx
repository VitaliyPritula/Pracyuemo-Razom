"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/hooks/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      if (!supabase) return;
       const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error("Auth error:", error.message);
        return;
      }

      // Беремо параметр next і редіректимо
      const urlParams = new URLSearchParams(window.location.search);
      const next = urlParams.get("next") || "/messaging";
      router.replace(next);
    };

    handleAuth();
  }, [router]);

  return <div>Авторизація...</div>;
}
