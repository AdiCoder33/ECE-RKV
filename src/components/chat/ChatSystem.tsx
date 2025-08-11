
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
  MoreVertical,
  ArrowLeft,
  Link2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from '@/types';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import { useNavigate } from 'react-router-dom';

const ChatSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<'section' | 'global'>('section');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{file: File, type: 'image' | 'document'}>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { fetchMessages, sendMessage } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await fetchMessages(activeChat);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    if (user) {
      loadMessages();
    }
  }, [activeChat, fetchMessages, user]);

  const handleSendMessage = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || !user) return;

    let messageContent = message;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.file.name).join(', ');
      messageContent += attachedFiles.length > 0 ? `\n📎 Attached: ${fileNames}` : '';
    }

    try {
      const newMessage = await sendMessage(messageContent, activeChat);
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setAttachedFiles([]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = (file: File, type: 'image' | 'document') => {
    setAttachedFiles(prev => [...prev, { file, type }]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 px-4 sm:px-6 md:px-0">
      {/* Channels Sidebar */}
      <Card className="w-full md:w-80 flex flex-col md:max-h-full max-h-48">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Channels</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => navigate('/dashboard/alumni')}
            >
              <Link2 className="h-4 w-4" />
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
        <CardContent className="flex-1 p-0">
          <div className="space-y-1 px-3">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={activeChat === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start h-12 px-3"
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
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg">
                  {activeChat === 'section' 
                    ? (user?.role === 'student' ? `${user?.section} Section Chat` : 'Class Discussion')
                    : 'College Community'
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredMessages.length} messages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'student' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/dashboard/alumni')}
                  title="Alumni Directory"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

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
                  <div className={`flex-1 max-w-md ${msg.senderId === user?.id ? 'text-right' : ''}`}>
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
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
                  <span className="truncate max-w-32">{item.file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4"
                    onClick={() => removeAttachedFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <FileUpload 
              onFileSelect={handleFileSelect}
              disabled={attachedFiles.length >= 5}
            />
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${activeChat === 'section' ? 'section' : 'community'}...`}
              className="flex-1"
            />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() && attachedFiles.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatSystem;
