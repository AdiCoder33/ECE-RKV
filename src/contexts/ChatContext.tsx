import React, { createContext, useContext } from 'react';
import { ChatMessage } from '@/types';

interface ChatContextType {
  fetchMessages: (chatType: 'section' | 'global' | 'alumni') => Promise<ChatMessage[]>;
  sendMessage: (content: string, chatType: 'section' | 'global' | 'alumni') => Promise<ChatMessage>;
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

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
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
  };

  const fetchMessages = async (
    chatType: 'section' | 'global' | 'alumni'
  ): Promise<ChatMessage[]> => {
    return fetchWithAuth(`/chat/messages?channel=${chatType}`);
  };

  const sendMessage = async (
    content: string,
    chatType: 'section' | 'global' | 'alumni'
  ): Promise<ChatMessage> => {
    return fetchWithAuth('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content, chatType }),
    });
  };

  return (
    <ChatContext.Provider value={{ fetchMessages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;

