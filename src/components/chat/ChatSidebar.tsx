
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
  Hash, 
  Users,
  Search,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from '@/types';

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
  const [activeChat, setActiveChat] = useState<'section' | 'global' | string>('section');
  const [isDirect, setIsDirect] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const {
    fetchMessages,
    sendMessage,
    conversations,
    privateMessages,
    fetchConversations,
    fetchConversation,
    sendDirectMessage,
    markAsRead,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, directMessages]);

  useEffect(() => {
    fetchConversations().catch(err => console.error('Failed to load conversations:', err));
  }, [fetchConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (isDirect) {
          const data = await fetchConversation(activeChat);
          setDirectMessages(data);
          markAsRead(activeChat).catch(() => {});
        } else {
          const data = await fetchMessages(activeChat as 'section' | 'global');
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    if (user) {
      loadMessages();
    }
  }, [activeChat, isDirect, fetchConversation, fetchMessages, user, markAsRead]);

  useEffect(() => {
    if (!isDirect) return;
    const newMsgs = privateMessages.filter(
      m => m.sender_id === activeChat || m.receiver_id === activeChat
    );
    const existing = new Set(directMessages.map(m => m.id));
    const additions = newMsgs.filter(m => !existing.has(m.id));
    if (additions.length) {
      setDirectMessages(prev => [...prev, ...additions]);
    }
  }, [privateMessages, isDirect, activeChat, directMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      if (isDirect) {
        const newMessage = await sendDirectMessage(activeChat, message);
        setDirectMessages(prev => [...prev, newMessage]);
      } else {
        const newMessage = await sendMessage(message, activeChat as 'section' | 'global');
        setMessages(prev => [...prev, newMessage]);
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

  const displayMessages = isDirect
    ? directMessages
    : messages.filter(msg => msg.chatType === activeChat);

  const channels = [
    {
      id: 'section',
      name: user?.role === 'student' ? `${user?.section} Section` : 'My Classes',
      type: 'section' as const,
      unread: 2,
      icon: Users
    },
    {
      id: 'global',
      name: 'College Community',
      type: 'global' as const,
      unread: 1,
      icon: Hash
    }
  ];

  const contacts = conversations.map(c => ({
    id: c.user_id,
    name: c.user_name,
    last: c.last_message,
    unread: c.unread_count,
    type: 'dm' as const,
  }));

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
                placeholder="Search channels..."
                className="pl-10 h-9"
              />
            </div>
          </CardHeader>

          {/* Channels */}
          <div className="p-3 border-b">
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChat === channel.id && !isDirect ? 'default' : 'ghost'}
                  className="w-full justify-start h-10 px-3"
                  onClick={() => {
                    setActiveChat(channel.id);
                    setIsDirect(false);
                  }}
                >
                  <channel.icon className="h-4 w-4 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{channel.name}</p>
                  </div>
                  {channel.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {channel.unread}
                    </Badge>
                  )}
                </Button>
              ))}
              {contacts.length > 0 && (
                <div className="pt-2 mt-2 border-t space-y-1">
                  {contacts.map((contact) => (
                    <Button
                      key={contact.id}
                      variant={isDirect && activeChat === contact.id ? 'default' : 'ghost'}
                      className="w-full justify-start h-10 px-3"
                      onClick={() => {
                        setActiveChat(contact.id);
                        setIsDirect(true);
                      }}
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
                  const isOwn = isDirect
                    ? msg.sender_id === user?.id
                    : (msg as ChatMessage).senderId === user?.id;
                  const senderName = isDirect
                    ? msg.sender_name
                    : (msg as ChatMessage).senderName;
                  const timestamp = isDirect
                    ? msg.created_at
                    : (msg as ChatMessage).timestamp;
                  const role = isDirect ? null : (msg as ChatMessage).senderRole;
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
                          {!isDirect && role && (
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
                  isDirect
                    ? conversations.find(c => c.user_id === activeChat)?.user_name || 'contact'
                    : activeChat === 'section'
                      ? 'section'
                      : 'community'
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
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant={activeChat === channel.id ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setActiveChat(channel.id as 'section' | 'global')}
            >
              <channel.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ChatSidebar;
