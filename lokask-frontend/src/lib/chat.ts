import { fetchJson } from "./core";
// data type

export interface ChatMessage {
    id: number,
    conversation_id: string,
    sender_id: string, // mapped with DB uuid
    content: string,
    is_read: boolean,
    created_at: string, // mapped with DB timestamp

    // helper, for future development
    type?: "text" | "image" | "map";
    imageUrl?: string;
}

export interface Conversation {
    id: string,
    traveler_id: string,
    consultant_id: string,
    last_message?: string;
    last_message_at?: String
}

// begin conversations
// POST /api/v1/conversations
export async function startChat(consultantId: string): Promise<Conversation> {
    return fetchJson<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify({ consultant_id: consultantId })
    })
}

// get message from a specific conversation
// GET /api/v1/conversations/:id/messages
export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    return fetchJson<ChatMessage[]>(`/conversations/${conversationId}/messages`);
}

// send a message
// POST /api/v1/conversations/:id/messages
export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    return fetchJson<ChatMessage>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

// get inbox
export async function getInbox(): Promise<Conversation[]> {
    return fetchJson<Conversation[]>("/conversations");
}

// adding chat session for billing purpose
export async function getChatSession(conversationId: string) {
    try {
        return await fetchJson<any>(`/conversations/${conversationId}/session`);
    } catch (error: any) {
        if (error?.status === 404 || error?.error === "No active session found") {
            return null;
        }
        throw error;
    }
}