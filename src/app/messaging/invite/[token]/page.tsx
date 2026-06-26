"use client";

import { joinInvite } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InvitePage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const joinChat = async () => {
            if (!token) {
                router.push("/messaging");
                return;
            }

            try {
                const { conversationId } = await joinInvite(token);
                router.push(`/messaging?conversation=${conversationId}`);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Невідома помилка";
                toast.error(message);
                router.push("/messaging");
            } finally {
                setLoading(false);
            }
        };

        joinChat();
    }, [token, router]);

    if (loading) {
        return <p className="text-center mt-10">Підключаємо до чату…</p>;
    }

    return null;
}
