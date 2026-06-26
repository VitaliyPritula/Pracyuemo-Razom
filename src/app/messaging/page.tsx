"use client";

import { RealtimeChat } from "@/app/messaging/RealtimeChat";
import { Auth } from "@/components/Auth";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  Conversation,
  createConversationInvite,
  deleteConversation,
  fetchConversations,
  logoutUser,
} from "@/lib/api";
import { Globe, Languages, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatSidebar } from "./ChatSidebar";

export default function Messaging() {
  const { user, loading: authLoading } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const link = inviteToken
    ? `${window.location.origin}/messaging/invite/${inviteToken}`
    : null;

  const loadConversations = async (preferredConversationId?: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { conversations } = await fetchConversations();
      setConversations(conversations);

      if (!preferredConversationId && !conversationId && conversations.length > 0) {
        setConversationId(conversations[0].id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося завантажити чати";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const createChatWithInvite = async () => {
    if (!user) return;

    try {
      const { token, conversationId } = await createConversationInvite();
      setInviteToken(token);
      setConversationId(conversationId);
      setInfoMessage("Приватний чат створено. Посилання готово.");
      setErrorMessage(null);
      await loadConversations(conversationId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося створити чат";
      setErrorMessage(message);
      setInfoMessage(null);
      toast.error(message);
    }
  };

  const deleteChat = async (conversationIdToDelete: string) => {
    if (!user) return;

    try {
      await deleteConversation(conversationIdToDelete);
      setInviteToken(null);
      setInfoMessage("Чат видалено");
      setErrorMessage(null);

      const { conversations: updatedConversations } = await fetchConversations();
      setConversations(updatedConversations);

      if (conversationId === conversationIdToDelete) {
        setConversationId(updatedConversations[0]?.id ?? null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося видалити чат";
      setErrorMessage(message);
      setInfoMessage(null);
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      window.location.reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося вийти";
      toast.error(message);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const queryConversation = searchParams?.get("conversation");
    if (queryConversation) {
      setConversationId(queryConversation);
    }
  }, [searchParams]);

  if (authLoading || isLoading) {
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
          <div className="text-center my-4 space-y-3">
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={createChatWithInvite}
              // onClick={createChat}
              >
                Створити чат
              </button>
            </div>
            {infoMessage && (
              <p className="mt-2 text-sm text-foreground">{infoMessage}</p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
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
              conversations={conversations}
              activeConversationId={conversationId}
              onSelect={setConversationId}
              onDelete={deleteChat}
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
