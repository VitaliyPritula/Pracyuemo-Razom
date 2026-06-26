export type User = {
  id: string;
  email: string;
};

export type Conversation = {
  id: string;
  last_message: string;
  updated_at?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  original_text: string;
  created_at: string;
};

type ApiResponse<T> = T & { error?: string };

const fetchJson = async <T>(url: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const contentType = response.headers.get("content-type") || "";
  let data: ApiResponse<T> | null = null;

  if (contentType.includes("application/json")) {
    data = (await response.json()) as ApiResponse<T>;
  }

  if (!response.ok) {
    const errorText = data?.error
      ? typeof data.error === "string"
        ? data.error
        : JSON.stringify(data.error)
      : response.statusText || "Network error";

    throw new Error(errorText);
  }

  return data as ApiResponse<T>;
};

export async function getCurrentUser() {
  const data = await fetchJson<{ user: User | null }>("/api/auth/user", {
    cache: "no-store",
  });
  return data.user;
}

export async function registerUser(email: string, password: string) {
  return fetchJson<{ user: User }>("/api/auth/register", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email: string, password: string) {
  return fetchJson<{ user: User }>("/api/auth/login", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return fetchJson<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
}

export async function fetchConversations() {
  return fetchJson<{ conversations: Conversation[] }>("/api/chat/conversations", {
    cache: "no-store",
  });
}

export async function createConversationInvite() {
  return fetchJson<{ token: string; conversationId: string }>("/api/chat/conversations", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ createInvite: true }),
  });
}

export async function createConversation() {
  return fetchJson<{ conversationId: string }>("/api/chat/conversations", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ createInvite: false }),
  });
}

export async function deleteConversation(conversationId: string) {
  return fetchJson<{ success: boolean }>(`/api/chat/conversations?conversationId=${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
  });
}

export async function fetchMessages(conversationId: string) {
  return fetchJson<{ messages: Message[] }>(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, {
    cache: "no-store",
  });
}

export async function sendMessage(conversationId: string, text: string) {
  return fetchJson<{ message: Message }>("/api/chat/messages", {
    method: "POST",
    body: JSON.stringify({ conversationId, text }),
  });
}

export async function deleteMessage(messageId: string) {
  return fetchJson<{ success: boolean }>(`/api/chat/messages?id=${encodeURIComponent(messageId)}`, {
    method: "DELETE",
  });
}

export async function updateMessage(messageId: string, text: string) {
  return fetchJson<{ message: Message }>("/api/chat/messages", {
    method: "PATCH",
    body: JSON.stringify({ id: messageId, text }),
  });
}

export async function joinInvite(token: string) {
  return fetchJson<{ conversationId: string }>("/api/chat/invite", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
