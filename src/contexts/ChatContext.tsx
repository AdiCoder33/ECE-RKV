import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';
import { useAuth } from './AuthContext';

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

interface ChatContextType {
  messages: ChatMessage[];
  privateMessages: PrivateMessage[];
  conversations: Conversation[];
  fetchMessages: (chatType: 'section' | 'global' | 'alumni') => Promise<ChatMessage[]>;
  sendMessage: (content: string, chatType: 'section' | 'global' | 'alumni') => Promise<ChatMessage>;
  fetchConversations: () => Promise<Conversation[]>;
  fetchConversation: (userId: string) => Promise<PrivateMessage[]>;
  sendDirectMessage: (receiverId: string, content: string) => Promise<PrivateMessage>;
  markAsRead: (userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

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

  const fetchMessages = async (
    chatType: 'section' | 'global' | 'alumni'
  ): Promise<ChatMessage[]> => {
    const data = await fetchWithAuth(`/chat/messages?channel=${chatType}`);
    setMessages(prev => {
      const filtered = prev.filter(m => m.chatType !== chatType);
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
      setPrivateMessages(prev => {
        const existing = new Set(prev.map(m => m.id));
        const filtered = data.filter((m: PrivateMessage) => !existing.has(m.id));
        return [...prev, ...filtered];
      });
      return data;
    },
    [fetchWithAuth]
  );

  const sendMessage = async (
    content: string,
    chatType: 'section' | 'global' | 'alumni'
  ): Promise<ChatMessage> => {
    const newMessage = await fetchWithAuth('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content, chatType }),
    });
    setMessages(prev => [...prev, newMessage]);
    const room = chatType === 'section' ? `section-${user?.section}` : chatType;
    socketRef.current?.emit('chat-message', { room, message: newMessage });
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
    setPrivateMessages(prev => [...prev, message]);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(socketUrl, { auth: { token } });

    socket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
    });

    socket.on('private-message', (message: PrivateMessage) => {
      setPrivateMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message]
      );
      fetchConversations().catch(console.error);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [socketUrl, fetchConversations]);

  useEffect(() => {
    if (socketRef.current && user) {
      socketRef.current.emit('join-room', 'global');
      socketRef.current.emit('join-room', 'alumni');
      if (user.section) {
        socketRef.current.emit('join-room', `section-${user.section}`);
      }
    }
  }, [user]);

  return (
    <ChatContext.Provider
        value={{
          messages,
          privateMessages,
          conversations,
          fetchMessages,
          sendMessage,
          fetchConversations,
          fetchConversation,
          sendDirectMessage,
          markAsRead,
        }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
