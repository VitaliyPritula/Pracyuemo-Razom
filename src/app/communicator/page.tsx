"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Volume2, FileText, Languages } from "lucide-react";
import { toast } from "sonner";

interface CommunicatorProps {
  title?: string;
  placeholder?: string;
}

export default function Communicator({ 
  title = "Комунікатор", 
  placeholder = "Напишіть, що хочете сказати..." 
}: CommunicatorProps)  {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = (language: string = "uk-UA") => {
    if (!text.trim()) {
      toast.error("Введіть текст для озвучення");
      return;
    }

    if (!window.speechSynthesis) {
      toast.error("Ваш браузер не підтримує синтез мови");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Помилка озвучення");
    };

    window.speechSynthesis.speak(utterance);
    toast.success(
      language === "uk-UA" 
        ? "Озвучення українською" 
        : "Speaking in English"
    );
  };

  const showText = () => {
    if (!text.trim()) {
      toast.error("Текст порожній");
      return;
    }
    toast.success("Текст скопійовано", {
      description: text,
    });
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] mb-4 resize-none"
        aria-label="Текст для озвучення"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => speakText("uk-UA")}
          disabled={isSpeaking}
          className="flex items-center gap-2"
          aria-label="Озвучити українською"
        >
          <Volume2 className="w-4 h-4" />
          Озвучити українською
        </Button>

        <Button
          onClick={() => speakText("en-US")}
          disabled={isSpeaking}
          variant="outline"
          className="flex items-center gap-2"
          aria-label="Speak in English"
        >
          <Languages className="w-4 h-4" />
          Озвучити англійською
        </Button>

        <Button
          onClick={showText}
          variant="outline"
          className="flex items-center gap-2"
          aria-label="Показати текст"
        >
          <FileText className="w-4 h-4" />
          Показати текст
        </Button>
      </div>

      {isSpeaking && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          Озвучення...
        </div>
      )}
    </Card>
  );
};
