import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, User } from '@/types';

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  message_type: string;
  is_read: number;
}

interface Conversation {
  user_id: string;
  user_name: string;
  unread_count: number;
  last_message: string;
}

interface Group {
  id: string;
  name: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  privateMessages: PrivateMessage[];
  conversations: Conversation[];
  groups: Group[];
  fetchGroups: () => Promise<Group[]>;
  fetchGroupMessages: (groupId: string) => Promise<ChatMessage[]>;
  sendGroupMessage: (groupId: string, content: string) => Promise<ChatMessage>;
  fetchConversations: () => Promise<Conversation[]>;
  fetchConversation: (userId: string) => Promise<PrivateMessage[]>;
  sendDirectMessage: (receiverId: string, content: string) => Promise<PrivateMessage>;
  markAsRead: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Utility to merge new private messages while filtering out any falsy entries
export const mergePrivateMessages = (
  prev: (PrivateMessage | null | undefined)[],
  incoming: (PrivateMessage | null | undefined)[]
): PrivateMessage[] => {
  const sanitizedPrev = prev.filter(m => m && m.id) as PrivateMessage[];
  const sanitizedIncoming = incoming.filter(m => m && m.id) as PrivateMessage[];
  const existing = new Set(sanitizedPrev.map(m => m.id));
  const filteredIncoming = sanitizedIncoming.filter(m => !existing.has(m.id));
  return [...sanitizedPrev, ...filteredIncoming];
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const socketUrl = apiBase.replace(/\/api$/, '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      return response.json();
    },
    [apiBase]
  );

  const fetchGroups = useCallback(async (): Promise<Group[]> => {
    const data = await fetchWithAuth('/groups');
    const formatted = (data as { id: number | string; name: string }[]).map(g => ({
      id: g.id.toString(),
      name: g.name,
    }));
    setGroups(formatted);
    return formatted;
  }, [fetchWithAuth]);

  const fetchGroupMessages = async (groupId: string): Promise<ChatMessage[]> => {
    const data = await fetchWithAuth(`/chat/groups/${groupId}/messages`);
    setMessages(prev => {
      const filtered = prev.filter(m => m.groupId !== groupId);
      return [...filtered, ...data];
    });
    return data;
  };

  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    const data = await fetchWithAuth('/messages/conversations');
    setConversations(data);
    return data;
  }, [fetchWithAuth]);

  const fetchConversation = useCallback(
    async (userId: string): Promise<PrivateMessage[]> => {
      const data = await fetchWithAuth(`/messages/conversation/${userId}`);
      const sanitized = (data as (PrivateMessage | null | undefined)[]).filter(
        m => m && m.id
      ) as PrivateMessage[];
      setPrivateMessages(prev => mergePrivateMessages(prev, sanitized));
      return sanitized;
    },
    [fetchWithAuth]
  );

  const sendGroupMessage = async (
    groupId: string,
    content: string
  ): Promise<ChatMessage> => {
    const newMessage = await fetchWithAuth(`/chat/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    setMessages(prev => [...prev, newMessage]);
    socketRef.current?.emit('group-message', { groupId, message: newMessage });
    return newMessage;
  };

  const sendDirectMessage = async (
    receiverId: string,
    content: string
  ): Promise<PrivateMessage> => {
    const message = await fetchWithAuth('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    });
    setPrivateMessages(prev => mergePrivateMessages(prev, [message]));
    socketRef.current?.emit('private-message', { to: receiverId, message });
    fetchConversations().catch(console.error);
    return message;
  };

  const markAsRead = async (userId: string): Promise<void> => {
    await fetchWithAuth(`/messages/mark-read/${userId}`, { method: 'PUT' });
    setConversations(prev =>
      prev.map(c => (c.user_id === userId ? { ...c, unread_count: 0 } : c))
    );
  };

  const searchUsers = useCallback(
    async (query: string): Promise<User[]> => {
      if (!query.trim()) return [];
      const data = await fetchWithAuth(`/users?search=${encodeURIComponent(query)}`);
      return data as User[];
    },
    [fetchWithAuth]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(socketUrl, { auth: { token } });

    socket.on('group-message', (message: ChatMessage) => {
      setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
    });

    socket.on('private-message', (message: PrivateMessage) => {
      setPrivateMessages(prev => mergePrivateMessages(prev, [message]));
      fetchConversations().catch(console.error);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [socketUrl, fetchConversations]);

  useEffect(() => {
    if (socketRef.current && groups.length) {
      groups.forEach(g => socketRef.current?.emit('join-room', `group-${g.id}`));
    }
  }, [groups]);

  return (
    <ChatContext.Provider
        value={{
          messages,
          privateMessages,
          conversations,
          groups,
          fetchGroups,
          fetchGroupMessages,
          sendGroupMessage,
          fetchConversations,
          fetchConversation,
          sendDirectMessage,
          markAsRead,
          searchUsers,
        }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
