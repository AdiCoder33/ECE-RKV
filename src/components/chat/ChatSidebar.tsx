
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Smile,
  Paperclip,
  Users,
  Search,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
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
  const [activeChat, setActiveChat] = useState<{ type: 'group' | 'user'; id: string; name?: string } | null>(null);
  const [message, setMessage] = useState('');
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [search, setSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const {
    groups,
    fetchGroups,
    fetchGroupMessages,
    sendGroupMessage,
    conversations,
    privateMessages,
    fetchConversations,
    fetchConversation,
    sendDirectMessage,
    markAsRead,
    searchUsers,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [groupMessages, directMessages]);

  useEffect(() => {
    fetchGroups().catch(err => console.error('Failed to load groups:', err));
    fetchConversations().catch(err => console.error('Failed to load conversations:', err));
  }, [fetchGroups, fetchConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat) return;
      try {
        if (activeChat.type === 'user') {
          const data = await fetchConversation(activeChat.id);
          setDirectMessages(data);
          markAsRead(activeChat.id).catch(() => {});
        } else {
          const data = await fetchGroupMessages(activeChat.id);
          setGroupMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    if (user) {
      loadMessages();
    }
  }, [activeChat, fetchConversation, fetchGroupMessages, user, markAsRead]);

  useEffect(() => {
    if (!activeChat || activeChat.type !== 'user') return;
    const newMsgs = privateMessages.filter(
      m => m.sender_id === activeChat.id || m.receiver_id === activeChat.id
    );
    const existing = new Set(directMessages.map(m => m.id));
    const additions = newMsgs.filter(m => !existing.has(m.id));
    if (additions.length) {
      setDirectMessages(prev => [...prev, ...additions]);
    }
  }, [privateMessages, activeChat, directMessages]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchedUsers([]);
      return;
    }
    const handler = setTimeout(() => {
      searchUsers(search)
        .then(users => {
          const existing = new Set(conversations.map(c => c.user_id));
          setSearchedUsers(
            users.filter(u => u.id !== user?.id && !existing.has(u.id))
          );
        })
        .catch(err => console.error('User search failed:', err));
    }, 300);
    return () => clearTimeout(handler);
  }, [search, searchUsers, conversations, user]);

  const handleSelectUser = async (u: User) => {
    setActiveChat({ type: 'user', id: u.id, name: u.name });
    try {
      const data = await fetchConversation(u.id);
      setDirectMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !activeChat) return;

    try {
      if (activeChat.type === 'user') {
        const newMessage = await sendDirectMessage(activeChat.id, message);
        setDirectMessages(prev => [...prev, newMessage]);
      } else {
        const newMessage = await sendGroupMessage(activeChat.id, message);
        setGroupMessages(prev => [...prev, newMessage]);
      }
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'hod': return 'bg-blue-600 text-white';
      case 'professor': return 'bg-green-600 text-white';
      case 'student': return 'bg-purple-600 text-white';
      case 'alumni': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayMessages =
    activeChat?.type === 'user' ? directMessages : groupMessages;

  const contacts = conversations.map(c => ({
    id: c.user_id,
    name: c.user_name,
    last: c.last_message,
    unread: c.unread_count,
  }));

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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

          {/* Groups and Contacts */}
          <div className="p-3 border-b">
            <div className="space-y-1">
              {searchedUsers.length > 0 && (
                <div className="pb-2 mb-2 border-b space-y-1">
                  {searchedUsers.map(u => (
                    <Button
                      key={u.id}
                      variant={activeChat?.type === 'user' && activeChat.id === u.id ? 'default' : 'ghost'}
                      className="w-full justify-start h-10 px-3"
                      onClick={() => handleSelectUser(u)}
                    >
                      <MessageSquare className="h-4 w-4 mr-3" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{u.name}</p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(u.role)}`}
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
              {filteredGroups.map((group) => (
                <Button
                  key={group.id}
                  variant={activeChat?.type === 'group' && activeChat.id === group.id ? 'default' : 'ghost'}
                  className="w-full justify-start h-10 px-3"
                  onClick={() => setActiveChat({ type: 'group', id: group.id })}
                >
                  <Users className="h-4 w-4 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{group.name}</p>
                  </div>
                </Button>
              ))}
              {filteredContacts.length > 0 && (
                <div className="pt-2 mt-2 border-t space-y-1">
                  {filteredContacts.map((contact) => (
                    <Button
                      key={contact.id}
                      variant={activeChat?.type === 'user' && activeChat.id === contact.id ? 'default' : 'ghost'}
                      className="w-full justify-start h-10 px-3"
                      onClick={() => setActiveChat({ type: 'user', id: contact.id, name: contact.name })}
                    >
                      <MessageSquare className="h-4 w-4 mr-3" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.last}</p>
                      </div>
                      {contact.unread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {contact.unread}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-4 py-4">
              <div className="space-y-4">
                {displayMessages.map((msg) => {
                  const isOwn =
                    activeChat?.type === 'user'
                      ? (msg as PrivateMessage).sender_id === user?.id
                      : (msg as ChatMessage).senderId === user?.id;
                  const senderName =
                    activeChat?.type === 'user'
                      ? (msg as PrivateMessage).sender_name
                      : (msg as ChatMessage).senderName;
                  const timestamp =
                    activeChat?.type === 'user'
                      ? (msg as PrivateMessage).created_at
                      : (msg as ChatMessage).timestamp;
                  const role =
                    activeChat?.type === 'user'
                      ? null
                      : (msg as ChatMessage).senderRole;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-foreground">
                            {senderName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className={`flex-1 max-w-sm ${isOwn ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{senderName}</span>
                          {activeChat?.type !== 'user' && role && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getRoleBadgeColor(role)}`}
                            >
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
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${
                  activeChat?.type === 'user'
                    ? activeChat.name || contacts.find(c => c.id === activeChat.id)?.name || 'contact'
                    : groups.find(g => g.id === activeChat?.id)?.name || 'group'
                }...`}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="h-4 w-4" />
              </Button>
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : isOpen ? (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          {groups.slice(0, 3).map((group) => (
            <Button
              key={group.id}
              variant={activeChat?.type === 'group' && activeChat.id === group.id ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setActiveChat({ type: 'group', id: group.id })}
            >
              <Users className="h-5 w-5" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ChatSidebar;
