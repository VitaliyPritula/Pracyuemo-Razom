"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  updated_at?: string;
  last_message: string;
}

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const GLOBAL_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";

export const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  className,
}: Props) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // закриття dropdown по кліку поза ним
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Card className={cn(
      "w-full lg:w-72 h-[320px] lg:h-[600px] p-3 overflow-y-auto sm:relative absolute  sm: lg:relative  z-10 w-full h-full lg:h-auto",
      className
    )}>
      <h3 className="font-semibold mb-3">Чати</h3>

      <div className="space-y-2">
        {conversations.map(chat => (
          <div key={chat.id} className="relative">
            <div
              onClick={() => onSelect(chat.id)}
              className={cn(
                "cursor-pointer p-2 rounded hover:bg-muted",
                chat.id === activeConversationId && "bg-muted"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium mb-2">Приватний чат</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(
                      openDropdownId === chat.id ? null : chat.id
                    );
                  }}
                  className="text-gray-500 hover:text-gray-700 h-4"
                >
                  ⋯
                </button>
              </div>

              <p className="text-xs text-muted-foreground truncate text-left ">
                {chat.last_message}
              </p>
            </div>

            {openDropdownId === chat.id && (
              <div
                ref={dropdownRef}
                className="absolute right-2 top-8 bg-white border rounded shadow z-50"
              >
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    if (chat.id === GLOBAL_CONVERSATION_ID) {
                      toast.error("Глобальний чат видаляти не можна");
                      return;
                    }

                    setOpenDropdownId(null);
                    onDelete(chat.id);
                  }}
                >
                  Видалити чат
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
