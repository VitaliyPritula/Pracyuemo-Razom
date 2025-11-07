// utils/supabase/chat.ts
import { supabase } from "@/hooks/client";

/**
 * Надсилає повідомлення в конкретну розмову
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  targetLanguage?: string
) => {
  try {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          original_text: text,
          target_language: targetLanguage || null,
        },
      ])
      .select("*") // важливо, щоб отримати створений рядок

    if (error) throw error;
    return data[0]; // повертаємо створене повідомлення
  } catch (err) {
    console.error("❌ Database error:", err);
    throw err;
  }
};
