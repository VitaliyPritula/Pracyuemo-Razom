"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deleteMessage, fetchMessages, sendMessage, translateText, updateMessage } from "@/lib/api";
import { LogOut, Paperclip, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ClipboardEvent } from "react";
import { toast } from "sonner";

interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface Message {
  id: string;
  sender_id: string;
  original_text: string;
  attachments?: MessageAttachment[];
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
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  };

  const loadMessages = useCallback(async () => {
    try {
      const { messages } = await fetchMessages(conversationId);
      setMessages(messages);
      scrollToBottom();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Помилка завантаження повідомлень";
      toast.error(message);
      console.error(error);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    const polling = setInterval(loadMessages, 4000);
    return () => clearInterval(polling);
  }, [loadMessages]);

  useEffect(() => {
    setTranslations({});
  }, [conversationId]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const ukVoice = availableVoices.find((voice) =>
        voice.lang.toLowerCase() === "uk-ua" ||
        voice.lang.toLowerCase().startsWith("uk") ||
        voice.name.toLowerCase().includes("ukrain") ||
        voice.voiceURI.toLowerCase().includes("ukrain")
      );
      setVoiceStatus(
        ukVoice
          ? `Український голос: ${ukVoice.name} (${ukVoice.lang})`
          : "Український голос не знайдено"
      );
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const readFileAsAttachment = (file: File): Promise<MessageAttachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] ?? "";
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const newAttachments = await Promise.all(Array.from(files).map(readFileAsAttachment));
      setAttachments((prev) => [...prev, ...newAttachments]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Не вдалося додати файли");
      console.error(error);
    }
  };

  const handlePaste = async (event: ClipboardEvent<HTMLInputElement>) => {
    const items = Array.from(event.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    if (imageItems.length === 0) return;

    event.preventDefault();

    try {
      const newAttachments = await Promise.all(
        imageItems.map(async (item) => {
          const file = item.getAsFile();
          if (!file) throw new Error("Файл не прочитано");
          return readFileAsAttachment(file);
        })
      );
      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success("Скріншот додано");
    } catch (error) {
      toast.error("Не вдалося додати скріншот");
      console.error(error);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && attachments.length === 0) return;

    try {
      const { message } = await sendMessage(conversationId, text, attachments.length ? attachments : undefined);
      setMessages((prev) => [...prev, message]);
      setInputText("");
      setAttachments([]);
      scrollToBottom();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося відправити повідомлення";
      toast.error(message);
      console.error(error);
    }
  };
  // тимчасово в консоль браузера
  console.log(window.speechSynthesis.getVoices().map(v => `${v.name} - ${v.lang}`));

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

  const handleTranslate = async (msg: Message, targetLang: string) => {
    try {
      const { translatedText } = await translateText(msg.original_text, targetLang);
      setTranslations((prev) => ({ ...prev, [msg.id]: translatedText }));
      toast.success("Переклад виконано");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не вдалося перекласти повідомлення";
      toast.error(message);
      console.error(error);
    }
  };

  const clearTranslation = (msgId: string) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
  };

  const getVoiceForLang = (language: string) => {
    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    if (!availableVoices || availableVoices.length === 0) return null;

    const normalizedLang = language.toLowerCase();
    const languageParts = normalizedLang.split("-")[0];

    const exactMatch = availableVoices.find(
      (voice) => voice.lang.toLowerCase() === normalizedLang
    );
    if (exactMatch) return exactMatch;

    const prefixMatch = availableVoices.find((voice) =>
      voice.lang.toLowerCase().startsWith(languageParts)
    );
    if (prefixMatch) return prefixMatch;

    const localeMatch = availableVoices.find((voice) =>
      voice.lang.toLowerCase().includes(languageParts) ||
      voice.name.toLowerCase().includes(languageParts) ||
      voice.voiceURI.toLowerCase().includes(languageParts)
    );
    if (localeMatch) return localeMatch;

    if (languageParts === "uk") {
      const russianLike = availableVoices.find((voice) =>
        voice.lang.toLowerCase().startsWith("ru") ||
        voice.name.toLowerCase().includes("russian")
      );
      if (russianLike) return russianLike;
    }

    return availableVoices[0];
  };

  const speakMessage = (text: string, language: string, messageId: string) => {
    if (!text.trim()) {
      toast.error("Текст порожній");
      return;
    }

    if (!window.speechSynthesis) {
      toast.error("Ваш браузер не підтримує озвучення");
      return;
    }

    window.speechSynthesis.cancel();

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      setVoices(availableVoices);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    const voice = getVoiceForLang(language);
    if (voice) {
      utterance.voice = voice;
      toast.success(`Голос: ${voice.name} (${voice.lang})`);
    } else {
      toast.info("Український голос не знайдено, використовується голос за замовчуванням.");
    }
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      toast.error("Помилка озвучення");
    };

    window.speechSynthesis.speak(utterance);
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

  // просто — визначаємо по символах
  const detectSpeakLang = (text: string) => {
    const hasCyrillic = /[а-яёіїєґА-ЯЁІЇЄҐ]/.test(text);
    return hasCyrillic ? "uk-UA" : "en-US";
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
                    <div className="space-y-2 text-left">
                      <div>{translations[msg.id] ?? msg.original_text}</div>
                      {translations[msg.id] ? (
                        <p className="text-xs text-muted-foreground">
                          Оригінал: {msg.original_text}
                        </p>
                      ) : null}
                      {msg.attachments?.length ? (
                        <div className="space-y-2 mt-2">
                          {msg.attachments.map((attachment) => (
                            <div
                              key={attachment.name}
                              className="rounded border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700"
                            >
                              {attachment.type.startsWith("image/") ? (
                                <img
                                  src={`data:${attachment.type};base64,${attachment.data}`}
                                  alt={attachment.name}
                                  className="max-h-64 w-full rounded object-cover mb-2"
                                />
                              ) : null}
                              <a
                                href={`data:${attachment.type};base64,${attachment.data}`}
                                download={attachment.name}
                                className="text-blue-600 hover:underline"
                              >
                                {attachment.name}
                              </a>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({Math.round(attachment.size / 1024)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {isOwn ? (
                      <>
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
                      </>
                    ) : null}
                    <button
                      className="text-emerald-600"
                      onClick={() => handleTranslate(msg, "uk")}
                    >
                      UA
                    </button>
                    <button
                      className="text-emerald-600"
                      onClick={() => handleTranslate(msg, "en")}
                    >
                      EN
                    </button>
                    {translations[msg.id] ? (
                      <button
                        className="text-slate-500"
                        onClick={() => clearTranslation(msg.id)}
                      >
                        Скинути переклад
                      </button>
                    ) : null}
                    <button
                      className="text-violet-600"
                      onClick={() => {
                        const textToSpeak = translations[msg.id] ?? msg.original_text;
                        const lang = detectSpeakLang(textToSpeak);
                        speakMessage(textToSpeak, lang, msg.id);
                      }}
                      disabled={speakingMessageId === msg.id}
                    >
                      {speakingMessageId === msg.id ? "Озвучення..." : "Озвучити"}
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
      <div className="flex items-center gap-2 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleAttachFiles(e.target.files)}
          className="hidden"
        />
        {attachments.length > 0 && (
          <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
            {attachments.map((attachment, index) => (
              <div key={`${attachment.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  {attachment.type.startsWith("image/") ? (
                    <img
                      src={`data:${attachment.type};base64,${attachment.data}`}
                      alt={attachment.name}
                      className="h-12 w-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded border bg-white text-slate-500">
                      <Paperclip className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(attachment.size / 1024)} KB</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-red-500 hover:underline"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  Х
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex  gap-2">
          <Input
            type="text"
            className="w-full"
            placeholder="Введіть повідомлення..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md   text-sm font-medium text-foreground hover:bg-slate-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <Button onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

      </div>
    </Card>
  );
};
