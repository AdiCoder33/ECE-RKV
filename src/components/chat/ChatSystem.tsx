
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
  MoreVertical,
  ArrowLeft,
  Link2,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from '@/types';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import { useNavigate } from 'react-router-dom';

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

const ChatSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<{ type: 'group' | 'user'; id: string } | null>(null);
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{file: File, type: 'image' | 'document'}>>([]);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [search, setSearch] = useState('');
  const {
    messages,
    privateMessages,
    conversations,
    groups,
    fetchGroups,
    fetchGroupMessages,
    sendGroupMessage,
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
          await fetchGroupMessages(activeChat.id);
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

  const handleSendMessage = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || !user || !activeChat) return;

    let messageContent = message;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.file.name).join(', ');
      messageContent += attachedFiles.length > 0 ? `\n📎 Attached: ${fileNames}` : '';
    }

    try {
      if (activeChat.type === 'user') {
        const newMsg = await sendDirectMessage(activeChat.id, messageContent);
        setDirectMessages(prev => [...prev, newMsg]);
      } else {
        await sendGroupMessage(activeChat.id, messageContent);
      }
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

  const filteredMessages =
    activeChat?.type === 'user'
      ? directMessages
      : messages.filter(msg => msg.groupId === activeChat?.id);

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
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 px-4 sm:px-6 md:px-0">
      {/* Channels Sidebar */}
      <Card className="w-full md:w-80 flex flex-col md:max-h-full max-h-48">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chats</CardTitle>
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
              placeholder="Search..."
              className="pl-10 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="space-y-1 px-3">
            {filteredGroups.map((group) => (
              <Button
                key={group.id}
                variant={activeChat?.type === 'group' && activeChat.id === group.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-12 px-3"
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
                    variant={activeChat?.type === 'user' && activeChat.id === contact.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-12 px-3"
                    onClick={() => setActiveChat({ type: 'user', id: contact.id })}
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
                  {activeChat
                    ? activeChat.type === 'user'
                      ? contacts.find(c => c.id === activeChat.id)?.name
                      : groups.find(g => g.id === activeChat.id)?.name
                    : 'Select a chat'}
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
              {filteredMessages.map((msg) => {
                if (activeChat?.type === 'user') {
                  const dm = msg as PrivateMessage;
                  const isOwn = dm.sender_id === user?.id;
                  return (
                    <div
                      key={dm.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-foreground">
                            {dm.sender_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className={`flex-1 max-w-md ${isOwn ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{dm.sender_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(dm.created_at)}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{dm.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                const gm = msg as ChatMessage;
                const isOwn = gm.senderId === user?.id;
                return (
                  <div
                    key={gm.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {gm.senderName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 max-w-md ${isOwn ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{gm.senderName}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(gm.senderRole)}`}
                        >
                          {gm.senderRole.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(gm.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{gm.content}</p>
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
              placeholder={`Message ${
                activeChat?.type === 'user'
                  ? contacts.find(c => c.id === activeChat.id)?.name || 'contact'
                  : groups.find(g => g.id === activeChat?.id)?.name || 'group'
              }...`}
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
