import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deleteMessage, fetchMessages, sendMessage, updateMessage } from "@/lib/api";
import { LogOut, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  original_text: string;
  created_at: string;
}

interface RealtimeChatProps {
  conversationId: string;
  onSignOut: () => void;
  user: { id: string; email: string };
}

export const RealtimeChat = ({ conversationId, onSignOut, user }: RealtimeChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  };

  const loadMessages = async () => {
    try {
      const { messages } = await fetchMessages(conversationId);
      setMessages(messages);
      scrollToBottom();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Помилка завантаження повідомлень";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    loadMessages();

    const polling = setInterval(loadMessages, 4000);
    return () => clearInterval(polling);
  }, [conversationId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    try {
      const { message } = await sendMessage(conversationId, text);
      setMessages((prev) => [...prev, message]);
      setInputText("");
      scrollToBottom();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося відправити повідомлення";
      toast.error(message);
      console.error(error);
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!confirm("Видалити повідомлення?")) return;

    try {
      await deleteMessage(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося видалити повідомлення";
      toast.error(message);
      console.error(error);
    }
  };

  const handleSaveEdit = async (msg: Message) => {
    const newText = editingText.trim();
    if (!newText || newText === msg.original_text) {
      setEditingMessageId(null);
      return;
    }

    try {
      const { message } = await updateMessage(msg.id, newText);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? message : m)));
      setEditingMessageId(null);
      toast.success("Повідомлення оновлено");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося оновити повідомлення";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <Card className="p-6 shadow-card max-w-4xl mx-auto">
      <div className="flex justify-between mb-4">
        <h3 className="text-2xl font-semibold">Чат</h3>
        <Button onClick={onSignOut} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-1" /> Вийти
        </Button>
      </div>

      <ScrollArea className="h-[500px] border rounded p-4 mb-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user.id;
            const isEditing = editingMessageId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div className={`p-2 rounded ${isOwn ? "bg-blue-100" : "bg-gray-200"} w-fit`}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(msg);
                          if (e.key === "Escape") setEditingMessageId(null);
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(msg)}>
                        💾
                      </Button>
                    </div>
                  ) : (
                    msg.original_text
                  )}
                </div>

                {isOwn && !isEditing && (
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <button
                      className="text-blue-500"
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditingText(msg.original_text);
                      }}
                    >
                      Редагувати
                    </button>
                    <button className="text-red-500" onClick={() => handleDelete(msg)}>
                      Видалити
                    </button>
                  </div>
                )}

                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Введіть повідомлення..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
