"use client";

import { useState, useEffect } from "react";
import { RealtimeChat } from "@/components/RealtimeChat";
import { Auth } from "@/components/Auth";
import { Card } from "@/components/ui/card";
import { Globe, Languages, MessageSquare } from "lucide-react";
import { supabase } from "@/hooks/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

// Global conversation ID - everyone uses this same conversation
const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

export default function Messaging() {
  const [user, setUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        initializeConversation(data.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        initializeConversation(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeConversation = async (userId: string) => {
    try {
      console.log('🚀 Initializing global conversation for user:', userId);

      // Check if global conversation exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", GLOBAL_CONVERSATION_ID)
        .maybeSingle();

      console.log('Existing conversation:', existingConv);

      // Create global conversation if it doesn't exist
      if (!existingConv) {
        console.log('Creating global conversation with ID:', GLOBAL_CONVERSATION_ID);
        const { error: createError } = await supabase
          .from("conversations")
          .insert({ id: GLOBAL_CONVERSATION_ID });

        if (createError && createError.code !== '23505') { // 23505 = duplicate key (already exists)
          console.error("Error creating global conversation:", createError);
          throw createError;
        }
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", GLOBAL_CONVERSATION_ID)
        .eq("user_id", userId)
        .maybeSingle();

      console.log('Existing participant:', existingParticipant);

      // Add user as participant if not already
      if (!existingParticipant) {
        console.log('Adding user as participant');
        const { error: participantError } = await supabase
          .from("conversation_participants")
          .insert({
            conversation_id: GLOBAL_CONVERSATION_ID,
            user_id: userId,
          });

        if (participantError && participantError.code !== '23505') {
          console.error("Error adding participant:", participantError);
          throw participantError;
        }
      }

      console.log('✅ Setting conversation ID:', GLOBAL_CONVERSATION_ID);
      setConversationId(GLOBAL_CONVERSATION_ID);
    } catch (error) {
      const err = error as { message?: string; details?: string; hint?: string; code?: string };
      console.error("Error initializing conversation:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        full: error
      });
      toast.error(err?.message || "Помилка створення чату");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
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
        <h1 className="text-2xl font-bold text-center mb-5">
          Чат без обмежень
        </h1>
        <p className="text-lg font-medium text-center">
          Спілкуйся швидко, зручно й без бар’єрів.
        </p>

        {!user && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Автопереклад</h3>
                <p className="text-sm text-muted-foreground">
                  Миттєвий переклад за допомогою AI
                </p>
              </Card>

              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">7 мов</h3>
                <p className="text-sm text-muted-foreground">
                  Українська, англійська, польська та інші
                </p>
              </Card>

              <Card className="p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Realtime чат</h3>
                <p className="text-sm text-muted-foreground">
                  Миттєва доставка повідомлень
                </p>
              </Card>
            </div>

            <Auth />
          </>
        )}

        {user && conversationId && (
          <>
            <RealtimeChat conversationId={conversationId} onSignOut={handleSignOut} />

            <Card className="p-6 mt-8 bg-accent/50 border-accent">
              <h3 className="font-semibold text-foreground mb-3">💡 Підказка</h3>
              <p className="text-sm text-muted-foreground">
                Використовуйте цей чат для спілкування з роботодавцями з різних країн.
                Введіть текст вашою мовою, виберіть мову перекладу, і система автоматично
                перекладе ваше повідомлення. Всі повідомлення оновлюються в реальному часі!
              </p>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
