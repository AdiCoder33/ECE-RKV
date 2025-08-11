import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, X, Search, Pin, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage, PrivateMessage } from '@/types';
import { Virtuoso } from 'react-virtuoso';

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
    setTyping
  } = useChat();

  const [activeChat, setActiveChat] = useState<{
    type: 'direct' | 'group';
    id: string;
    title: string;
  } | null>(null);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'all' | 'direct' | 'group'>('all');
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const typingRef = useRef(false);

  useEffect(() => {
    fetchGroups().catch(() => {});
    fetchConversations().catch(() => {});
  }, [fetchGroups, fetchConversations]);

  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.type === 'direct') {
      fetchConversation(activeChat.id)
        .then(data => {
          setDirectMessages(data.messages);
          setHasMore(data.hasMore);
        })
        .catch(() => {});
      markAsRead('direct', activeChat.id).catch(() => {});
    } else {
      fetchGroupMessages(activeChat.id)
        .then(data => {
          setGroupMessages(data.messages);
          setHasMore(data.hasMore);
        })
        .catch(() => {});
      markAsRead('group', activeChat.id).catch(() => {});
    }
  }, [activeChat, fetchConversation, fetchGroupMessages, markAsRead]);

  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.type === 'direct') {
      const newMsgs = privateMessages
        .filter(m => m.sender_id === activeChat.id || m.receiver_id === activeChat.id);
      setDirectMessages(newMsgs);
    } else {
      const newMsgs = messages.filter(m => m.groupId === activeChat.id);
      setGroupMessages(newMsgs);
    }
  }, [privateMessages, messages, activeChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) return;
    try {
      if (activeChat.type === 'direct') {
        await sendDirectMessage(activeChat.id, message);
      } else {
        await sendGroupMessage(activeChat.id, message);
      }
      const target =
        activeChat.type === 'group' ? `group-${activeChat.id}` : activeChat.id;
      setMessage('');
      setTyping(target, 'stop_typing');
      typingRef.current = false;
    } catch {
      // ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    if (!activeChat) return;
    const target =
      activeChat.type === 'group' ? `group-${activeChat.id}` : activeChat.id;
    if (value && !typingRef.current) {
      setTyping(target, 'typing');
      typingRef.current = true;
    } else if (!value && typingRef.current) {
      setTyping(target, 'stop_typing');
      typingRef.current = false;
    }
  };

  useEffect(() => {
    const currentChat = activeChat;
    return () => {
      if (typingRef.current && currentChat) {
        const target =
          currentChat.type === 'group'
            ? `group-${currentChat.id}`
            : currentChat.id;
        setTyping(target, 'stop_typing');
        typingRef.current = false;
      }
    };
  }, [activeChat, setTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayMessages =
    activeChat?.type === 'direct' ? directMessages : groupMessages;

  type GroupedItem =
    | { type: 'date'; date: string }
    | { type: 'message'; message: PrivateMessage | ChatMessage };

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const items: GroupedItem[] = [];
    let lastDate = '';
    displayMessages.forEach(msg => {
      const timestamp =
        activeChat?.type === 'direct'
          ? (msg as PrivateMessage).created_at
          : (msg as ChatMessage).timestamp;
      const dateStr = new Date(timestamp).toDateString();
      if (dateStr !== lastDate) {
        items.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      items.push({ type: 'message', message: msg });
    });
    return items;
  }, [displayMessages, activeChat]);

  const loadMore = useCallback(() => {
    if (!activeChat || !hasMore) return;
    if (activeChat.type === 'direct') {
      fetchMoreConversation(activeChat.id)
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

  const handleSelectConversation = (c: typeof conversations[number]) => {
    setActiveChat({ type: c.type, id: c.id, title: c.title });
  };

  const handlePin = (
    e: React.MouseEvent,
    c: typeof conversations[number]
  ) => {
    e.stopPropagation();
    pinConversation(c.type, c.id, Boolean(c.pinned)).catch(() => {});
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-background border-l z-30 transition-[width] duration-300 ${
        isOpen ? (expanded ? 'w-full sm:w-80' : 'w-16') : 'w-0'
      }`}
      onMouseEnter={() => isOpen && onExpandedChange(true)}
      onMouseLeave={() => isOpen && onExpandedChange(false)}
    >
      {isOpen && expanded ? (
        <Card className="h-full flex flex-col rounded-none border-0 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as 'all' | 'direct' | 'group')}
            >
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="direct">DMs</TabsTrigger>
                <TabsTrigger value="group">Groups</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <div className="p-0 border-b">
            <ScrollArea className="h-60">
              {sortedConversations.map(c => (
                <div
                  key={`${c.type}-${c.id}`}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleSelectConversation(c)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                      {c.title.charAt(0)}
                    </div>
                    {c.type === 'direct' && onlineUsers.has(c.id) && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.last_message || ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(c.last_activity)}
                    </span>
                    {c.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {c.unread_count}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handlePin(e, c)}
                  >
                    <Pin
                      className={`h-4 w-4 ${c.pinned ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>

          <CardContent className="flex-1 p-0 flex flex-col">
            <Virtuoso
              data={groupedItems}
              startReached={loadMore}
              followOutput="smooth"
              initialTopMostItemIndex={Math.max(groupedItems.length - 1, 0)}
              className="flex-1 px-4 py-4"
              itemContent={(index, item) => {
                if (item.type === 'date') {
                  return (
                    <div className="text-center text-xs text-muted-foreground my-2">
                      {item.date}
                    </div>
                  );
                }
                const msg = item.message as PrivateMessage | ChatMessage;
                const isOwn =
                  activeChat?.type === 'direct'
                    ? (msg as PrivateMessage).sender_id === user?.id
                    : (msg as ChatMessage).senderId === user?.id;
                const senderName =
                  activeChat?.type === 'direct'
                    ? (msg as PrivateMessage).sender_name
                    : (msg as ChatMessage).senderName;
                const timestamp =
                  activeChat?.type === 'direct'
                    ? (msg as PrivateMessage).created_at
                    : (msg as ChatMessage).timestamp;
                const role =
                  activeChat?.type === 'direct'
                    ? null
                    : (msg as ChatMessage).senderRole;
                const status = msg.status || 'sent';
                const avatar = msg.sender_profileImage;
                const initials = senderName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2);
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwn && (
                      <div className="flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={senderName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">
                              {initials}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex-1 max-w-sm ${isOwn ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                        {!isOwn && (
                          <span className="text-sm font-medium">{senderName}</span>
                        )}
                        {activeChat?.type !== 'direct' && role && !isOwn && (
                          <Badge variant="secondary" className="text-xs">
                            {role.toUpperCase()}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(timestamp)}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {isOwn && (
                          <div className="flex justify-end mt-1">
                            {status === 'sending' && (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                            {status === 'sent' && <Check className="h-3 w-3" />}
                            {status === 'delivered' && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                            {status === 'read' && (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {activeChat?.type === 'direct' && typingUsers.has(activeChat.id) && (
              <div className="px-4 py-2 text-xs text-muted-foreground">User is typing…</div>
            )}
          </CardContent>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeChat ? `Message ${activeChat.title}...` : 'Select a conversation'
                }
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : isOpen ? (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ChatSidebar;
