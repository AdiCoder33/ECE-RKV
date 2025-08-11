import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  X,
  Search,
  Pin,
  Check,
  CheckCheck,
  ArrowLeft,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage, PrivateMessage, User } from '@/types';
import { Virtuoso } from 'react-virtuoso';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';

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
  const typingRef = useRef(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const navigate = useNavigate();

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
        setSearchResults(results);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search, searchUsers]);

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
    if ((!message.trim() && attachments.length === 0) || !activeChat) return;
    try {
      const files = attachments.map(a => a.file);
      if (activeChat.type === 'direct') {
        await sendDirectMessage(activeChat.id, message, files);
        if (!conversations.some(c => c.id === activeChat.id)) {
          fetchConversations().catch(() => {});
        }
      } else {
        await sendGroupMessage(activeChat.id, message, files);
      }
      const target =
        activeChat.type === 'group' ? `group-${activeChat.id}` : activeChat.id;
      setMessage('');
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
      setAttachments([]);
      setTyping(target, 'stop_typing');
      typingRef.current = false;
    } catch {
      // ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (file: File) => {
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
  };

  const removeAttachment = (idx: number) => {
    URL.revokeObjectURL(attachments[idx].preview);
    setAttachments(prev => prev.filter((_, i) => i !== idx));
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

  const filteredSearchResults = searchResults.filter(
    u => u.id !== user?.id && !conversations.some(c => c.id === u.id)
  );

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

  const handleGroupCreate = () => {
    setIsGroupDialogOpen(false);
    navigate('/dashboard/groups');
  };

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
              <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsGroupDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggle}
                      className="sm:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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
              <ScrollArea className="flex-1">
                {search && (
                  <div>
                    {searchLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      filteredSearchResults.map(u => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted cursor-pointer"
                          onClick={async () => {
                            await fetchConversation(u.id).catch(() => {});
                            setActiveChat({ type: 'direct', id: u.id, title: u.name });
                            setSearch('');
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
            </>
          ) : (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveChat(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-lg">{activeChat.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsGroupDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggle}
                      className="sm:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <Virtuoso
                  data={groupedItems}
                  startReached={loadMore}
                  followOutput="smooth"
                  initialTopMostItemIndex={Math.max(groupedItems.length - 1, 0)}
                  className="flex-1 px-4 py-4 overflow-x-hidden"
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
                        <div className={`w-full pr-4 ${isOwn ? 'text-right' : ''}`}>
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
                            className={`inline-block max-w-[80%] break-words break-all p-3 rounded-lg ${
                              isOwn
                                ? 'ml-auto bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att, i) =>
                                  att.type === 'image' ? (
                                    <div key={i} className="relative">
                                      {att.url && (
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          className="max-w-xs rounded"
                                        />
                                      )}
                                      {att.progress !== undefined && att.progress < 100 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                                          {att.progress}%
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between bg-background rounded px-2 py-1 text-xs"
                                    >
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                      >
                                        {att.name}
                                      </a>
                                      {att.progress !== undefined && att.progress < 100 && (
                                        <span className="ml-2">{att.progress}%</span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
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
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((att, idx) => (
                      att.file.type.startsWith('image/') ? (
                        <div key={idx} className="relative">
                          <img
                            src={att.preview}
                            alt={att.file.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="flex items-center bg-muted rounded px-2 py-1 text-xs"
                        >
                          {att.file.name}
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Textarea
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      activeChat ? `Message ${activeChat.title}...` : 'Select a conversation'
                    }
                    className="flex-1"
                  />
                  <EmojiPicker onEmojiSelect={(e) => setMessage(prev => prev + e)} />
                  <FileUpload onFileSelect={handleFileSelect} disabled={!activeChat} />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() && attachments.length === 0}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      ) : isOpen ? (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
        ) : null}
      </div>
    </>
  );
};

export default ChatSidebar;
