
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
import { ChatMessage } from '@/types';

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
  const [activeChat, setActiveChat] = useState<'section' | 'global'>('section');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: '2',
      senderName: 'Dr. Smith',
      senderRole: 'professor',
      content: 'Good morning everyone! Don\'t forget about tomorrow\'s assignment deadline.',
      timestamp: '2024-01-09T10:30:00Z',
      chatType: 'section',
      section: 'CSE-3A'
    },
    {
      id: '2',
      senderId: '4',
      senderName: 'John Doe',
      senderRole: 'student',
      content: 'Thank you for the reminder, Professor!',
      timestamp: '2024-01-09T10:32:00Z',
      chatType: 'section',
      section: 'CSE-3A'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: message,
      timestamp: new Date().toISOString(),
      chatType: activeChat,
      section: user.section
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
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

  const filteredMessages = messages.filter(msg => msg.chatType === activeChat);

  const channels = [
    { 
      id: 'section', 
      name: user?.role === 'student' ? `${user?.section} Section` : 'My Classes',
      type: 'section',
      unread: 2,
      icon: Users
    },
    { 
      id: 'global', 
      name: 'College Community', 
      type: 'global',
      unread: 1,
      icon: Hash
    }
  ];

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
                  variant={activeChat === channel.id ? 'default' : 'ghost'}
                  className="w-full justify-start h-10 px-3"
                  onClick={() => setActiveChat(channel.id as 'section' | 'global')}
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
            </div>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-4 py-4">
              <div className="space-y-4">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {msg.senderName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 max-w-sm ${msg.senderId === user?.id ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{msg.senderName}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(msg.senderRole)}`}
                        >
                          {msg.senderRole.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
                placeholder={`Message ${activeChat === 'section' ? 'section' : 'community'}...`}
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
