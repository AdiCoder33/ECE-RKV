import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MoreVertical, ArrowLeft, X, Loader2 } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage, User } from '@/types';
import { formatIST } from '@/utils/date';

interface PrivateMessage {
  id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  message_type: string;
  is_read: number;
}

const ChatConversation: React.FC = () => {
  const { type, id } = useParams<{ type: 'group' | 'user'; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ file: File; type: 'image' | 'document' }>>([]);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
  };

  useEffect(() => {
    fetchGroups().catch(() => {});
    fetchConversations().catch(() => {});
  }, [fetchGroups, fetchConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!id) return;
      setMessagesLoading(true);
      try {
        if (type === 'user') {
          const data = await fetchConversation(Number(id));
          setDirectMessages(data.messages);
          markAsRead('direct', id).catch(() => {});
        } else {
          await fetchGroupMessages(id);
          markAsRead('group', id).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    };
    if (user) {
      loadMessages();
    }
  }, [id, type, fetchConversation, fetchGroupMessages, user, markAsRead]);

  useEffect(() => {
    if (type !== 'user' || !id) return;
    const numericId = Number(id);
    const newMsgs = privateMessages.filter(
      m => m.sender_id === numericId || m.receiver_id === numericId,
    );
    const existing = new Set(directMessages.map(m => m.id));
    const additions = newMsgs.filter(m => !existing.has(m.id));
    if (additions.length) {
      setDirectMessages(prev => [...prev, ...additions]);
    }
  }, [privateMessages, id, type, directMessages]);

  useEffect(() => {
    const relevant =
      type === 'user'
        ? directMessages
        : messages.filter(msg => msg.groupId === id);
    const last = relevant[relevant.length - 1] as
      | PrivateMessage
      | ChatMessage
      | undefined;
    const senderId =
      last && 'sender_id' in last
        ? (last as PrivateMessage).sender_id
        : (last as ChatMessage | undefined)?.senderId;
    if (last && isAtBottom && senderId === user?.id) {
      scrollToBottom();
    }
  }, [directMessages, messages, type, id, isAtBottom, user?.id]);

  const handleSendMessage = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || !id) return;

    let messageContent = message;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.file.name).join(', ');
      messageContent += attachedFiles.length > 0 ? `\n📎 Attached: ${fileNames}` : '';
    }

    try {
      if (type === 'user') {
        const newMsg = await sendDirectMessage(Number(id), messageContent);
        if (newMsg) setDirectMessages(prev => [...prev, newMsg]);
      } else {
        await sendGroupMessage(id, messageContent);
      }
      setMessage('');
      setAttachedFiles([]);
      scrollToBottom();
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const atBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 20;
    setIsAtBottom(atBottom);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600 text-white';
      case 'hod':
        return 'bg-blue-600 text-white';
      case 'professor':
        return 'bg-green-600 text-white';
      case 'student':
        return 'bg-purple-600 text-white';
      case 'alumni':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatTime = (timestamp: string) =>
    formatIST(timestamp, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const contacts = conversations
    .filter(c => c.type === 'direct')
    .map(c => ({ id: c.id, name: c.title }));

  const chatName = type === 'user'
    ? contacts.find(c => c.id === id)?.name
    : groups.find(g => g.id === id)?.name;

  const filteredMessages = type === 'user'
    ? directMessages
    : messages.filter(msg => msg.groupId === id);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 px-4 sm:px-6 md:px-0">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/chat')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg">{chatName || 'Conversation'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredMessages.length} messages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileUpload
                onFileSelect={handleFileSelect}
                disabled={attachedFiles.length >= 5}
              />
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea
              ref={scrollAreaRef}
              className="h-full px-4 py-4"
              onScroll={handleScroll}
            >
              <div className="space-y-4">
                {filteredMessages.map(msg => {
                  if (type === 'user') {
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
                        <div className={`w-full pr-8 ${isOwn ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{dm.sender_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(dm.created_at)}
                            </span>
                          </div>
                          <div
                            className={`inline-block max-w-[80%] break-words break-all p-3 rounded-lg ${
                              isOwn
                                ? 'ml-auto bg-primary text-primary-foreground'
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
                      <div className={`w-full pr-4 ${isOwn ? 'text-right' : ''}`}>
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
                          className={`inline-block max-w-[80%] break-words break-all p-3 rounded-lg ${
                            isOwn
                              ? 'ml-auto bg-primary text-primary-foreground'
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
          )}
        </CardContent>
        <div className="border-t p-4">
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
              onChange={e => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${
                type === 'user'
                  ? contacts.find(c => c.id === id)?.name || 'contact'
                  : groups.find(g => g.id === id)?.name || 'group'
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

export default ChatConversation;

