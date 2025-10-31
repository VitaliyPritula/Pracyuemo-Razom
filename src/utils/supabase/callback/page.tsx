"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/hooks/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

      if (error) {
        console.error("Auth error:", error.message);
        return;
      }

      // Беремо параметр next і редіректимо
      const urlParams = new URLSearchParams(window.location.search);
      const next = urlParams.get("next") || "/communicator";
      router.replace(next);
    };

    handleAuth();
  }, [router]);

  return <div>Авторизація...</div>;
}
