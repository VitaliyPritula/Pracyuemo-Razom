"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Messaging from "./Messaging";

export default function MessagingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("not authenticated");
        }

        const data = await response.json();
        if (!data.user) {
          throw new Error("not authenticated");
        }
      } catch {
        router.replace("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Перевіряємо авторизацію...</p>
      </div>
    );
  }

  return <Messaging />;
}
