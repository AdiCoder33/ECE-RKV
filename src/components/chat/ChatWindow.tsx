import React, { useMemo, useState, useContext, useRef, useEffect } from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Virtuoso } from 'react-virtuoso';
import { ArrowLeft, Loader2, Phone, Video, Send } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import CameraUpload from './CameraUpload';
import MessageItem from './MessageItem';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';
import { formatIST } from '@/utils/date';
import ChatContext from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProfileImageSrc } from '@/lib/profileImage';

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
  onFileSelect: (file: File, type?: 'image' | 'document') => void;
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
  onClose: _onClose,
  onOpenGroupDialog: _onOpenGroupDialog,
}) => {
  const chat = useContext(ChatContext);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | PrivateMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(el).lineHeight || '20');
      const maxHeight = lineHeight * 5;
      el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    }
  }, [message]);

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

  const convo = chat?.conversations.find(
    c => c.id === activeChat.id && c.type === activeChat.type
  );
  const avatarSrc = getProfileImageSrc(convo?.avatar);
  const statusText =
    activeChat.type === 'direct'
      ? isTyping
        ? 'Typing...'
        : chat?.onlineUsers.has(Number(activeChat.id))
          ? 'Online'
          : 'Offline'
      : 'Group chat';

  const handleHold = (m: PrivateMessage | ChatMessage) => {
    setSelectedMsg(m);
  };


  const handleSend = () => {
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyPress(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e);
  };

  return (
    <>
      <CardHeader className="h-16 px-4 flex items-center justify-between border-b bg-[#8B1F2F]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarSrc ?? '/placeholder.svg'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {activeChat.title.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none">
            <CardTitle className="text-sm font-semibold text-white">{activeChat.title}</CardTitle>
            <span className="text-xs text-white/80">{statusText}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-white">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <Video className="h-5 w-5" />
          </Button>
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
              className="flex-1 px-0 py-3 overflow-x-hidden"
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
      <div className="border-t bg-[#fbeee6] px-4 py-3">
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
          <div className="flex items-center flex-1 bg-[#fdf7f2] rounded-full px-2">
            <EmojiPicker onEmojiSelect={onEmojiSelect} />
            <FileUpload onFileSelect={onFileSelect} disabled={false} />
            <CameraUpload onCapture={(file) => onFileSelect(file, 'image')} />
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChat.title}...`}
              className="flex-1 bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-gray-900 max-h-[7.5rem] overflow-y-auto"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="bg-[#8B1F2F] text-white hover:bg-[#a83246] rounded-full h-10 w-10 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;

