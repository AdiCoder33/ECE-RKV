import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage, PrivateMessage, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

interface ChatSidebarProps {
  isOpen: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpandedChange: (value: boolean) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  expanded,
  onToggle,
  onExpandedChange
}) => {
  const { user } = useAuth();
  const {
    conversations,
    fetchConversations,
    fetchConversation,
    fetchMoreConversation,
    fetchGroupMessages,
    fetchMoreGroupMessages,
    privateMessages,
    messages,
    sendDirectMessage,
    sendGroupMessage,
    markAsRead,
    pinConversation,
    fetchGroups,
    onlineUsers,
    typingUsers,
    setTyping,
    searchUsers,
    socketRef,
  } = useChat();

  const [activeChat, setActiveChat] = useState<{
    type: 'direct' | 'group';
    id: string;
    title: string;
  } | null>(null);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [tab, setTab] = useState<'all' | 'direct' | 'group'>('all');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const typingRef = useRef(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups().catch(() => {});
    fetchConversations().catch(() => {});
  }, [fetchGroups, fetchConversations]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchUsers(search);
        setSearchResults(results.filter(u => u.id !== user?.id));
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search, searchUsers, user?.id]);

  useEffect(() => {
    if (!activeChat) return;
    const { id, type } = activeChat;
    const controller = new AbortController();
    let ignore = false;
    setMessagesLoading(true);
    setDirectMessages([]);
    setGroupMessages([]);

    const loadMessages = async () => {
      try {
        if (type === 'direct') {
          const data = await fetchConversation(
            Number(id),
            undefined,
            controller.signal
          );
          if (!ignore && activeChat?.id === id && activeChat.type === type) {
            setDirectMessages(data.messages);
            setHasMore(data.hasMore);
          }
        } else {
          const data = await fetchGroupMessages(
            id,
            undefined,
            controller.signal
          );
          if (!ignore && activeChat?.id === id && activeChat.type === type) {
            setGroupMessages(data.messages);
            setHasMore(data.hasMore);
          }
        }
      } catch {
        // ignore
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();

    if (type === 'direct') {
      markAsRead('direct', id).catch(() => {});
    } else {
      markAsRead('group', id).catch(() => {});
    }

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [activeChat, fetchConversation, fetchGroupMessages, markAsRead]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeChat) return;
    const room =
      activeChat.type === 'group'
        ? `group-${activeChat.id}`
        : `user:${activeChat.id}`;
    socket.emit('join-room', room);
    return () => {
      socket.emit('leave-room', room);
    };
  }, [activeChat, socketRef]);

  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.type === 'direct') {
      const newMsgs = privateMessages
        .filter(m => m.sender_id === Number(activeChat.id) || m.receiver_id === Number(activeChat.id));
      setDirectMessages(newMsgs);
    } else {
      const newMsgs = messages.filter(m => m.groupId === activeChat.id);
      setGroupMessages(newMsgs);
    }
  }, [activeChat, privateMessages, messages]);

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && attachments.length === 0) || !activeChat) return;
    const text = message;
    const files = attachments.map(a => a.file);
    setMessage('');
    attachments.forEach(a => URL.revokeObjectURL(a.preview));
    setAttachments([]);
    const target =
      activeChat.type === 'group'
        ? `group-${activeChat.id}`
        : String(activeChat.id);
    try {
      if (activeChat.type === 'direct') {
        await sendDirectMessage(Number(activeChat.id), text, files);
        if (!conversations.some(c => c.id === activeChat.id)) {
          fetchConversations().catch(() => {});
        }
      } else {
        await sendGroupMessage(activeChat.id, text, files);
      }
    } catch {
      // ignore
    } finally {
      setTyping(target, 'stop_typing');
      typingRef.current = false;
    }
  }, [
    message,
    attachments,
    activeChat,
    sendDirectMessage,
    sendGroupMessage,
    conversations,
    fetchConversations,
    setTyping
  ]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);
      if (!activeChat) return;
      const target =
        activeChat.type === 'group'
          ? `group-${activeChat.id}`
          : String(activeChat.id);
      if (value && !typingRef.current) {
        setTyping(target, 'typing');
        typingRef.current = true;
      } else if (!value && typingRef.current) {
        setTyping(target, 'stop_typing');
        typingRef.current = false;
      }
    },
    [activeChat, setTyping]
  );

  useEffect(() => {
    const currentChat = activeChat;
    return () => {
      if (typingRef.current && currentChat) {
        const target =
          currentChat.type === 'group'
            ? `group-${currentChat.id}`
            : String(currentChat.id);
        setTyping(target, 'stop_typing');
        typingRef.current = false;
      }
    };
  }, [activeChat, setTyping]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const allowed = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowed.includes(file.type) || file.size > 20 * 1024 * 1024) {
        return;
      }
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : '';
      setAttachments(prev => [...prev, { file, preview }]);
    },
    [setAttachments]
  );

  const removeAttachment = useCallback(
    (idx: number) => {
      URL.revokeObjectURL(attachments[idx].preview);
      setAttachments(prev => prev.filter((_, i) => i !== idx));
    },
    [attachments]
  );

  const displayMessages =
    activeChat?.type === 'direct' ? directMessages : groupMessages;

  const loadMore = useCallback(() => {
    if (!activeChat || !hasMore) return;
    if (activeChat.type === 'direct') {
      fetchMoreConversation(Number(activeChat.id))
        .then(res => setHasMore(res.hasMore))
        .catch(() => {});
    } else {
      fetchMoreGroupMessages(activeChat.id)
        .then(res => setHasMore(res.hasMore))
        .catch(() => {});
    }
  }, [activeChat, hasMore, fetchMoreConversation, fetchMoreGroupMessages]);

  const sortedConversations = conversations
    .filter(c => tab === 'all' || c.type === tab)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const filteredSearchResults = searchResults.filter(
    u => u.id !== user?.id && !conversations.some(c => c.id === u.id)
  );

  const handleSelectConversation = useCallback(
    (c: typeof conversations[number]) => {
      setActiveChat({ type: c.type, id: String(c.id), title: c.title });
    },
    []
  );

  const handlePin = useCallback(
    (
      e: React.MouseEvent,
      c: typeof conversations[number]
    ) => {
      e.stopPropagation();
      pinConversation(c.type, c.id, Boolean(c.pinned)).catch(() => {});
    },
    [pinConversation]
  );

  const handleStartChat = useCallback(
    async (u: User) => {
      try {
        await fetchConversation(Number(u.id));
        setActiveChat({ type: 'direct', id: String(u.id), title: u.name });
        setSearch('');
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to start chat'
        });
      }
    },
    [fetchConversation, toast]
  );

  const handleGroupCreate = useCallback(() => {
    setIsGroupDialogOpen(false);
    navigate('/dashboard/groups');
  }, [navigate]);

  return (
    <>
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Navigate to manage and create chat groups.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleGroupCreate}>Go to Groups</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div
        className={`fixed right-0 top-0 h-full bg-background border-l z-30 transition-[width] duration-300 ${
          isOpen ? (expanded ? 'w-full sm:w-80' : 'w-16') : 'w-0'
        }`}
        onMouseEnter={() => isOpen && onExpandedChange(true)}
        onMouseLeave={() => isOpen && onExpandedChange(false)}
      >
        {isOpen && expanded ? (
          <Card className="h-full flex flex-col rounded-none border-0 shadow-lg">
            {!activeChat ? (
              <ConversationList
                tab={tab}
                onTabChange={setTab}
                search={search}
                onSearchChange={setSearch}
                searchResults={filteredSearchResults}
                searchLoading={searchLoading}
                conversations={sortedConversations}
                onSelectConversation={handleSelectConversation}
                onPin={handlePin}
                onlineUsers={onlineUsers}
                onStartChat={handleStartChat}
                onOpenGroupDialog={() => setIsGroupDialogOpen(true)}
                onClose={onToggle}
              />
            ) : (
              <ChatWindow
                activeChat={activeChat}
                messages={displayMessages}
                currentUserId={user?.id}
                typingUsers={typingUsers}
                loading={messagesLoading}
                hasMore={hasMore}
                loadMore={loadMore}
                message={message}
                onMessageChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onSend={handleSendMessage}
                attachments={attachments}
                onFileSelect={handleFileSelect}
                onRemoveAttachment={removeAttachment}
                onEmojiSelect={(e) => setMessage(prev => prev + e)}
                onBack={() => setActiveChat(null)}
                onClose={onToggle}
                onOpenGroupDialog={() => setIsGroupDialogOpen(true)}
              />
            )}
          </Card>
      ) : isOpen ? (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          {conversations.slice(0, 10).map(c => (
            <button
              key={`${c.type}-${c.id}`}
              onClick={() => {
                setActiveChat({ type: c.type, id: String(c.id), title: c.title });
                onExpandedChange(true);
              }}
              className="relative"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {c.title.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {c.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}
      </div>
    </>
  );
};

export default ChatSidebar;
