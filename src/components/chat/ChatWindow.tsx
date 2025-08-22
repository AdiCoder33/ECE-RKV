import React, { useMemo, useState, useContext } from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Virtuoso } from 'react-virtuoso';
import { ArrowLeft, UserPlus, X, Loader2, MessageSquare, Pencil, Trash } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MessageItem from './MessageItem';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';
import { formatIST } from '@/utils/date';
import ChatContext from '@/contexts/ChatContext';
import { toast } from '@/components/ui/use-toast';

interface ChatWindowProps {
  activeChat: { type: 'direct' | 'group'; id: string; title: string };
  messages: (PrivateMessage | ChatMessage)[];
  currentUserId?: number;
  typingUsers: Set<number>;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  attachments: { file: File; preview: string }[];
  onFileSelect: (file: File) => void;
  onRemoveAttachment: (idx: number) => void;
  onEmojiSelect: (emoji: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenGroupDialog: () => void;
}

type GroupedItem =
  | { type: 'date'; date: string }
  | { type: 'message'; message: PrivateMessage | ChatMessage };

const ChatWindow: React.FC<ChatWindowProps> = ({
  activeChat,
  messages,
  currentUserId,
  typingUsers,
  loading,
  hasMore,
  loadMore,
  message,
  onMessageChange,
  onKeyPress,
  onSend,
  attachments,
  onFileSelect,
  onRemoveAttachment,
  onEmojiSelect,
  onBack,
  onClose,
  onOpenGroupDialog,
}) => {
  const chat = useContext(ChatContext);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | PrivateMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | PrivateMessage | null>(null);
  const isOwn = selectedMsg
    ? activeChat.type === 'direct'
      ? (selectedMsg as PrivateMessage).sender_id === currentUserId
      : (selectedMsg as ChatMessage).senderId === currentUserId
    : false;

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const items: GroupedItem[] = [];
    let lastDate = '';
    messages
      .filter(m => m.content || m.attachments?.length)
      .forEach(msg => {
        const timestamp =
          activeChat.type === 'direct'
            ? (msg as PrivateMessage).created_at
            : (msg as ChatMessage).timestamp;
        const dateStr = formatIST(timestamp, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        if (dateStr !== lastDate) {
          items.push({ type: 'date', date: dateStr });
          lastDate = dateStr;
        }
        items.push({ type: 'message', message: msg });
      });
    return items;
  }, [messages, activeChat]);

  const isTyping =
    activeChat.type === 'direct' && typingUsers.has(Number(activeChat.id));

  const handleHold = (m: PrivateMessage | ChatMessage) => {
    setSelectedMsg(m);
  };

  const handleDelete = async (m: PrivateMessage | ChatMessage) => {
    try {
      await chat?.deleteMessage(m);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete message',
      });
    } finally {
      setSelectedMsg(null);
    }
  };

  const handleEdit = (m: PrivateMessage | ChatMessage) => {
    onMessageChange({ target: { value: m.content } } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    setEditingMsg(m);
    setSelectedMsg(null);
  };

  const handleSend = () => {
    if (editingMsg) {
      chat
        ?.updateMessage(editingMsg, message)
        .catch(() =>
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update message',
          })
        );
      setEditingMsg(null);
      onMessageChange({ target: { value: '' } } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    } else {
      onSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (editingMsg && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    } else {
      onKeyPress(e);
    }
  };

  return (
    <>
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#8B1F2F] via-[#a83246] to-[#8B1F2F] rounded-t-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg text-white font-bold">{activeChat.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            {selectedMsg ? (
              isOwn ? (
                <>
                  <Button
                    className="bg-[#fbeee6] text-[#8B1F2F] hover:bg-[#f5e6e9] rounded shadow px-3 py-1 text-xs font-semibold"
                    onClick={() => handleEdit(selectedMsg)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    className="bg-[#8B1F2F] text-white hover:bg-[#a83246] rounded shadow px-3 py-1 text-xs font-semibold"
                    onClick={() => handleDelete(selectedMsg)}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </>
              ) : (
                <span className="text-xs text-white self-center italic">Not your message</span>
              )
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={onOpenGroupDialog} className="text-white">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden text-white">
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col chat-bg-whatsapp">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <Virtuoso
              data={groupedItems}
              startReached={() => hasMore && loadMore()}
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
                return (
                  <MessageItem
                    message={item.message}
                    isGroup={activeChat.type !== 'direct'}
                    currentUserId={currentUserId}
                    onHold={handleHold}
                    selected={selectedMsg?.id === item.message.id}
                  />
                );
              }}
            />
            {isTyping && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                User is typing…
              </div>
            )}
          </>
        )}
      </CardContent>
      <div className="border-t bg-[#fbeee6] px-4 py-3 rounded-b-2xl">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, idx) => (
              <AttachmentPreview
                key={idx}
                preview={att.preview}
                filename={att.file.name}
                type={att.file.type.startsWith('image/') ? 'image' : 'file'}
                onRemove={() => onRemoveAttachment(idx)}
              />
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={onMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeChat.title}...`}
            className="flex-1 rounded-lg border-none bg-white focus:ring-2 focus:ring-[#8B1F2F] text-gray-900"
            style={{ minHeight: 44 }}
          />
          <EmojiPicker onEmojiSelect={onEmojiSelect} />
          <FileUpload onFileSelect={onFileSelect} disabled={false} />
          <Button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="bg-[#8B1F2F] text-white hover:bg-[#a83246] rounded-lg shadow px-4 py-2"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;

