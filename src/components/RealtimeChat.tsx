import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/hooks/client";
import { toast } from "sonner";
import { sendMessage } from "@/utils/supabase/chat";
import { User } from "@supabase/supabase-js";
import { Send, LogOut } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  sender_id: string;
  original_text: string;
  translated_text: string | null;
  target_language: string | null;
  created_at: string;
}

interface RealtimeChatProps {
  conversationId: string;
  onSignOut: () => void;
  user: User;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email?: string;
}

interface Props {
  conversationId: string;
  onSignOut: () => void;
  user: User;
}

export const RealtimeChat = ({ conversationId, onSignOut, user }: RealtimeChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("uk");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [text, setText] = useState("");

  const languages = [
    { code: "uk", name: "Українська UA" },
    { code: "en", name: "English EN" },
    { code: "pl", name: "Polski PL" },
    { code: "de", name: "Deutsch DE" },
    { code: "fr", name: "Français FR" },
    { code: "es", name: "Español ES" },
    { code: "it", name: "Italiano IT" },
  ];

  const loadUserProfiles = useCallback(async (userIds: string[]) => {
    // Get profiles from database
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    console.log('Loaded profiles from DB:', profiles);

    // Get current user to show their email
    const { data: { user } } = await supabase.auth.getUser();

    // Use functional update to avoid dependency on userProfiles
    setUserProfiles((prevProfiles) => {
      const profilesMap = new Map(prevProfiles);
      // Add profiles to map
      if (profiles) {
        profiles.forEach(profile => {
          const displayName = profile.full_name || 'User';
          profilesMap.set(profile.id, {
            id: profile.id,
            full_name: displayName,
          });
        });
      }

      // For current user, use their email as display name
      if (user && userIds.includes(user.id)) {
        const displayName = user.email?.split('@')[0] || 'You';
        console.log('Current user:', user.id, 'Display name:', displayName);
        profilesMap.set(user.id, {
          id: user.id,
          full_name: displayName,
          email: user.email,
        });
      }

      return profilesMap;
    });
  }, []); // Empty dependencies - function never recreates

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Помилка завантаження повідомлень");
    } else {
      setMessages(data || []);
      // Load profiles for all unique senders
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(msg => msg.sender_id))];
        await loadUserProfiles(senderIds);
      }
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // loadUserProfiles stable (empty deps), safe to omit

  useEffect(() => {
    // Отримати поточного користувача
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    // Завантажити існуючі повідомлення
    loadMessages();

    // ✅ Один єдиний канал для Realtime
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      // Нові повідомлення
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            const exists = current.some((msg) => msg.id === newMessage.id);
            if (exists) return current;
            return [...current, newMessage];
          });

          // Якщо профілю відправника ще немає — підвантажуємо
          setUserProfiles((prev) => {
            if (!prev.has(newMessage.sender_id)) {
              loadUserProfiles([newMessage.sender_id]);
            }
            return prev;
          });

          // Прибрати typing-індикатор
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(newMessage.sender_id);
            return next;
          });

          scrollToBottom();
        }
      )
      // Typing broadcast
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId, isTyping } = payload as { userId: string; isTyping: boolean };
        if (userId !== currentUserId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (isTyping) next.add(userId);
            else next.delete(userId);
            return next;
          });
        }
      })
      .subscribe((status) => {
        console.log("🔌 Realtime status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Subscribed to:", conversationId);
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Channel error!");
        }
      });

    // 🔥 При розмонтуванні видаляємо канал
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // loadMessages and loadUserProfiles are stable, currentUserId not needed in deps

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  const broadcastTyping = async (isTyping: boolean) => {
    const channel = supabase.channel(`conversation:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping },
    });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return; // нічого не відправляємо, якщо поле порожнє

    if (!currentUserId) {
      toast.error("Помилка: користувач не авторизований");
      return;
    }

    setIsLoading(true);

    try {
      // Припиняємо індикатор набору тексту
      broadcastTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      console.log('📤 Sending message:', {
        conversationId,
        sender_id: currentUserId,
        text: inputText.substring(0, 20) + '...'
      });

      // Вставляємо повідомлення у базу
      const { data: newMessage, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          original_text: inputText,
          translated_text: null, // можна додати переклад, коли буде логіка
          content: inputText,
          type: 'text',
          target_language: targetLanguage,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        toast.error("Помилка відправки повідомлення");
        return;
      }

      // Оновлюємо UI одразу
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage as Message]);
        scrollToBottom();
      }

      // Очищаємо поле вводу
      setInputText("");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error("Сталася помилка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Broadcast typing indicator
    if (e.target.value.trim()) {
      broadcastTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000);
    } else {
      broadcastTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) {
      toast.error("Введіть текст");
      return;
    }

    console.log('📤 Sending message:', {
      conversationId,
      currentUserId,
      text: inputText.substring(0, 20) + '...'
    });

    if (!currentUserId) {
      console.error('❌ No current user ID!');
      toast.error("Помилка: користувач не авторизований");
      return;
    }

    // Stop typing indicator when sending
    broadcastTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsLoading(true);
    try {
      // TODO: Enable translation when Edge Function is deployed
      const translatedText = null;

      // Save message to database and get the inserted row
      const { data: newMessage, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          original_text: inputText,
          translated_text: translatedText,
          target_language: targetLanguage,
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Database error:', messageError);
        throw messageError;
      }

      // Optimistically update UI immediately
      if (newMessage) {
        setMessages((current) => [...current, newMessage as Message]);
        scrollToBottom();
      }

      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Помилка відправки повідомлення");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="p-6 shadow-card max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-foreground">
          Багатомовний чат 🌐
        </h3>
        <Button variant="outline" size="sm" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Вийти
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-foreground">Перекладати на:</label>
        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[500px] border border-border rounded-lg p-4 mb-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            Немає повідомлень. Почніть розмову!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUserId;
              const senderProfile = userProfiles.get(msg.sender_id);
              const senderName = isOwnMessage
                ? "Ви"
                : senderProfile?.full_name || senderProfile?.email?.split('@')[0] || "Користувач";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"
                    }`}
                >
                  {/* Sender name */}
                  <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
                    {senderName}
                  </span>

                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                      }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {msg.original_text}
                    </p>
                    {msg.translated_text && (
                      <p className="text-xs opacity-80 italic">
                        {msg.translated_text}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-start">
                <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          type="text"
          value={inputText}        // використовуємо inputText, а не text
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Введіть повідомлення..."
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

    </Card>
  );
};
