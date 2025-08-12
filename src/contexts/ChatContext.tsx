import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import DOMPurify from 'dompurify';
import { ChatMessage, User, PrivateMessage, Attachment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string;
  avatar: string | null;
  last_message: string | null;
  last_activity: string | null;
  unread_count: number;
  pinned: number | boolean;
}

interface Group {
  id: string;
  name: string;
}

interface Paginated<T> {
  messages: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  privateMessages: PrivateMessage[];
  conversations: Conversation[];
  groups: Group[];
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  fetchGroups: () => Promise<Group[]>;
  fetchGroupMessages: (
    groupId: string,
    params?: { before?: string; limit?: number },
    signal?: AbortSignal
  ) => Promise<Paginated<ChatMessage>>;
  fetchMoreGroupMessages: (
    groupId: string
  ) => Promise<Paginated<ChatMessage>>;
  sendGroupMessage: (
    groupId: string,
    content: string,
    files?: File[]
  ) => Promise<ChatMessage>;
  fetchConversations: () => Promise<Conversation[]>;
  fetchConversation: (
    userId: string,
    params?: { before?: string; limit?: number },
    signal?: AbortSignal
  ) => Promise<Paginated<PrivateMessage>>;
  fetchMoreConversation: (
    userId: string
  ) => Promise<Paginated<PrivateMessage>>;
  sendDirectMessage: (
    receiverId: string,
    content: string,
    files?: File[]
  ) => Promise<PrivateMessage | null>;
  pinConversation: (type: 'direct' | 'group', id: string, pinned: boolean) => Promise<void>;
  markAsRead: (type: 'direct' | 'group', id: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  setTyping: (targetId: string | number, type: 'typing' | 'stop_typing') => void;
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
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  const sortConversations = useCallback((list: Conversation[]) => {
    return [...list].sort((a, b) => {
      const pinDiff = Number(b.pinned) - Number(a.pinned);
      if (pinDiff !== 0) return pinDiff;
      return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime();
    });
  }, []);

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

      if (
        response.status === 204 ||
        !response.headers.get('content-type')?.includes('json')
      ) {
        return null;
      }

      return response.json();
    },
    [apiBase]
  );

  const uploadFile = useCallback(
    async (file: File, onProgress: (percent: number) => void) => {
      const token = localStorage.getItem('token');
      return new Promise<Attachment>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiBase}/uploads/chat`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res as Attachment);
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      });
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

  const fetchGroupMessages = async (
    groupId: string,
    params: { before?: string; limit?: number } = {},
    signal?: AbortSignal
  ): Promise<Paginated<ChatMessage>> => {
    const { before, limit } = params;
    const qs = `?limit=${limit ?? 50}${before ? `&before=${encodeURIComponent(before)}` : ''}`;
    const data = (await fetchWithAuth(`/chat/groups/${groupId}/messages${qs}`, { signal })) as Paginated<ChatMessage>;
    const withStatus = data.messages.map(m => ({ ...m, status: m.status ?? 'sent' }));
    setMessages(prev => {
      const existing = prev.filter(m => m.groupId === groupId);
      const others = prev.filter(m => m.groupId !== groupId);
      const combined = before ? [...withStatus, ...existing] : withStatus;
      const unique: ChatMessage[] = [];
      const seen = new Set<string>();
      for (const msg of combined) {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          unique.push(msg);
        }
      }
      return [...others, ...unique];
    });
    return { ...data, messages: withStatus };
  };

  const fetchMoreGroupMessages = async (
    groupId: string
  ): Promise<Paginated<ChatMessage>> => {
    const groupMsgs = messages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const oldest = groupMsgs[0];
    if (!oldest) {
      return { messages: [], nextCursor: null, hasMore: false };
    }
    return fetchGroupMessages(groupId, { before: oldest.timestamp });
  };

  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    const data = await fetchWithAuth('/conversations');
    const convs = sortConversations(data as Conversation[]);
    setConversations(convs);
    return convs;
  }, [fetchWithAuth, sortConversations]);

  const fetchConversation = useCallback(
    async (
      userId: string,
      params: { before?: string; limit?: number } = {},
      signal?: AbortSignal
    ): Promise<Paginated<PrivateMessage>> => {
      const { before, limit } = params;
      const qs = `?limit=${limit ?? 50}${before ? `&before=${encodeURIComponent(before)}` : ''}`;
      const data = (await fetchWithAuth(`/messages/conversation/${userId}${qs}`, { signal })) as Paginated<PrivateMessage>;
      const sanitized = (data.messages as (PrivateMessage | null | undefined)[]).filter(
        m => m && m.id
      ) as PrivateMessage[];
      const withStatus = sanitized.map(m => ({ ...m, status: m.status ?? 'sent' }));
      setPrivateMessages(prev => {
        const existing = prev.filter(
          m => m.sender_id === userId || m.receiver_id === userId
        );
        const others = prev.filter(
          m => m.sender_id !== userId && m.receiver_id !== userId
        );
        const merged = before
          ? mergePrivateMessages(withStatus, existing)
          : mergePrivateMessages([], withStatus);
        return [...others, ...merged];
      });
      return { ...data, messages: withStatus };
    },
    [fetchWithAuth]
  );

  const fetchMoreConversation = useCallback(
    async (userId: string): Promise<Paginated<PrivateMessage>> => {
      const convMsgs = privateMessages
        .filter(m => m.sender_id === userId || m.receiver_id === userId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      const oldest = convMsgs[0];
      if (!oldest) {
        return { messages: [], nextCursor: null, hasMore: false };
      }
      return fetchConversation(userId, { before: oldest.created_at });
    },
    [fetchConversation, privateMessages]
  );

  const sendGroupMessage = async (
    groupId: string,
    content: string,
    files: File[] = []
  ): Promise<ChatMessage> => {
    const tempId = `temp-${Date.now()}`;
    const sanitizedContent = DOMPurify.sanitize(content);
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: user?.id || '',
      senderName: user?.name || '',
      senderRole: user?.role || '',
      content: sanitizedContent,
      timestamp: new Date().toISOString(),
      groupId,
      status: 'sending',
      sender_profileImage: user?.profileImage,
      attachments: files.map(f => ({
        url: '',
        type: f.type.startsWith('image/') ? 'image' : 'file',
        name: f.name,
        progress: 0,
      })),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const uploaded: Attachment[] = [];
      await Promise.all(
        files.map((file, idx) =>
          uploadFile(file, percent =>
            setMessages(prev =>
              prev.map(m =>
                m.id === tempId
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a, i) =>
                        i === idx ? { ...a, progress: percent } : a
                      ),
                    }
                  : m
              )
            )
          ).then(res => {
            uploaded[idx] = res;
            setMessages(prev =>
              prev.map(m =>
                m.id === tempId
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a, i) =>
                        i === idx ? { ...a, url: res.url, progress: 100 } : a
                      ),
                    }
                  : m
              )
            );
          })
        )
      );
      const newMessage = await fetchWithAuth(`/chat/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: sanitizedContent, attachments: uploaded }),
      });
      const finalMessage = {
        ...newMessage,
        status: 'sent',
        content: DOMPurify.sanitize(newMessage.content ?? ''),
      } as ChatMessage;
      setMessages(prev => prev.map(m => (m.id === tempId ? finalMessage : m)));
      socketRef.current?.emit('group-message', { groupId, message: finalMessage });
      return finalMessage;
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw e;
    }
  };

  const sendDirectMessage = async (
    receiverId: string,
    content: string,
    files: File[] = []
  ): Promise<PrivateMessage | null> => {
    const tempId = `temp-${Date.now()}`;
    const sanitizedContent = DOMPurify.sanitize(content);
    const optimistic: PrivateMessage = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: receiverId,
      content: sanitizedContent,
      created_at: new Date().toISOString(),
      sender_name: user?.name || '',
      message_type: 'text',
      is_read: 0,
      status: 'sending',
      sender_profileImage: user?.profileImage,
      attachments: files.map(f => ({
        url: '',
        type: f.type.startsWith('image/') ? 'image' : 'file',
        name: f.name,
        progress: 0,
      })),
    };
    setPrivateMessages(prev => mergePrivateMessages(prev, [optimistic]));
    try {
      const uploaded: Attachment[] = [];
      await Promise.all(
        files.map((file, idx) =>
          uploadFile(file, percent =>
            setPrivateMessages(prev =>
              prev.map(m =>
                m.id === tempId
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a, i) =>
                        i === idx ? { ...a, progress: percent } : a
                      ),
                    }
                  : m
              )
            )
          ).then(res => {
            uploaded[idx] = res;
            setPrivateMessages(prev =>
              prev.map(m =>
                m.id === tempId
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a, i) =>
                        i === idx ? { ...a, url: res.url, progress: 100 } : a
                      ),
                    }
                  : m
              )
            );
          })
        )
      );
      const message = await fetchWithAuth('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ receiverId, content: sanitizedContent, attachments: uploaded }),
      });
      if (message) {
        const finalMessage = {
          ...message,
          status: 'sent',
          content: DOMPurify.sanitize(message.content ?? ''),
        } as PrivateMessage;
        setPrivateMessages(prev => prev.map(m => (m.id === tempId ? finalMessage : m)));
        socketRef.current?.emit('private-message', { to: receiverId, message: finalMessage });
        return finalMessage;
      }
      setPrivateMessages(prev => prev.filter(m => m.id !== tempId));
      return null;
    } catch (e) {
      setPrivateMessages(prev => prev.filter(m => m.id !== tempId));
      throw e;
    }
  };

  const pinConversation = async (
    type: 'direct' | 'group',
    id: string,
    pinned: boolean
  ): Promise<void> => {
    const action = pinned ? 'unpin' : 'pin';
    await fetchWithAuth(`/conversations/${type}/${id}/${action}`, { method: 'POST' });
    setConversations(prev =>
      sortConversations(
        prev.map(c =>
          c.id === id && c.type === type ? { ...c, pinned: pinned ? 0 : 1 } : c
        )
      )
    );
  };

  const markAsRead = async (
    type: 'direct' | 'group',
    id: string
  ): Promise<void> => {
    const url =
      type === 'group'
        ? `/chat/groups/${id}/mark-read`
        : `/messages/mark-read/${id}`;
    await fetchWithAuth(url, { method: 'PUT' });
    setConversations(prev =>
      prev.map(c =>
        c.type === type && c.id === id ? { ...c, unread_count: 0 } : c
      )
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

  const setTyping = useCallback(
    (targetId: string | number, type: 'typing' | 'stop_typing') => {
      const id = String(targetId);
      if (id.startsWith('group-')) socketRef.current?.emit(type, { room: id });
      else socketRef.current?.emit(type, { to: id });
    },
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(socketUrl, { auth: { token } });

    socket.on('group-message', (message: ChatMessage) => {
      const msgWithStatus = { ...message, status: message.status ?? 'sent' };
      setMessages(prev =>
        prev.some(m => m.id === msgWithStatus.id)
          ? prev
          : [...prev, msgWithStatus]
      );
    });

    socket.on('private-message', (message: PrivateMessage) => {
      const msgWithStatus = { ...message, status: message.status ?? 'sent' };
      setPrivateMessages(prev => mergePrivateMessages(prev, [msgWithStatus]));
    });

    socket.on('message-delivered', (data: { messageId: string }) => {
      const { messageId } = data;
      setPrivateMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'delivered' } : m))
      );
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'delivered' } : m))
      );
    });

    socket.on('message-read', (data: { messageId: string }) => {
      const { messageId } = data;
      setPrivateMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'read' } : m))
      );
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'read' } : m))
      );
    });

    socket.on('conversation_update', (summary: Conversation) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === summary.id && c.type === summary.type);
        const updated = idx >= 0 ? [...prev] : [...prev, summary];
        updated[idx >= 0 ? idx : updated.length - 1] = summary;
        return sortConversations(updated);
      });
    });

    socket.on('user_online', (id: string) => {
      setOnlineUsers(prev => new Set(prev).add(id));
    });

    socket.on('user_offline', (id: string) => {
      setOnlineUsers(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      setTypingUsers(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    });

    socket.on('typing', ({ from }: { from: string }) => {
      setTypingUsers(prev => new Set(prev).add(from));
    });

    socket.on('stop_typing', ({ from }: { from: string }) => {
      setTypingUsers(prev => {
        const s = new Set(prev);
        s.delete(from);
        return s;
      });
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [socketUrl, sortConversations]);

  useEffect(() => {
    if (socketRef.current && groups.length) {
      groups.forEach(g => socketRef.current?.emit('join-room', `group-${g.id}`));
    }
  }, [groups]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, fetchConversations]);

  return (
    <ChatContext.Provider
        value={{
          messages,
          privateMessages,
          conversations,
          groups,
          onlineUsers,
          typingUsers,
          fetchGroups,
          fetchGroupMessages,
          fetchMoreGroupMessages,
          sendGroupMessage,
          fetchConversations,
          fetchConversation,
          fetchMoreConversation,
          sendDirectMessage,
          pinConversation,
          markAsRead,
          searchUsers,
          setTyping,
        }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
