import { useEffect, useState } from "react";
import { supabase } from "@/hooks/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Conversation {
  id: string;
  updated_at?: string;
  last_message?: string;
}

interface Props {
  userId: string;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

export const ChatSidebar = ({ userId, activeConversationId, onSelect }: Props) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Завантаження чатів
  useEffect(() => {

    const loadConversations = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations (
            id,
            messages (
              original_text,
              created_at
            )
          )
        `)
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        return;
      }

      const formatted = data.map((row: any) => {
        const messages = row.conversations.messages;
        const last = messages?.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          id: row.conversation_id,
          last_message: last?.original_text ?? "Без повідомлень",
          updated_at: last?.created_at,
        };
      });

      setConversations(formatted);
    };

    loadConversations();
  }, [userId]);

  // Видалення чату
  const handleDeleteChat = async (chatId: string) => {
    if (chatId === GLOBAL_CONVERSATION_ID) {
      toast.error("Глобальний чат видаляти не можна");
      return;
    }
    if (!supabase) return;
    const { error: delParticipantsError } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", chatId);

    if (delParticipantsError) {
      console.error(delParticipantsError);
      toast.error("Помилка при видаленні учасників чату");
      return;
    }

    if (!supabase) return;
    const { error: delConversationError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", chatId);

    if (delConversationError) {
      console.error(delConversationError);
      toast.error("Помилка при видаленні чату");
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== chatId));
    setOpenDropdownId(null);
    toast.success("Чат успішно видалено");
  };

  return (
    <Card className="w-72 h-[600px] p-3 overflow-y-auto">
      <h3 className="font-semibold mb-3">Чати</h3>

      <div className="space-y-2">
        {conversations.map(chat => (
          <div key={chat.id} className="relative">
            <button
              onClick={() => onSelect(chat.id)}
              className={cn(
                "w-full text-left p-2 rounded hover:bg-muted",
                chat.id === activeConversationId && "bg-muted"
              )}
            >
              <div className="text-sm font-medium truncate flex justify-between items-center">
                {chat.id === GLOBAL_CONVERSATION_ID
                  ? "🌍 Глобальний чат"
                  : "Приватний чат"}

                {/* Dropdown trigger */}
                <button
                  className="px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === chat.id ? null : chat.id);
                  }}
                >
                  ...
                </button>
              </div>

              <div className="text-xs text-muted-foreground truncate">
                {chat.last_message}
              </div>
            </button>

            {/* Dropdown menu */}
            {openDropdownId === chat.id && (
              <div className="absolute right-2 top-8 w-40 bg-white border rounded shadow-md z-50">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                >
                  Видалити чат
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast("Функціонал перейменування ще не реалізовано");
                    setOpenDropdownId(null);
                  }}
                >
                  Перейменувати чат
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
