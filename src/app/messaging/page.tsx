"use client";

import { useState, useEffect } from "react";
import { RealtimeChat } from "@/components/RealtimeChat";
import { Auth } from "@/components/Auth";
import { Card } from "@/components/ui/card";
import { Globe, Languages, MessageSquare } from "lucide-react";
import { supabase } from "@/hooks/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { ChatSidebar } from "./ChatSidebar";

// Глобальний чат для всіх користувачів
const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

export default function Messaging() {
  const [user, setUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createChatWithInvite = async () => {
    if (!supabase || !user) return;
    const conversationId = crypto.randomUUID();

    await supabase.from("conversations").insert({ id: conversationId });
    await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: user.id,
    });

    const token = crypto.randomUUID();

    await supabase.from("conversation_invites").insert({
      conversation_id: conversationId,
      token,
      created_by: user.id,
    });

    setInviteToken(token);
    setIsModalOpen(true); // відкриваємо модал
  };

  const link = inviteToken
    ? `${window.location.origin}/chat/invite/${inviteToken}`
    : null;

  useEffect(() => {
    if (!supabase) return;
    // Отримуємо поточного користувача
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        initializeConversation(data.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Слухаємо зміни авторизації
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        initializeConversation(session.user.id);
      }
    });

    const joinByInvite = async () => {
      const { data: invite } = await supabase
        .from("conversation_invites")
        .select("conversation_id")
        .single();

      if (!invite) {
        toast.error("Посилання недійсне");
        return;
      }

      // додаємо користувача до чату
      await supabase.from("conversation_participants").insert({
        conversation_id: invite.conversation_id,
        user_id: user.id,
      });

      router.push(`/chat?conversation=${invite.conversation_id}`);
    };

    joinByInvite();

    return () => subscription.unsubscribe();
  }, []);

  const initializeConversation = async (userId: string) => {
    try {
      setIsLoading(true);
      if (!supabase) return;
      // Перевіряємо, чи існує глобальний чат
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", GLOBAL_CONVERSATION_ID)
        .maybeSingle();

      if (!existingConv) {
        // Створюємо глобальний чат
        const { error: createError } = await supabase
          .from("conversations")
          .insert({ id: GLOBAL_CONVERSATION_ID });
        if (createError && createError.code !== "23505") throw createError;
      }

      // Додаємо користувача як учасника, якщо ще немає
      const { data: existingParticipant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", GLOBAL_CONVERSATION_ID)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingParticipant) {
        const { error: participantError } = await supabase
          .from("conversation_participants")
          .insert({
            conversation_id: GLOBAL_CONVERSATION_ID,
            user_id: userId,
          });
        if (participantError && participantError.code !== "23505") throw participantError;
      }

      setConversationId(GLOBAL_CONVERSATION_ID);
    } catch (error) {
      console.error("Error initializing conversation:", error);
      toast.error("Помилка створення чату");
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setConversationId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center">
            <p className="text-muted-foreground">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-2xl font-bold text-center mb-5">Чат без обмежень</h1>
        <p className="text-lg font-medium text-center">Спілкуйся швидко, зручно й без бар’єрів.</p>
        {user && (
          <div className="text-center my-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={createChatWithInvite}
            >
              Створити приватний чат
            </button>
          </div>
        )}

        {link && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Посилання для запрошення:
            </p>
            <a
              href={link}
              className="text-blue-600 underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link}
            </a>
          </div>
        )}

        {isModalOpen && inviteToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 text-center relative">
              <h2 className="text-lg font-bold mb-4">Посилання для запрошення</h2>
              <input
                type="text"
                value={`${window.location.origin}/chat/invite/${inviteToken}`}
                readOnly
                className="w-full p-2 border rounded mb-4 text-sm"
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/chat/invite/${inviteToken}`);
                  toast.success("Скопійовано!");
                }}
              >
                Копіювати
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Закрити
              </button>
            </div>
          </div>
        )}
        {!user && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">

              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Автопереклад</h3>
                <p className="text-sm text-muted-foreground">Миттєвий переклад за допомогою AI</p>
              </Card>

              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">7 мов</h3>
                <p className="text-sm text-muted-foreground">Українська, англійська, польська та інші</p>
              </Card>

              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Realtime чат</h3>
                <p className="text-sm text-muted-foreground">Миттєва доставка повідомлень</p>
              </Card>
            </div>

            <Auth />
          </>
        )}

        {user && (
          <div className="flex gap-4 mt-6">
            <ChatSidebar
              userId={user.id}
              activeConversationId={conversationId}
              onSelect={setConversationId}
            />

            {conversationId && (
              <RealtimeChat
                conversationId={conversationId}
                onSignOut={handleSignOut}
                user={user}
              />
            )}
          </div>
        )}


      </div>
    </main>
  );
}
