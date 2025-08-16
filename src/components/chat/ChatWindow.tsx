import React, { useMemo } from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Virtuoso } from 'react-virtuoso';
import { ArrowLeft, UserPlus, X, Loader2, MessageSquare } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MessageItem from './MessageItem';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';
import { formatIST } from '@/utils/date';

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

  return (
    <>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{activeChat.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onOpenGroupDialog}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
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
      <div className="border-t p-4">
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
            onKeyDown={onKeyPress}
            placeholder={`Message ${activeChat.title}...`}
            className="flex-1"
          />
          <EmojiPicker onEmojiSelect={onEmojiSelect} />
          <FileUpload onFileSelect={onFileSelect} disabled={false} />
          <Button onClick={onSend} disabled={!message.trim() && attachments.length === 0}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;

