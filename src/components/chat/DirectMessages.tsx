import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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

const DirectMessages: React.FC = () => {
  const {
    conversations,
    privateMessages,
    fetchConversations,
    fetchConversation,
    sendPrivateMessage,
    markAsRead,
  } = useChat();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations().catch(console.error);
  }, [fetchConversations]);

  useEffect(() => {
    if (selected) {
      fetchConversation(selected).then(setMessages).catch(console.error);
      markAsRead(selected).catch(console.error);
    }
  }, [selected, fetchConversation, markAsRead]);

  useEffect(() => {
    if (!selected) return;
    const newMsgs = privateMessages.filter(
      m => m.sender_id === selected || m.receiver_id === selected
    );
    const existing = new Set(messages.map(m => m.id));
    const additions = newMsgs.filter(m => !existing.has(m.id));
    if (additions.length) {
      setMessages(prev => [...prev, ...additions]);
    }
  }, [privateMessages, selected, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !selected) return;
    try {
      const msg = await sendPrivateMessage(selected, content);
      setMessages(prev => [...prev, msg]);
      setContent('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-6rem)]">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {conversations.map(c => (
                <Button
                  key={c.user_id}
                  variant={selected === c.user_id ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => setSelected(c.user_id)}
                >
                  <span>{c.user_name}</span>
                  {c.unread_count > 0 && (
                    <Badge variant="destructive">{c.unread_count}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="md:col-span-3 flex flex-col">
        {selected ? (
          <>
            <CardHeader>
              <CardTitle>
                {conversations.find(c => c.user_id === selected)?.user_name || 'Conversation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`mb-2 flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="bg-secondary rounded p-2 max-w-xs">
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>
            <div className="p-4 flex gap-2">
              <Input
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message"
              />
              <Button onClick={handleSend}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DirectMessages;
